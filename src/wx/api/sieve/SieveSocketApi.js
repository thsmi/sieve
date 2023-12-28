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

  // eslint-disable-next-line no-magic-numbers
  const LOG_STATE = (1 << 2);
  // eslint-disable-next-line no-magic-numbers
  const LOG_TRACE = (1 << 5);

  const OLD_CERT_API = 5;

  /**
   * A simple TCP socket implementation.
   */
  class SieveSocket {

    /**
     * Constructs a new Sieve Socket object.
     *
     * The constructor neither creates nor connects the socket.
     * You need to do this by calling the corresponding functions.
     *
     * @param {string} host
     *   the host name to which to connect
     * @param {int} port
     *   the host's port
     * @param {int} level
     *   enable logging debug messages
     */
    constructor(host, port, level) {
      this.socket = null;

      this.host = host;
      this.port = Number.parseInt(port, 10);
      this.level = Number.parseInt(level, 10);

      this.handler = {};
    }

    /**
     * Logs a message via the attached log handler.
     * In case no log handler is attached the message will be silently
     * discarded
     *
     * @param {string} message
     *   the message to be logger.
     */
    log(message) {

      if (!(this.level & LOG_STATE))
        return;

      if (this.level & LOG_TRACE) {
        // eslint-disable-next-line no-console
        console.trace(`[${(new Date()).toISOString()}] [${this.port}] ${message}`);
        return;
      }

      // eslint-disable-next-line no-console
      console.log(`[${(new Date()).toISOString()}] [${this.port}] ${message}`);
    }

    /**
     * Connects to the remote server.
     */
    connect() {
      this.log(`[SieveSocketApi:connect()] Connecting to ${this.host}:${this.port}, ...`);

      this.socket = new TCPSocket(this.host, this.port, {
        binaryType : "arraybuffer",
        useSecureTransport: false
      });

      this.socket.onopen = () => { this.onOpen(); };
      this.socket.onerror = (event) => { this.onError(event); };
    }

    /**
     * Called when the connection to the server is established.
     */
    onOpen() {
      this.log(`[SieveSocketApi:onOpen()] ... connected to ${this.host}:${this.port}, ready for data.`);

      this.socket.ondata = (event) => { this.onData(event); };
      this.socket.onclose = () => { this.onClose(); };

      /* this.socket.transport.setTimeout(
        Ci.nsISocketTransport.TIMEOUT_READ_WRITE,
        12345
      )*/
    }

    /**
     * Called whenever data is received via the socket.
     *
     * @param {TCPSocketEvent} event
     *   the event containing the data.
     */
    async onData(event) {
      this.log(`[SieveSocketApi:onData()] Data received...`);

      // It is an arraybuffer but we need an Uint8Array
      const data = new Uint8Array(event.data);

      if (!data.length)
        return;

      if (!this.handler)
        return;

      if (!this.handler.onData)
        return;

      this.log(`[SieveSocketApi:onData()] ... invoking handler.`);
      this.handler.onData(data);
    }

    /**
     * Called when ever the connection is closed.
     */
    onClose() {
      this.log("[SieveSocketApi:onClose()] Connection close event ...");

      if (this.handler && this.handler.onClose) {
        this.log(`[SieveSocketApi:onClose()] ... calling close handler.`);
        this.handler.onClose();
      }

      this.disconnect();
    }

    /**
     * Checks if the error event is certificate related.
     *
     * @param {TCPSocketErrorEvent} event
     *   the event to be checked.
     *
     * @returns {boolean}
     *   true in case is is a certificate related error otherwise false.
     */
    isCertError(event) {
      // Is it the name or the type?
      // What is the message?
      return (event.message === "SecurityCertificate");
    }

    /**
     * Tries to get the reason why the certificate handshake failed.
     *
     * @param {SecurityInfo} secInfo
     *   the security info to be analyzed.
     *
     * @returns {object}
     *   an clonable structure which describes the certificate error or null.
     */
    getCertError(secInfo) {
      this.log(`[SieveSocketApi:getCertError()] Converting cert error...`);

      if (!secInfo) {
        this.log(`[SieveSocketApi:getCertError()] ... not a secure socket, skipping`);
        return null;
      }

      const rv = {
        "type" : "CertValidationError",
        "host": this.host,
        "port": this.port,

        "rawDER": secInfo.serverCert.getRawDER({}),
        "fingerprint": secInfo.serverCert.sha256Fingerprint,

        "message": secInfo.errorCodeString,
        "isDomainMismatch": secInfo.isDomainMismatch,
        "isExtendedValidation": secInfo.isExtendedValidation,
        "isNotValidAtThisTime": secInfo.isNotValidAtThisTime,
        "isUntrusted": secInfo.isUntrusted
      };

      this.log(`[SieveSocketApi:getCertError()] ... done`);
      return rv;
    }

    /**
     * Converts the error event into a flat an clobable error object
     * which can be transferred via ipc.
     *
     * @param {TCPSocketErrorEvent} event
     *   the event to be analyzed and converted.
     *
     * @returns {object}
     *   the error object or null.
     */
    async getError(event) {
      this.log(`[SieveSocketApi:getError()] Converting error...`);

      if (!TCPSocketErrorEvent.isInstance(event)) {
        this.log(`[SieveSocketApi:getError()] ... not a socket error event, skipping.`);
        return null;
      }

      if (this.isCertError(event)) {
        return this.getCertError(
          await (event.target.transport?.tlsSocketControl?.asyncGetSecurityInfo()));
      }

      return this.getSocketError(event);
    }

    /**
     * Converts the error event into an socket error object.
     *
     * @param {TCPSocketErrorEvent} event
     *  the event to be analyzed and converted.
     *
     * @returns {object}
     *   a serializable message containing the error details.
     */
    getSocketError(event) {

      const status = event.errorCode;

      this.log(`[SieveSocketApi:getSocketError()] Converting socket error ${status.toString(STRING_AS_HEX)}...`);

      const error = {
        "type": "SocketError",
        "status": status,
        "message" : `Socket failed with error: ${event.message} / ${event.name} (${status.toString(STRING_AS_HEX)})`
      };

      this.log(`[SieveSocketApi:getSocketError()] ... done`);
      return error;
    }


    /**
     * Called whenever the socket runs into an error.
     *
     * @param {TCPSocketErrorEvent} event
     *   the event containing the details for the error.
     */
    async onError(event) {

      this.log(`[SieveSocketApi:onError()] Calling error handler ...`);

      const error = await this.getError(event);
      this.socket.close();

      if (!this.handler)
        return;

      if (!this.handler.onError)
        return;

      this.log(`[SieveSocketApi:onError()] ... calling error handler ...`);
      this.handler.onError(error);

      this.log(`[SieveSocketApi:onError()] ... done`);
    }

    /**
     * Sends the given byte array via the socket.
     *
     * @param {int[]} bytes
     *   the data to be send.
     */
    send(bytes) {

      this.log("[SieveSocketApi:send()] Sending data...");

      if (!this.isAlive()) {
        this.log(`[SieveSocketApi:send()] ... error socket is not open`);
        throw new Error("Socket not in open state");
      }

      // Needs to be an ArrayBuffer instance otherwise it will be send as string.
      this.socket.send(
        (new Uint8Array(bytes)).buffer);

      this.log("[SieveSocketApi:send()] ... data sent");
    }

    /**
     * Checks if the socket is still alive.
     *
     * @returns {boolean}
     *   true in case the socket is alive otherwise false.
     */
    isAlive() {
      if (!this.socket)
        return false;

      return this.socket.readyState === "open";
    }

    /**
     * Starts upgrading to a secure connection.
     *
     * This calls is async an non blocking. In case the upgrade fails the
     * connection will be automatically closed by thunderbird. Which will
     * trigger onStopRequest to be called. The request object can then be used
     * to analyze what caused the error.
     */
    async startTLS() {

      this.log("[SieveSocketApi:startTLS()] Requesting upgrade to secure...");

      if (!this.isAlive()) {
        this.log(`[SieveSocketApi:startTLS()] ... error socket is not open`);
        throw new Error("Socket not in open state");
      }

      this.socket.upgradeToSecure();

      this.log("[SieveSocketApi:startTLS()] ... socket upgraded.");
    }

    /**
     * Disconnects from the remote socket.
     * In case the socket is already disconnected it will fail silently.
     * So calling disconnect multiple times is perfectly fine.
     *
     * After disconnecting the onClose handler will be fired.
     */
    disconnect() {

      if (!this.socket)
        return;

      this.socket.close();
      this.socket = null;
    }

    /**
     * Attaches or detaches an event listener to this socket
     *
     * Existing event listeners with the same name will be replace.
     * In case  the callback is omitted the existing event listener will be removed.
     *
     * Currently the following listeners are supported:
     *
     * data  - called upon data received.
     * error - called in case the connection was terminated because of an error.
     *         Will be directly followed by a close message.
     * close - called whenever the connection was closed.
     * log   - called whenever something should forwarded to the logger.
     *
     * Unknown names will fail with an exception.
     *
     * @param {string} name
     *   the event listener's name
     * @param {Function} [callback]
     *   the optional callback to be invoked upon the event. It will replace
     *   the previous event listener with the same name.
     */
    on(name, callback) {
      if (name === "data") {
        this.handler.onData = callback;
        return;
      }

      if (name === "error") {
        this.handler.onError = callback;
        return;
      }

      if (name === "close") {
        this.handler.onClose = callback;
        return;
      }

      throw new Error(`Invalid event handler ${name}`);
    }

  }


  // We use this to track all open sockets.
  // So that we can do a clean shutdown.
  const sockets = new Map();

  /**
   * Checks if the given socket exists.
   *
   * @param {string} socket
   *   the sockets unique id.
   * @returns {boolean}
   *   true in case the socket exists otherwise false.
   */
  function hasSocket(socket) {
    return sockets.has(socket);
  }

  /**
   * Gets the socket for the given id.
   *
   * @param {string} socket
   *   the sockets unique id.
   * @returns {SieveSocket}
   *   a reference to the socket object or an exception.
   */
  function getSocket(socket) {
    if (!sockets.has(socket))
      throw new Error(`Unknown socket id ${socket}`);

    return sockets.get(socket);
  }


  /**
   * Implements a webextension api for sieve session and connection management.
   */
  class SieveSocketApi extends ExtensionCommon.ExtensionAPI {

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
          for (const key of sockets.keys()) {
            sockets[key].destroy();
            sockets.delete(key);
          }
        }
      });

      return {
        sieve: {
          socket: {

            /**
             * Creates a socket which can be connected to the remote server.
             *
             * @param {string} host
             *   the remote server's hostname.
             * @param {string} port
             *   the remote server's port.
             * @param {int} level
             *   true in case logging should be enabled.
             *
             * @returns {string}
             *   return the unique id.
             */
            async create(host, port, level) {

              const socket = new SieveSocket(host, port, level);

              const id = Math.random().toString(STRING_AS_HEX).substr(HEX_PREFIX_LEN, HEX_UINT32_LEN)
                + "-" + Math.random().toString(STRING_AS_HEX).substr(HEX_PREFIX_LEN, HEX_UINT16_LEN)
                + "-" + Math.random().toString(STRING_AS_HEX).substr(HEX_PREFIX_LEN, HEX_UINT16_LEN)
                + "-" + Math.random().toString(STRING_AS_HEX).substr(HEX_PREFIX_LEN, HEX_UINT16_LEN)
                + "-" + Math.random().toString(STRING_AS_HEX).substr(HEX_PREFIX_LEN, HEX_UINT48_LEN);

              sockets.set(id, socket);

              return id;
            },

            /**
             * Connects the socket to the remote server.
             *
             * @param {string} socket
             *   the socket's unique id.
             */
            async connect(socket) {
              await (getSocket(socket).connect());
            },

            /**
             * Upgrades the socket to be secure.
             *
             * @param {string} socket
             *   the socket's unique id.
             */
            async startTLS(socket) {
              await (getSocket(socket).startTLS());
            },

            /**
             * Sends data to the remote socket.
             *
             * @param {string} socket
             *   the socket's unique id.
             * @param {int[]} bytes
             *   the data to send as byte array.
             */
            async send(socket, bytes) {
              await (getSocket(socket).send(bytes));
            },

            /**
             * Checks if the socket isAlive.
             *
             * @param {string} socket
             *   the socket's unique id.
             * @returns {boolean}
             *   true in case the socket is active otherwise false.
             */
            async isAlive(socket) {
              if (!hasSocket(socket))
                return false;

              return await (getSocket(socket).isAlive());
            },

            /**
             * Disconnects from the remote server.
             *
             * @param {string} socket
             *   the socket's unique id.
             */
            async disconnect(socket) {

              // We can skip in case the socket is already cleaned up.
              if (!hasSocket(socket))
                return;

              await (getSocket(socket).disconnect());
            },

            /**
             * Destroys and disconnects the remote server connection.
             *
             * @param {string} socket
             *   the socket's unique id.
             */
            async destroy(socket) {

              if (!hasSocket(socket))
                return;

              await this.disconnect(socket);

              sockets.delete(socket);
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

              // The constructX509 has an incompatible change.
              // While newer version consume an array, older version use strings.
              // This magic is only needed for thunderbird 68
              let cert = null;
              try {
                // Try first with the new api..
                cert = certDB.constructX509(rawDER);
              } catch (ex) {

                if (ex.name !== "NS_ERROR_FAILURE")
                  throw ex;

                // ... other wise the use the old api.
                cert = "";
                for (const ch of rawDER)
                  cert += (String.fromCharCode(ch));

                cert = certDB.constructX509(cert);
              }

              // The API got changed in Thunderbird 91 it has now six
              // instead of five arguments.
              if (overrideService.rememberValidityOverride.length === OLD_CERT_API) {
                // Five arguments means fallback to the old api
                overrideService.rememberValidityOverride(
                  host, port, cert, flags, false);
              } else {
                // Not equal to five arguments it is the new api
                overrideService.rememberValidityOverride(
                  host, port, {}, cert, flags, false);
              }
            },

            // Event handlers...
            /**
             * The OnData handler is called whenever data is received.
             */
            onData: new ExtensionCommon.EventManager({
              context,
              name: "sieve.socket.onData",
              register: (fire, socket) => {

                const callback = async (bytes) => {
                  return await fire.async(bytes);
                };

                getSocket(socket).on("data", callback);

                return () => {
                  if (hasSocket(socket))
                    getSocket(socket).on("data");
                };
              }
            }).api(),

            /**
             * The OnError handler is called whenever an error occurred.
             * The close event will be called directly after.
             */
            onError: new ExtensionCommon.EventManager({
              context,
              name: "sieve.socket.onError",
              register: (fire, socket) => {

                const callback = async (error) => {
                  return await fire.async(error);
                };

                getSocket(socket).on("error", callback);

                return () => {
                  if (hasSocket(socket))
                    getSocket(socket).on("error");
                };
              }
            }).api(),

            /**
             * The OnClose handler is called whenever the connection to the
             * remote server was closed.
             */
            onClose: new ExtensionCommon.EventManager({
              context,
              name: "sieve.socket.onClose",
              register: (fire, socket) => {

                const callback = async () => {
                  return await fire.async();
                };

                getSocket(socket).on("close", callback);

                return () => {
                  if (hasSocket(socket))
                    getSocket(socket).on("close");
                };
              }
            }).api()

          }
        }
      };
    }
  }

  exports.SieveSocketApi = SieveSocketApi;

})(this);
