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
  /* global Services */

  // Input & output stream constants.
  const STREAM_BUFFERED = 0;

  const DEFAULT_SEGMENT_SIZE = 0;
  const DEFAULT_SEGMENT_COUNT = 0;

  const TRANSPORT_SECURE = 1;

  const OLD_TRANSPORT_API = 4;
  const REALLY_OLD_TRANSPORT_API = 5;

  const STRING_AS_HEX = 16;

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  // const Cu = Components.utils;
  const Cr = Components.results;


  const HEX_PREFIX_LEN = 2;
  const HEX_UINT16_LEN = 4;
  const HEX_UINT32_LEN = 8;
  const HEX_UINT48_LEN = 12;

  const STATE_CLOSED = 0;
  const STATE_CONNECTING = 1;
  const STATE_OPEN = 2;
  const STATE_CLOSING = 3;

  const SOCKET_STATUS = {
    // eslint-disable-next-line no-magic-numbers
    0x804B0003 : "resolving",
    // eslint-disable-next-line no-magic-numbers
    0x804B000B : "resolved",
    // eslint-disable-next-line no-magic-numbers
    0x804B0007 : "connecting",
    // eslint-disable-next-line no-magic-numbers
    0x804B0004 : "connected",
    // eslint-disable-next-line no-magic-numbers
    0x804B0005 : "sending",
    // eslint-disable-next-line no-magic-numbers
    0x804B000A : "waiting",
    // eslint-disable-next-line no-magic-numbers
    0x804B0006 : "receiving",
    // eslint-disable-next-line no-magic-numbers
    0x804B000C : "tls handshake stated",
    // eslint-disable-next-line no-magic-numbers
    0x804B000D : "tls handshake stopped"
  };

  const NS_BASE_STREAM_CLOSED = 0x80470002;
  const NS_ERROR_FAILURE = 0x80004005;
  const NS_FAILURE_FLAG = 0x80000000;

  // eslint-disable-next-line no-magic-numbers
  const LOG_STATE = (1 << 2);
  // eslint-disable-next-line no-magic-numbers
  const LOG_TRACE = (1 << 5);

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

      this.outstream = null;
      this.instream = null;

      this.binaryOutStream = null;
      this.buffer = [];

      this.state = STATE_CLOSED;

      this.handler = {};

      this.thread = Cc["@mozilla.org/thread-manager;1"]
        .getService(Ci.nsIThreadManager)
        .mainThread;
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

      // The createTransport API changed several times so we need some magic.
      //
      // We currently have to support three versions. Thunderbird before 69 take
      // five arguments. Between 69 and 89 take four arguments and after 89 they
      // are back to five.

      // We know if it is before 78 we need to test if it is the really old API
      if (Services.vc.compare(Services.appinfo.platformVersion, "78.0") < 0) {
        if (transportService.createTransport.length === REALLY_OLD_TRANSPORT_API)
          return transportService.createTransport(["starttls"], TRANSPORT_SECURE, this.host, this.port, proxyInfo);
      }

      // After 78 we know it is either the old or the new api.
      if (transportService.createTransport.length === OLD_TRANSPORT_API)
        return transportService.createTransport(["starttls"], this.host, this.port, proxyInfo);

      return transportService.createTransport(["starttls"], this.host, this.port, proxyInfo, null);
    }

    /**
     * Connects to the remote server via the given proxy.
     *
     * @param {*} [proxy]
     *   the optional proxy information. If omitted a proxy lookup is performed.
     */
    connect(proxy) {
      this.log(`[SieveSocketApi:connect()] Preparing connection to ${this.host}:${this.port}, ...`);

      // If we know the proxy setting, we can do a shortcut...
      if (proxy) {
        this.log("[SieveSocketApi:connect()] ... proxy info ready.");
        this.onProxyAvailable(null, null, proxy[0], null);
        return;
      }

      this.log(`Lookup Proxy Configuration for x-sieve://${this.host}:${this.port} ...`);

      const ios = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);

      // const uri = ios.newURI("x-sieve://" + this.host + ":" + this.port, null, null);
      const uri = ios.newURI(`http://${this.host}:${this.port}`, null, null);

      const pps = Cc["@mozilla.org/network/protocol-proxy-service;1"]
        .getService(Ci.nsIProtocolProxyService);
      pps.asyncResolve(uri, 0, this);

      this.log("[SieveSocketApi:connect()] ... waiting for proxy info.");
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

      this.log("[SieveSocketApi:startTLS()] Requesting upgrade to secure...");

      if (this.state !== STATE_OPEN)
        throw new Error("Socket not in open state");

      const control = this.socket.securityInfo
        .QueryInterface(Ci.nsISSLSocketControl);

      if (!control)
        throw new Error("Socket can not be upgraded.");

      control.StartTLS();

      this.log("[SieveSocketApi:startTLS()] ... done");
    }

    /**
     * Signals a change in the transport status.
     * We use it only to detect the point when we are connected and
     * ready to send and receive data.
     *
     * @param {nsITransport} transport
     *   the transport which triggered this status update
     * @param {int} status
     *   the status as error code
     * @param {int} progress
     *   the amount of data read or written depending on the status code.
     * @param {int} progressMax
     *   the maximum amount of data which will be read or written.
     */
    // eslint-disable-next-line no-unused-vars
    onTransportStatus(transport, status, progress, progressMax) {

      this.log(`[SieveSocketApi:onTransportStatus()] Status change to `
        + `${SOCKET_STATUS[status]} (${status.toString(STRING_AS_HEX)}) ...` );

      if (status !== Ci.nsISocketTransport.STATUS_CONNECTED_TO) {
        this.log("[SieveSocketApi:onTransportStatus()] ... ignored" );
        return;
      }

      this.state = STATE_OPEN;
      this.registerAsyncWait(this.instream.QueryInterface(Ci.nsIAsyncInputStream));

      this.log("[SieveSocketApi:onTransportStatus()] ... socket now in open state");
    }

    /**
     * Wait async for the input stream to have new data.
     *
     * @param {nsIAsyncInputStream} stream
     *   the input stream for which should be waited.
     */
    registerAsyncWait(stream) {
      this.log(`[SieveSocketApi:registerAsyncWait()] Registering async callback ...` );

      if (!stream)
        throw new Error("Invalid input stream");

      if (!stream.asyncWait)
        throw new Error("Not an async stream");

      const threads = Cc["@mozilla.org/thread-manager;1"]
        .getService(Ci.nsIThreadManager);

      // this.log(threads.mainThread);
      // this.log(threads.currentThread);
      // this.log(threads.mainThreadEventTarget);

      stream
        .asyncWait(this, 0, 0, threads.mainThread);

      this.log(`[SieveSocketApi:registerAsyncWait()] ... done` );
    }


    /**
     * Analyzes if the exception is an error and if so it calls the error
     * handler if available.
     *
     * @param {Error} ex
     *   the error to be analyzed
     */
    onInputStreamError(ex) {

      this.log(`[SieveSocketApi:onInputStreamError()] Parsing error information...`);
      let status = NS_ERROR_FAILURE;

      if (ex.result)
        status = ex.result;

      // In case we are closing the socket we expect a stream closed error...
      if (((this.state === STATE_CLOSING) || (this.state === STATE_CLOSED)) && (status === NS_BASE_STREAM_CLOSED)) {
        this.log(`[SieveSocketApi:onInputStreamError()] ... skipping, closing stream on a closing socket`);
        return;
      }

      // In case is it is no error code we can skip.
      if (!(status & NS_FAILURE_FLAG)) {
        this.log(`[SieveSocketApi:onInputStreamError()] ... skipping, `
          + `${status.toString(STRING_AS_HEX)} is not an error code`);
        return;
      }

      const error = this.getError(status);

      if (this.handler && this.handler.onError) {
        this.log(`[SieveSocketApi:onInputStreamError()] ... calling error handler ...`);
        (async () => { this.handler.onError(error); })();
      }

      this.log(`[SieveSocketApi:onInputStreamError()] ... done`);
      return;
    }

    /**
     * Calls by the async wait method whenever new data is available
     * or the stream was closed.
     *
     * @param {nsIAsyncInputStream} stream
     *   the stream with the input data.
     */
    onInputStreamReady(stream) {

      this.log(`[SieveSocketApi:onInputStreamReady()] Reading data...`);

      try {
        // Check if we have data.
        // This will throw in case the connection was refused or closed.
        const count = stream.available();

        // Ok we got data, so let's read it.
        const data = this.binaryInputStream.readByteArray(count);

        this.log(`[SieveSocketApi:onInputStreamReady()] Reading ${count} bytes...`);

        // And then make sure we get notified as soon as new data arrives.
        this.registerAsyncWait(stream.QueryInterface(Ci.nsIAsyncInputStream));

        // Now it is time to process the data.
        if ((data.length) && (this.handler && this.handler.onData))
          (async() => { this.handler.onData(data); })();

      } catch (ex) {

        this.log(`[SieveSocketApi:onInputStreamReady()] ... failed with an error...`);

        // We ignore any errors after being closed
        if (this.state === STATE_CLOSED) {
          this.log(`[SieveSocketApi:onInputStreamReady()] ... ignoring error socket is closed`);
          return;
        }

        this.log(`[SieveSocketApi:onInputStreamReady()] ... processing error...`);
        this.onInputStreamError(ex);

        this.log(`[SieveSocketApi:onInputStreamReady()] ... disconnecting socket...`);
        this.disconnect();
        this.state = STATE_CLOSED;

        if (this.handler && this.handler.onError) {
          this.log(`[SieveSocketApi:onInputStreamReady()] ... calling close handler...`);
          (async () => { this.handler.onClose(); })();
        }
      }

      this.log(`[SieveSocketApi:onInputStreamReady()] ... done`);
    }

    /**
     * Sends the given data via the socket to the remote sever.
     *
     * @param {byte[]} bytes
     *   the data to be send as byte array.
     */
    send(bytes) {
      this.log(`[SieveSocketApi:send()] Sending ${bytes.length} bytes...`);

      if (this.state !== STATE_OPEN) {
        this.log(`[SieveSocketApi:send()] ... error socket is not open`);
        throw new Error("Socket not in open state");
      }

      this.buffer.push(bytes);

      if (this.buffer.length) {
        this.registerAsyncWait(
          this.outstream.QueryInterface(Ci.nsIAsyncOutputStream));
      }

      // this.binaryOutStream.writeByteArray(bytes, bytes.length);

      this.log(`[SieveSocketApi:send()] ... done`);
    }

    /**
     * Called by the async wait method whenever a write was requested and
     * successfully scheduled.
     *
     * @param {nsIAsyncOutputStream} stream
     *   the output which cause this callback.
     */
    // eslint-disable-next-line no-unused-vars
    onOutputStreamReady(stream) {
      this.log(`[SieveSocketApi:onOutputStreamReady()] Writing data...`);

      if (!this.buffer || !this.buffer.length) {
        this.log(`[SieveSocketApi:onOutputStreamReady()] ... buffer is empty.`);
        return;
      }

      while (this.buffer.length) {
        const bytes = this.buffer.shift();

        this.log(`[SieveSocketApi:onOutputStreamReady()] ... sending from ${bytes.length} buffer...`);

        this.binaryOutStream.writeByteArray(bytes, bytes.length);
        this.binaryOutStream.flush();
      }

      this.log(`[SieveSocketApi:onOutputStreamReady()] ... done`);

      return;
    }

    /**
     * Disconnects from the remote socket.
     * In case the socket is already disconnected it will fail silently.
     * So calling disconnect multiple times is perfectly fine.
     *
     * After disconnecting the onClose handler will be fired.
     */
    disconnect() {

      this.log("[SieveSocketApi:Disconnect()] Disconnecting socket..." );

      if (this.state === STATE_CLOSED || this.state === STATE_CLOSING) {
        this.log("[SieveSocketApi:Disconnect()] ... already done" );
        return;
      }

      this.state = STATE_CLOSING;

      if (this.outstream) {
        this.outstream.close();
        this.outstream = null;
      }

      if (this.instream) {
        this.instream.close();
        this.instream = null;
      }

      this.socket.close(0);
      this.socket = 0;

      this.log("[SieveSocketApi:Disconnect()] ... done" );
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

      } catch {
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
      this.log(`[SieveSocketApi:getCertError()] Converting cert error...`);

      if (!this.socket || !this.socket.securityInfo) {
        this.log(`[SieveSocketApi:getCertError()] ... not a secure socket`);
        return null;
      }

      const secInfo = this.socket.securityInfo.QueryInterface(Ci.nsITransportSecurityInfo);

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
     * Converts the status/error code into an socket error object.
     *
     * It load the official description if available.
     *
     * @param {int} status
     *   the error code to be analyzed
     *
     * @returns {object}
     *   a serializable message containing the error details.
     */
    getSocketError(status) {

      this.log(`[SieveSocketApi:getSocketError()] Converting socket error ${status.toString(STRING_AS_HEX)}...`);

      const error = {
        "type": "SocketError",
        "status": status,
        "message" : `Socket failed with error ${status.toString(STRING_AS_HEX)}`
      };

      try {
        const nssErrorsService = Cc["@mozilla.org/nss_errors_service;1"]
          .getService(Ci.nsINSSErrorsService);

        error.message = nssErrorsService.getErrorMessage(status);
        this.log(`[SieveSocketApi:getSocketError()] ... ${error.message} ...`);
      } catch {
        // do nothing here we fallback to our generic default.
      }

      this.log(`[SieveSocketApi:getSocketError()] ... done`);
      return error;
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

      return this.getSocketError(status);
    }

    /**
     * An async callback for the proxy lookup.
     *
     * @private
     * @param {nsIRequest} request
     *   the request for which the proxy information as requested.
     * @param {nsIChannel} channel
     *   the channel for which the proxy information was requested.
     * @param {nsIProxyInfo} aProxyInfo
     *   the proxy information from the lookup, if null a direct
     *   connection will be used.
     * @param {int} status
     *   the failure code in case the proxy could not be resolved.
     **/
    // eslint-disable-next-line no-unused-vars
    onProxyAvailable(request, channel, aProxyInfo, status) {

      if (aProxyInfo)
        this.log(`Using Proxy: [${aProxyInfo.type}] ${aProxyInfo.host}:${aProxyInfo.port}`);
      else
        this.log("Using Proxy: Direct");

      this.socket = this.createTransport(aProxyInfo);

      this.state = STATE_CONNECTING;

      this.socket.setEventSink(this, this.thread);

      this.instream = this.socket.openInputStream(
        STREAM_BUFFERED, DEFAULT_SEGMENT_SIZE, DEFAULT_SEGMENT_COUNT);
      this.outstream = this.socket.openOutputStream(
        STREAM_BUFFERED, DEFAULT_SEGMENT_SIZE, DEFAULT_SEGMENT_COUNT);

      // this.registerAsyncWait(this.instream.QueryInterface(Ci.nsIAsyncInputStream));

      this.binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"]
        .createInstance(Ci.nsIBinaryInputStream);
      this.binaryInputStream.setInputStream(this.instream);


      this.binaryOutStream =
        Cc["@mozilla.org/binaryoutputstream;1"]
          .createInstance(Ci.nsIBinaryOutputStream);

      this.binaryOutStream.setOutputStream(this.outstream);
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
      // onInputStreamReady
      if (uuid.equals(Ci.nsIInputStreamCallback))
        return this;
      //  onTransportStatus
      if (uuid.equals(Ci.nsITransportEventSink))
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
      const { Services } = ChromeUtils.import(
        "resource://gre/modules/Services.jsm");
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
