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

  // Input & output stream constants.
  const DEFAULT_FLAGS = 0;
  const DEFAULT_SEGMENT_SIZE = 0;
  const DEFAULT_SEGMENT_COUNT = 0;

  const SEGMENT_SIZE = 5000;
  const SEGMENT_COUNT = 2;

  const TRANSPORT_INSECURE = 0;
  const TRANSPORT_SECURE = 1;

  const NEW_TRANSPORT_API = 4;
  const OLD_TRANSPORT_API = 5;

  const STRING_AS_HEX = 16;

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  // const Cu = Components.utils;
  const Cr = Components.results;


  const HEX_PREFIX_LEN = 2;
  const HEX_UINT16_LEN = 4;
  const HEX_UINT32_LEN = 8;
  const HEX_UINT48_LEN = 12;


  /**
   * A simple TCP socket implementation.
   */
  class SieveSocket {

    /**
     *
     * @param {string} host
     *   the host name to which to connect
     * @param {int} port
     *   the host's port
     * @param {boolean} secure
     *   if true a secure socket is created.
     */
    constructor(host, port, secure) {
      this.socket = null;

      this.host = host;
      this.port = parseInt(port, 10);
      this.secure = secure;

      this.outstream = null;
      this.binaryOutStream = null;

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
      if (!this.handler && !this.handler.onLog)
        return;

      this.handler.onLog(message);
    }


    /**
     * We need this wrapper for compatibility. Stating Thunderbird 69
     * Bug 1558726 (https://bugzilla.mozilla.org/show_bug.cgi?id=1558726)
     * introduced a breaking change for this interface.
     *
     * Before the change the first parameter was an array and the second one
     * the array length. After the change the length parameter was removed
     * which causes all the other arguments to shift by one.
     *
     * @private
     *
     * @param {*} [proxyInfo]
     *   optional proxy information.
     *
     * @returns {nsISocketTransportService}
     *   the transport service or throws an exception in case creation failed.
     */
    createTransport(proxyInfo) {

      const transportService =
        Cc["@mozilla.org/network/socket-transport-service;1"]
          .getService(Ci.nsISocketTransportService);

      if (transportService.createTransport.length === NEW_TRANSPORT_API)
        return transportService.createTransport(((this.secure) ? ["starttls"] : []), this.host, this.port, proxyInfo);

      if (transportService.createTransport.length === OLD_TRANSPORT_API) {
        if (this.secure)
          return transportService.createTransport(["starttls"], TRANSPORT_SECURE, this.host, this.port, proxyInfo);

        return transportService.createTransport(null, TRANSPORT_INSECURE, this.host, this.port, proxyInfo);
      }

      throw new Error("Unknown Create Transport signature");
    }

    /**
     * Connects to the remote server via the given proxy.
     *
     * @param {*} [proxy]
     *   the optional proxy information. If omitted a proxy lookup is performed.
     */
    connect(proxy) {
      this.log(`Connecting to ${this.host}:${this.port} ...`);

      // If we know the proxy setting, we can do a shortcut...
      if (proxy) {
        this.onProxyAvailable(null, null, proxy[0], null);
        return;
      }

      this.log(`Lookup Proxy Configuration for x-sieve://${this.host}:${this.port} ...`);

      const ios = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);

      // const uri = ios.newURI("x-sieve://" + this.host + ":" + this.port, null, null);
      const uri = ios.newURI(`http://${this.host}:${this.port}`, null, null);

      this.log(`Connecting to ${uri.hostPort} ...`);

      const pps = Cc["@mozilla.org/network/protocol-proxy-service;1"]
        .getService(Ci.nsIProtocolProxyService);
      pps.asyncResolve(uri, 0, this);
    }

    /**
     * Checks if the socket is still alive.
     *
     * @returns {boolean}
     *   true in case the socket is alive otherwise false.
     */
    isAlive() {
      return this.socket.isAlive();
    }

    /**
     * Starts upgrading to a secure connection.
     *
     * This calls is async an non blocking. In case the upgrade fails the
     * connection will be automatically closed by thunderbird. Which will
     * trigger onStopRequest to be called. The request object can then be used
     * to analyze what caused the error.
     */
    startTLS() {
      const securityInfo = this.socket.securityInfo.QueryInterface(Ci.nsISSLSocketControl);
      securityInfo.StartTLS();
    }

    /**
     * Sends the given data via the socket to the remote sever.
     *
     * @param {byte[]} bytes
     *   the data to be send as byte array.
     */
    send(bytes) {
      this.binaryOutStream.writeByteArray(bytes, bytes.length);
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

      this.binaryOutStream.close();
      this.outstream.close();
      this.socket.close(0);

      this.binaryOutStream = null;
      this.outstream = null;
      this.socket = null;

      if (this.handler && this.handler.onClose)
        this.handler.onClose();
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

      if (name === "log") {
        this.handler.onLog = callback;
        return ;
      }

      throw new Error(`Invalid event handler ${name}`);
    }


    /**
     * Checks if the error code is from the certificate error class.
     * @param {int} code
     *   the code to be checked.
     *
     * @returns {boolean}
     *   true in case it is a certificate error otherwise false.
     */
    isCertError(code) {
      try {
        const nssErrorsService = Cc["@mozilla.org/nss_errors_service;1"]
          .getService(Ci.nsINSSErrorsService);

        const errorClass = nssErrorsService.getErrorClass(code);
        if (errorClass === Ci.nsINSSErrorsService.ERROR_CLASS_BAD_CERT)
          return true;

        return false;
      } catch (ex) {
        this.log(`Failed to extract error class`);
      }

      return false;
    }

    /**
     * Tries to get the reason why the certificate handshake failed.
     *
     * @returns {Exception}
     *   an exception which describes the certificate error or null
     */
    getCertError() {
      if (!this.socket || !this.socket.securityInfo)
        return null;

      const secInfo = this.socket.securityInfo.QueryInterface(Ci.nsITransportSecurityInfo);

      return {
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

    }

    /**
     * Converts the status code into an error object
     * which can be transferred via ipc.
     *
     * @param {int} status
     *   the status code which should be analyzed.
     *
     * @returns {object}
     *   the error object.
     */
    getError(status) {

      if (this.isCertError(status))
        return this.getCertError();

      try {
        const nssErrorsService = Cc["@mozilla.org/nss_errors_service;1"]
          .getService(Ci.nsINSSErrorsService);

        return {
          "type" : "SocketError",
          "status" : status,
          "message" : nssErrorsService.getErrorMessage(status)
        };
      } catch (ex) {
        // do nothing here
      }

      return {
        "type": "SocketError",
        "status": status,
        "message" : `Socket failed with error ${status.toString(16)}`
      };
    }

    /**
     * An async callback for the proxy lookup.
     *
     * @private
     * @param {nsIRequest} request
     *   thr request for which the proxy information as requested.
     * @param {*} aURI
     * @param {*} aProxyInfo
     *   the proxy information from the lookup, if null a direct
     *   connection will be used.
     * @param {*} status
     *
     **/
    // eslint-disable-next-line no-unused-vars
    onProxyAvailable(request, aURI, aProxyInfo, status) {

      if (aProxyInfo)
        this.log(`Using Proxy: [${aProxyInfo.type}] ${aProxyInfo.host}:${aProxyInfo.port}`);
      else
        this.log("Using Proxy: Direct");


      this.socket = this.createTransport(aProxyInfo);

      const threadManager = Cc["@mozilla.org/thread-manager;1"].getService();
      this.socket.setEventSink(this, threadManager.currentThread);

      this.outstream = this.socket.openOutputStream(
        DEFAULT_FLAGS, DEFAULT_SEGMENT_SIZE, DEFAULT_SEGMENT_COUNT);

      this.binaryOutStream =
        Cc["@mozilla.org/binaryoutputstream;1"]
          .createInstance(Ci.nsIBinaryOutputStream);

      this.binaryOutStream.setOutputStream(this.outstream);

      this.instream = this.socket.openInputStream(
        DEFAULT_FLAGS, DEFAULT_SEGMENT_SIZE, DEFAULT_SEGMENT_COUNT);

      const pump = Cc["@mozilla.org/network/input-stream-pump;1"]
        .createInstance(Ci.nsIInputStreamPump);

      pump.init(this.instream, SEGMENT_SIZE, SEGMENT_COUNT, true);

      pump.asyncRead(this, null);
    }


    /**
     * Called when the connection to the remote as is ready.
     *
     * @param {nsIRequest} request
     *   the request which is ready.
     */
    // eslint-disable-next-line no-unused-vars
    onStartRequest(request) {
      this.log(`Connected to ${this.host}:${this.port} ...`);
    }

    /**
     * Called whenever the connection is terminated. And no more communication
     * via this socket is possible.
     *
     * If the disconnect is planned/"graceful", the error code is zero.
     *
     * Otherwise the status indicates what caused this disconnect.
     * Common issues are link loss (e.g. by switching to offline mode, when
     * the network cable is disconnected or when the server closed the connection.)^
     *
     * But the socket may be also closed because of non trivial errors. E.g
     * in case a tls upgrade failed due to an certification validation error.
     *
     * @param {nsIRequest} request
     *   the request which was stopped.
     * @param {int} status
     *   the reason why the stop was called.
     */
    // eslint-disable-next-line no-unused-vars
    onStopRequest(request, status) {

      this.log(`Disconnected from  ${this.host}:${this.port} with status ${status}`);

      // we can ignore this if we are already disconnected.
      if (!this.socket)
        return;

      // Extract the error details.
      let reason = undefined;

      if (status !== Cr.NS_OK) {

        reason = this.getError(status);

        if (this.handler && this.handler.onError)
          this.handler.onError(reason);
      }

      // Stop timeout timer and do the cleanup.
      this.disconnect(reason);
    }

    /**
     * Call as soon as data arrives and needs to be processed.
     *
     * @param {nsIRequest} request
     *   the request object.
     * @param {nsIInputStream} inputStream
     *   the input stream containing the data chunks
     * @param {offset} offset
     *   the offset from the beginning of the stream.
     * @param {int} count
     *   the maximum number of bytes which can be read in this call.
     */
    // eslint-disable-next-line no-unused-vars
    onDataAvailable(request, inputStream, offset, count) {

      const binaryInStream = Cc["@mozilla.org/binaryinputstream;1"]
        .createInstance(Ci.nsIBinaryInputStream);

      binaryInStream.setInputStream(inputStream);

      const data = binaryInStream.readByteArray(count);

      if (this.handler && this.handler.onData)
        this.handler.onData(data);
    }

    /**
     * Implements the Gecko Component Manager's interfaces.
     * So that the JavaScript code can be passed as interface
     * to C++.
     *
     * In case the interface is not supported an NS_ERROR_NO_INTERFACE
     * will be thrown.
     *
     * @param {nsIIDRef} uuid
     *   the interface's unique id to check.
     *
     * @returns {SieveMozClient}
     *   a self reference.
     */
    QueryInterface(uuid) {
      if (uuid.equals(Ci.nsISupports))
        return this;
      // onProxyAvailable...
      if (uuid.equals(Ci.nsIProtocolProxyCallback))
        return this;
      // onDataAvailable...
      if (uuid.equals(Ci.nsIStreamListener))
        return this;
      // onStartRequest and onStopRequest...
      if (uuid.equals(Ci.nsIRequestObserver))
        return this;

      throw Cr.NS_ERROR_NO_INTERFACE;
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
             * @param {boolean} secure
             *   true in case the socket should be upgradable to secure.
             *
             * @returns {string}
             *   return the unique id.
             */
            async create(host, port, secure) {

              const socket = new SieveSocket(host, port, secure);

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

              await this.disconnect();

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

              overrideService.rememberValidityOverride(
                host, port, cert, flags, false);
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

                const callback = async (hadError) => {
                  return await fire.async(hadError);
                };

                getSocket(socket).on("close", callback);

                return () => {
                  if (hasSocket(socket))
                    getSocket(socket).on("close");
                };
              }
            }).api(),

            /**
             * The OnLog handler is called whenever a message should be
             * forwarded to the logger.
             */
            onLog: new ExtensionCommon.EventManager({
              context,
              name: "sieve.socket.onLog",
              register: (fire, socket) => {

                const callback = async (message) => {
                  return await fire.async(message);
                };

                getSocket(socket).on("log", callback);

                return () => {
                  if (hasSocket(socket))
                    getSocket(socket).on("log");
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
