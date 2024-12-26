/*
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

(function (exports) {

  /* global ExtensionCommon */
  /* global Components */
  /* global ChromeUtils */
  /* global globalThis */

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const Cu = Components.utils;

  let Services = globalThis.Services;

  if (!Services)
    Services = ChromeUtils.import("resource://gre/modules/Services.jsm").Services;

  const { TCPSocket, TCPSocketErrorEvent } = Cu.getGlobalForObject(
    ChromeUtils.importESModule("resource://gre/modules/AppConstants.sys.mjs")
  );

  const STRING_AS_HEX = 16;

  const HEX_PREFIX_LEN = 2;
  const HEX_UINT16_LEN = 4;
  const HEX_UINT32_LEN = 8;
  const HEX_UINT48_LEN = 12;

  /**
   * A magic wrapper to prevents races between the TCPSocket Api and the
   * WebExtensions api.
   *
   * Sadly the TCPSocket class suffers from a pretty ugly design flaw.
   * It does heavy weight work in the constructor, which is a strong anti-pattern.
   *
   * TCPSockets run from the main thread. When the constructor is called, they
   * start on a network thread a TCP connection. And return the socket object,
   * to which you then attach the listeners in the same call.
   *
   * Which is perfectly fine in a normal single threaded javascript scenario.
   * As it is single threaded, event's can't interrupt the current call and thus
   * they can't fire before attaching the listeners.
   *
   * But fun starts when WebExtensions join the game. Webextensions run on a
   * different thread. Means you need to create the TCPSocket on the main thread,
   * then send a socket is ready notify the WebExtension thread. The WebExtension
   * thread then processes this notification and calls the main thread to attach
   * the listeners.
   *
   * Guess you see where it backfires. If the connection action an creating the
   * instance would be separate, you would first create the object then add the
   * listeners and then connect. But a the constructor creates and connects in a
   * single shot, you run into the following issue.  If you have a quick responding
   * server e.g. running on localhost, then you have front row seats to a race.
   * In case the attach listener's callback from the WebExtension thread is slower
   * than the first callback from the network thread you are screwed and loose
   * messages from the network thread.
   *
   * The workaround to this design flaw ist this magic wrapper. The webextension
   * thread register events to to this proxy proxy before we call the constructor.
   * Then we can create the TCPSocket object and attach the listeners in a single
   * call and thus avoid any races.
   */
  class Socket {

    /**
     * Creates a new instance
     */
    constructor() {

      this.listeners = new Map();
      this.socket = null;

      // We generate a random UUID4
      this.id = ""
        + Math.random().toString(STRING_AS_HEX).substr(HEX_PREFIX_LEN, HEX_UINT32_LEN) + "-"
        + Math.random().toString(STRING_AS_HEX).substr(HEX_PREFIX_LEN, HEX_UINT16_LEN) + "-"
        + Math.random().toString(STRING_AS_HEX).substr(HEX_PREFIX_LEN, HEX_UINT16_LEN) + "-"
        + Math.random().toString(STRING_AS_HEX).substr(HEX_PREFIX_LEN, HEX_UINT16_LEN) + "-"
        + Math.random().toString(STRING_AS_HEX).substr(HEX_PREFIX_LEN, HEX_UINT48_LEN);
    }

    /**
     * Each socket ha a unique id which can be used to uniquely identify it.
     *
     * @returns {string}
     *   the socket's unique id
     */
    getId() {
      return this.id;
    }

    /**
     * Returns the TCPSocket which is wrapped inside this object.
     * In case the socket is not connected an exception will be thrown.
     *
     * @returns {TCPSocket}
     *   the wrapped tcp socket.
     */
    getRawSocket() {
      if (!this.hasRawSocket())
        throw new Error(`Socket ${this.getId()} initialized not connected to any server`);

      return this.socket;
    }

    /**
     * Checks if the wrapper is backed by a TCPSocket.
     * Only a connected socket has a raw socket.
     *
     * @returns {boolean}
     *   true in case the the socket wrapper contains a TCPSocket.
     */
    hasRawSocket() {
      if (this.socket)
        return true;

      return false;
    }

    /**
     * Destroys the socket wrapper, frees teh TCPClient and and disconnects
     * alls listeners. In case the socket is already disconnected it will
     * fail silently.
     */
    async destroy() {
      if (!this.hasRawSocket())
        return;

      await this.disconnect();

      // we should ensure the socket is closed...
      this.socket = null;
      this.listeners.clear();
    }

    /**
     * Creates a new socket connection and attaches the event listeners.
     * @param {string} host
     *   the remote server's hostname.
     * @param {int} port
     *   the remote server's port.
     * @param {SocketOptions} options
     *   the socket options which should be used when creating the socket
     */
    async connect(host, port, options) {
      if (this.hasRawSocket())
        throw new Error(`Socket id ${this.getId()} already in use`);

      this.socket = new TCPSocket(host, port, {
        binaryType : "arraybuffer",
        useSecureTransport: options.useSecureTransport
      });

      this.socket.onopen = (event) => {
        (this.getListener("onopen"))(event);
      };
      this.socket.ondrain = (event) => {
        (this.getListener("ondrain"))(event);
      };
      this.socket.ondata = (event) => {
        (this.getListener("ondata"))(new Uint8Array(event.data));
      };
      this.socket.onerror = async (event) => {
        // In case of an error we can't do much except trying to close the
        // socket as graceful as possible.
        //
        // Mozilla's socket implementation is at best a bit odd. It sometimes
        // but not always fires a onClose after and onError and sometimes you
        // get more than one onError but no onClose.
        //
        // An in our multithreaded webextension setup we can easily end-up with
        // a race. E.g. when dealing with certificates upon on error we need
        // to asynchronously fetch the certificate's security info via the socket.
        // This in a normal single threaded javascript environment, but in our
        // scenario the security info call races against the server's close event.
        // If security info resolves before the server closes the connection then
        // the order of the events is onerror followed by onclose. If not it is
        // vice versa. which is strangely odd behavior.
        //
        // To make this a bit more saner we simplify error handling we behave
        // somehow like the node.js decided to do. In case on an error we
        // fire only an error and guarantee to close the socket thud no close
        // will be fired.

        // Unregister the error and close handler to avoid double firing.
        const listener = this.getListener("onerror");
        this.deleteListener("onerror");
        this.deleteListener("onclose");

        // Api dictates that the event is TCPSocketErrorEvent
        // if not we don't know what to do.
        if (!TCPSocketErrorEvent.isInstance(event)) {
          this.disconnect();
          listener("Error", { "message" : event.message });
          return;
        }

        // Certificate errors aka security errors need a special handling.
        if (event.name !== "SecurityError") {
          this.disconnect();
          listener(
            "SocketError",
            { "errorCode": event.errorCode, "message": event.message, "name": event.name });
          return;
        }

        this.disconnect();
        listener("SecurityError", await (this.getSecurityInfo()));
      };

      this.socket.onclose = (event) => {
        (this.getListener("onclose"))(event);
      };
    }

    /**
     * Returns the current connection's remote port number.
     *
     * @returns {int}
     *   the remote's port number
     */
    getPort() {
      return this.getRawSocket().port;
    }

    /**
     * Returns the hostname or ip which was used to connect.
     *
     * @returns {string}
     *   the remote's hostname or ip.
     */
    getHost() {
      return this.getRawSocket().host;
    }

    /**
     * Gets the socket's security information if available.
     *
     * @returns {object}
     *   the socket's security information.
     */
    async getSecurityInfo() {

      const secInfo = await (this.getRawSocket().transport?.tlsSocketControl?.asyncGetSecurityInfo());

      if (!secInfo)
        return {};

      return {
        "host": this.getHost(),
        "port": this.getPort(),

        "rawDER": secInfo.serverCert.getRawDER({}),
        "sha256fingerprint": secInfo.serverCert.sha256Fingerprint,
        "sha1fingerprint": secInfo.serverCert.sha1Fingerprint,

        "message": secInfo.errorCodeString,

        "isUntrusted": (secInfo.overridableErrorCategory === Ci.nsITransportSecurityInfo.ERROR_TRUST),
        "isDomainMismatch": (secInfo.overridableErrorCategory === Ci.nsITransportSecurityInfo.ERROR_DOMAIN),
        "isNotValidAtThisTime": (secInfo.overridableErrorCategory === Ci.nsITransportSecurityInfo.ERROR_TIME),
        "isExtendedValidation": secInfo.isExtendedValidation
      };
    }


    /**
     * Disconnects from the remote and closes the socket.
     * It does not disconnect the listeners this needs to be done via destroy.
     * In case the socket is not connected it will fail silently.
     */
    async disconnect() {
      if (!this.hasRawSocket())
        return;

      if (this.getRawSocket().readyState === "closed")
        return;

      await this.getRawSocket().close();
    }

    /**
     * Returns the callback function for the given listener.
     * In case no callback is registered an empty stub is returned.
     *
     * @param {string} name
     *   the event's unique name
     *
     * @returns {Function}
     *   the callback function which is associated wih the listener.
     */
    getListener(name) {
      if (!this.listeners.has(name))
        return () => {};

      return this.listeners.get(name);
    }

    /**
     * Sets the callback for the given listener.
     * If a listener is already bound it will be silently replaced.
     * At most one listener can be registers for an event.
     *
     * @param {string} name
     *   the events to which the callback should be bound to.
     *
     * @param {Function} callback
     *   the listener to register
     */
    setListener(name, callback) {
      this.listeners.set(name, callback);
    }

    /**
     * Removes the callback for the given event.
     * It is fail silent in case the socket or name is unknown.
     *
     * @param {string} name
     *   the event name
     */
    deleteListener(name) {
      this.listeners.delete(name);
    }
  }

  /**
   * Keeps tack of all socket with attached listeners.
   */
  class Sockets {

    /**
     * Creates a new instance.
     */
    constructor() {
      this.sockets = new Map();
    }

    /**
     * Checks if a socket with the given id exists.
     *
     * @param {string} id
     *   the socket's unique id.
     *
     * @returns {boolean}
     *   true in case the socket exists.
     */
    hasSocket(id) {
      return this.sockets.has(id);
    }

    /**
     * Creates a new socket wrapper.
     * Which can be used to register callback handlers.
     *
     * @returns {string}
     *   the socket's unique id.
     */
    createSocket() {
      const socket = new Socket();
      this.sockets.set(socket.getId(), socket);
      return socket.getId();
    }

    /**
     * Gets the socket wrapper by his unique id.
     * In case the socket wrapper does not exists an exception will be thrown.
     *
     * @param {string} id
     *   the socket's unique id.
     * @returns {Socket}
     *   the socket wrapper object
     */
    getSocket(id) {
      if (!this.hasSocket(id))
        throw new Error("Unknown socket");

      return this.sockets.get(id);
    }

    /**
     * Destroys the socket with the given id.
     *
     * In case the socket is connected it will be disconnected.
     * Then all listener will be disconnected and finally the object will be release.
     *
     * @param {string} id
     *   the socket's unique id.
     */
    async destroySocket(id) {
      await this.getSocket(id).destroy();
      this.sockets.delete(id);
    }

    /**
     * In case we are shutting down we are not terminating graceful on the one
     * hand async await won't work and on the other hand we will be anyhow be gone.
     */
    shutdownSockets() {
      for (const id of this.sockets.keys()) {
        this.get(id).destroy();
        this.sockets.delete(id);
      }
    }
  }

  const sockets = new Sockets();

  /**
   * Implements a webextension api for tcp socket.
   */
  class TcpSocket extends ExtensionCommon.ExtensionAPI {

    /**
     * @inheritdoc
     */
    onStartup() {
      // we're not actually interested in startup, we need the event only
      // to ensure this experiment gets loaded.
    }

    /**
     * @inheritdoc
     */
    onShutdown(isAppShutdown) {
      if (isAppShutdown) {
        return;
      }

      // Clear caches that could prevent upgrades from working properly
      Services.obs.notifyObservers(null, "startupcache-invalidate", null);
    }

    /**
     * @inheritdoc
     */
    getAPI(context) {

      context.callOnClose({
        close: () => {
          sockets.shutdownSockets();
        }
      });

      return {
        tcpSocket: {

          /**
           * Creates a unique handle for our socket. The extension uses it to refer
           * to the socket. It is also used to attach the event listeners. Because
           * we need to connect them before connecting the tcp sockets otherwise
           * we generate a race between backend and frontend.
           *
           * @returns {string}
           *   the uuid which is used as handle to for the tcp socket.
           */
          async create() {
            return await sockets.createSocket();
          },

          async destroy(socket) {
            await sockets.destroySocket(socket);
          },

          /**
           * Creates a socket which can be connected to the remote server.
           *
           * @param {string} socket
           *   the socket's unique id.
           *   In case the id is in use an exception will be raised.
           * @param {string} host
           *   the remote server's hostname.
           * @param {int} port
           *   the remote server's port.
           * @param {SocketOptions} options
           *   the socket options which should be used when creating the socket
           */
          async connect(socket, host, port, options) {
            await (sockets.getSocket(socket).connect(host, port, options));
          },

          /**
           * Terminates the socket connection to the remote server.
           * It will fail silent in case socketId is unknown or the socket
           * is already disconnected.
           *
           * You need to destroy the socket after disconnect is completed.
           * E.g. in case of a cert error you need the socket after the
           * disconnect to query the cert status.
           *
           * @param {string} socket
           *   the socket's unique id.
           */
          async disconnect(socket) {
            if (!sockets.hasSocket(socket))
              return;

            await (sockets.getSocket(socket).disconnect());
          },

          /**
           * Upgrades the socket to a secure channel.
           * It will throw in case the socket is not connected
           * or already secured.
           *
           * @param {string} socket
           *   the socket's unique id.
           */
          async upgradeToSecure(socket) {
            await (sockets.getSocket(socket).getRawSocket().upgradeToSecure());
          },

          /**
           * Returns the current connection's remote port number.
           *
           * @param {string} socket
           *   the socket's unique id.
           * @returns {int}
           *   the remote's port number
           */
          async getPort(socket) {
            return sockets.getSocket(socket).getPort();
          },

          /**
           * Returns the hostname or ip which was used to connect.
           *
           * @param {string} socket
           *   the socket's unique id.
           * @returns {string}
           *   the remote's hostname or ip.
           */
          async getHost(socket) {
            return sockets.getSocket(socket).getHost();
          },

          /**
           * Checks if the connection is secure.
           *
           * @param {string} socket
           *   the socket's unique id
           * @returns {boolean}
           *   true in case the socket is upgraded to secure otherwise false.
           */
          async getSSL(socket) {
            return sockets.getSocket(socket).getRawSocket().ssl;
          },

          /**
           * The number of bytes which have previously been buffered by
           * calls to send on this socket.
           *
           * @param {string} socket
           *   the socket's unique id
           * @returns {int}
           *   the buffered amount in bytes.
           */
          async getBufferedAmount(socket) {
            return sockets.getSocket(socket).getRawSocket().bufferedAmount;
          },

          /**
           * Sends the given amount of data as string.
           * It will stop at the end of the string or as soon as it encounters
           * a binary zero, whatever happens first.
           *
           * To send binary data use sendBytes()
           *
           * @param {string} socket
           *   the socket's unique id.
           * @param {string} data
           *   the data to be sent.
           * @returns {boolean}
           *   true in to hint the caller the buffers are empty
           *   and a consecutive call to send will write data immediately
           *   false in case the buffers are full and thus processing
           *   new data will block until the socket drained.
           */
          async send(socket, data) {
            return await(sockets.getSocket(socket).getRawSocket().send(data));
          },

          /**
           * Sends the data as array buffer.
           *
           * @param {string} socket
           *   the socket's unique id.
           * @param {ArrayBuffer} data
           *   the date to be sent.
           * @param {long} [offset]
           *   the optional offset within the byte array.
           *   If omitted the offset will be assumed as zero.
           * @param {long} [length]
           *   the optional maximal number of bytes to be processed.
           *   It will always stop processing data whenever it reaches the array's end.
           *   If omitted the whole array will be transferred.
           * @returns {boolean}
           *   true in to hint the caller the buffers are empty
           *   and a consecutive call to send will write data immediately
           *   false in case the buffers are full and thus processing
           *   new data will block until the socket drained.
           */
          async sendBytes(socket, data, offset, length) {
            return await(sockets.getSocket(socket).getRawSocket().send(data, offset, length));
          },

          /**
           * Returns a string with the ready state.
           *
           * @param {string} socket
           *   the socket's unique id.
           * @returns {string}
           *   either "connecting", "open", "closing" or "closed"
           */
          async getReadyState(socket) {
            return sockets.getSocket(socket).getRawSocket().readyState;
          },

          /**
           * Returns a string with the socket binary type.
           *
           * @param {string} socket
           *   the socket's unique id.
           * @returns {string}
           *   either "arraybuffer" or "string"
           */
          async getBinarySocketType(socket) {
            return sockets.getSocket(socket).getRawSocket().binaryType;
          },

          /**
           * Gets the information about the connection security of the given
           * tcp socket. This information is only available after the connection
           * was upgraded to secure.
           *
           * @param {string} socket
           *   the socket's unique id
           * @returns {object}
           *   the security information provided by the socket.
           */
          async getSecurityInfo(socket) {
            return await (sockets.getSocket(socket).getSecurityInfo());
          },

          /**
           * Add a override for an certificate error.
           *
           * @param {string} host
           *   the server's host name.
           * @param {string} port
           *   the server's port.
           * @param {int[]} rawDER
           *   the certificate which should be overridden as byte array.
           * @param {int} flags
           *   the override flags.
           */
          async addCertErrorOverride(host, port, rawDER, flags) {

            const overrideService = Cc["@mozilla.org/security/certoverride;1"]
              .getService(Ci.nsICertOverrideService);

            const certDB = Cc["@mozilla.org/security/x509certdb;1"]
              .getService(Ci.nsIX509CertDB);

            overrideService.rememberValidityOverride(
              host, port, {}, certDB.constructX509(rawDER), flags, false);
          },

          // Event handlers...
          onOpen: new ExtensionCommon.EventManager({
            context,
            name: "tcpSocket.onOpen",
            register: (callback, socket) => {
              sockets.getSocket(socket).setListener("onopen", callback);

              return () => {
                sockets.getSocket(socket).deleteListener("onopen");
              };
            }
          }).api(),

          onDrain: new ExtensionCommon.EventManager({
            context,
            name: "tcpSocket.onDrain",
            register: (callback, socket) => {
              sockets.getSocket(socket).setListener("ondrain", callback);

              return () => {
                sockets.getSocket(socket).deleteListener("ondrain");
              };
            }
          }).api(),

          onData: new ExtensionCommon.EventManager({
            context,
            name: "tcpSocket.onData",
            register: (callback, socket) => {

              sockets.getSocket(socket).setListener("ondata", async(bytes) => {
                return await callback.async(bytes);
              });

              return () => {
                sockets.getSocket(socket).deleteListener("ondata");
              };
            }
          }).api(),

          onError: new ExtensionCommon.EventManager({
            context,
            name: "tcpSocket.onError",
            register: (callback, socket) => {
              sockets.getSocket(socket).setListener("onerror", async(type, message) => {
                return await callback.async(type, message);
              });

              return () => {
                sockets.getSocket(socket).deleteListener("onerror");
              };
            }
          }).api(),

          onClose: new ExtensionCommon.EventManager({
            context,
            name: "tcpSocket.onClose",
            register: (callback, socket) => {
              sockets.getSocket(socket).setListener("onclose", async(event) => {
                return await callback.async(event);
              });

              return () => {
                sockets.getSocket(socket).deleteListener("onclose");
              };
            }
          }).api()
        }
      };
    }
  }

  // The exported name needs to match the manifest section.
  exports.tcpSocket = TcpSocket;

})(this);
