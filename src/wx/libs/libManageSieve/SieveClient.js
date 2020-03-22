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

  "use strict";

  /* global Components */

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  // const Cu = Components.utils;
  const Cr = Components.results;

  // Handle all imports..
  const { SieveAbstractClient } = require("./SieveAbstractClient.js");
  const { SieveResponseParser } = require("./SieveResponseParser.js");
  const { SieveRequestBuilder } = require("./SieveRequestBuilder.js");

  const { SieveCertValidationException } = require("./SieveExceptions.js");

  const NEW_TRANSPORT_API = 4;
  const OLD_TRANSPORT_API = 5;

  // Input & output stream constants.
  const DEFAULT_FLAGS = 0;
  const DEFAULT_SEGMENT_SIZE = 0;
  const DEFAULT_SEGMENT_COUNT = 0;

  const SEGMENT_SIZE = 5000;
  const SEGMENT_COUNT = 2;


  /**
   *  This realizes the abstract sieve implementation by using
   *  the mozilla specific network implementation.
   */
  class SieveMozClient extends SieveAbstractClient {


    /**
     * Creates a new instance
     * @param {SieveAbstractLogger} logger
     *   the logger which should be used.
     */
    constructor(logger) {

      super();

      this.timeoutTimer = null;
      this.idleTimer = null;

      this.outstream = null;
      this.binaryOutStream = null;

      this._logger = logger;
      this.secure = true;
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

    /**
     * @inheritdoc
     */
    isAlive() {
      if (!super.isAlive(this))
        return false;

      return this.socket.isAlive();
    }

    /**
     * This method secures the connection to the sieve server. By activating
     * Transport Layer Security all Data exchanged is encrypted.
     *
     * Before calling this method you need to request a encrypted connection by
     * sending a startTLSRequest. Invoke this method immediately after the server
     * confirms switching to TLS.
     *
     **/
    async startTLS() {

      await super.startTLS();

      const securityInfo = this.socket.securityInfo.QueryInterface(Ci.nsISSLSocketControl);
      securityInfo.StartTLS();
    }

    /**
     * @inheritdoc
     */
    onStartTimeout() {

      // clear any existing timeouts
      if (this.timeoutTimer)
        this.timeoutTimer.cancel();

      // ensure the idle timer is stopped
      this.onStopIdle();

      // then restart the timeout timer.
      if (this.timeoutTimer)
        this.timeoutTimer.initWithCallback(
          this, this.getTimeoutWait(),
          Components.interfaces.nsITimer.TYPE_ONE_SHOT);

    }

    /**
     * @inheritdoc
     */
    onStopTimeout() {

      // clear any existing timeouts.
      if (this.timeoutTimer)
        this.timeoutTimer.cancel();

      // and start the idle timer
      this.onStartIdle();
    }

    /**
     * Called when the idle timer should be started or restarted
     */
    onStartIdle() {

      // first ensure the timer is stopped..
      this.onStopIdle();

      // ... then configure the timer.
      const delay = this.getIdleWait();

      if (!delay)
        return;

      if (!this.idleTimer)
        return;

      this.idleTimer.initWithCallback(this, delay,
        Components.interfaces.nsITimer.TYPE_ONE_SHOT);
    }

    /**
     * Called when the idle timer should be stopped.
     */
    onStopIdle() {

      if (!this.idleTimer)
        return;

      this.idleTimer.cancel();
    }

    /**
     * When a mozilla timer triggers, it calls this
     * well known method.
     *
     * @param {nsITimer} timer
     *   the timer which caused this callback.
     *
     */
    notify(timer) {

      if (this.idleTimer === timer) {
        (async () => { await this.onIdle(); })();
        return;
      }

      if (this.timeoutTimer === timer) {
        (async () => { await this.onTimeout(); })();
        return;
      }
    }

    /**
     * @inheritdoc
     */
    createParser(data) {
      return new SieveResponseParser(data);
    }

    /**
     *  @inheritdoc
     */
    createRequestBuilder() {
      return new SieveRequestBuilder();
    }

    /**
     * @inheritdoc
     */
    getLogger() {
      return this._logger;
    }

    /**
     * @inheritdoc
     */
    isSecure() {
      return this.secure;
    }

    /**
     * @inheritdoc
     */
    connect(host, port, secure, proxy) {
      if (this.socket)
        return this;

      /* if ( (this.socket != null) && (this.socket.isAlive()) )
        return;*/

      this.host = host;
      this.port = port;
      this.secure = secure;

      this.idleTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
      this.timeoutTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

      this.getLogger().logState(`Connecting to ${this.host}:${this.port} ...`);

      // If we know the proxy setting, we can do a shortcut...
      if (proxy) {
        this.onProxyAvailable(null, null, proxy[0], null);
        return this;
      }

      this.getLogger().logState(`Lookup Proxy Configuration for x-sieve://${this.host}:${this.port} ...`);

      const ios = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);

      // const uri = ios.newURI("x-sieve://" + this.host + ":" + this.port, null, null);
      const uri = ios.newURI(`http://${this.host}:${this.port}`, null, null);

      this.getLogger().logState(`Connecting to ${uri.hostPort}:${this.host} ...`);

      const pps = Cc["@mozilla.org/network/protocol-proxy-service;1"]
        .getService(Ci.nsIProtocolProxyService);
      pps.asyncResolve(uri, 0, this);

      return this;
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
     * @param {string} host
     *   the host name to which to connect
     * @param {int} port
     *   the host's port
     * @param {boolean} secure
     *   if true a secure socket is created.
     * @param {*} [proxyInfo]
     *   optional proxy information.
     *
     * @returns {nsISocketTransportService}
     *   the transport service or throws an exception in case creation failed.
     */
    createTransport(host, port, secure, proxyInfo) {

      const transportService =
        Cc["@mozilla.org/network/socket-transport-service;1"]
          .getService(Ci.nsISocketTransportService);

      if (transportService.createTransport.length === NEW_TRANSPORT_API)
        return transportService.createTransport(((secure) ? ["starttls"] : []), host, port, proxyInfo);

      if (transportService.createTransport.length === OLD_TRANSPORT_API) {
        if (secure)
          return transportService.createTransport(["starttls"], 1, host, port, proxyInfo);

        return transportService.createTransport(null, 0, host, port, proxyInfo);
      }

      throw new Error("Unknown Create Transport signature");
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
    onProxyAvailable( request, aURI, aProxyInfo, status) {

      if (aProxyInfo)
        this.getLogger().logState(`Using Proxy: [${aProxyInfo.type}] ${aProxyInfo.host}:${aProxyInfo.port}`);
      else
        this.getLogger().logState("Using Proxy: Direct");


      this.socket = this.createTransport(this.host, this.port, this.isSecure(), aProxyInfo);

      this.outstream = this.socket.openOutputStream(
        DEFAULT_FLAGS, DEFAULT_SEGMENT_SIZE, DEFAULT_SEGMENT_COUNT);

      this.binaryOutStream =
        Cc["@mozilla.org/binaryoutputstream;1"]
          .createInstance(Ci.nsIBinaryOutputStream);

      this.binaryOutStream.setOutputStream(this.outstream);

      const stream = this.socket.openInputStream(
        DEFAULT_FLAGS, DEFAULT_SEGMENT_SIZE, DEFAULT_SEGMENT_COUNT);

      const pump = Cc["@mozilla.org/network/input-stream-pump;1"]
        .createInstance(Ci.nsIInputStreamPump);

      pump.init(stream, SEGMENT_SIZE, SEGMENT_COUNT, true);

      pump.asyncRead(this, null);
    }

    /**
     * @inheritdoc
     */
    disconnect(reason) {
      super.disconnect(reason);

      if (!this.socket)
        return;

      this.binaryOutStream.close();
      this.outstream.close();
      this.socket.close(0);

      this.binaryOutStream = null;
      this.outstream = null;
      this.socket = null;

      this.idleTimer = null;
      this.timeoutTimer = null;

      this.getLogger().logState("Disconnected ...");
    }

    /**
     * Checks if the status indicates a certificate error.
     *
     * @param {int} status
     *   the status which should be checked.
     *
     * @returns {boolean}
     *   true in case of a certificate error otherwise false.
     */
    isBadCert(status) {
      if (status === Cr.NS_OK)
        return false;

      const nssErrorsService = Cc["@mozilla.org/nss_errors_service;1"]
        .getService(Ci.nsINSSErrorsService);

      try {
        const errorType = nssErrorsService.getErrorClass(status);
        if (errorType === Ci.nsINSSErrorsService.ERROR_CLASS_BAD_CERT) {
          return true;
        }
      } catch (e) {
        console.warn(e);
        // nsINSSErrorsService.getErrorClass throws if given a non-TLS, non-cert error, so ignore this
      }

      return false;
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

      this.getLogger().logState(`Disconnected from  ${this.host}:${this.port} with status ${status}`);

      // we can ignore this if we are already disconnected.
      if (!this.socket)
        return;

      let reason;

      if (this.isBadCert(status)) {
        const secInfo = this.socket.securityInfo.QueryInterface(Ci.nsITransportSecurityInfo);

        reason = new SieveCertValidationException({
          "host": this.host,
          "port": this.port,

          "rawDER": secInfo.serverCert.getRawDER({}),
          "fingerprint" : secInfo.serverCert.sha256Fingerprint,

          "message" : secInfo.errorCodeString,
          "isDomainMismatch": secInfo.isDomainMismatch,
          "isExtendedValidation": secInfo.isExtendedValidation,
          "isNotValidAtThisTime": secInfo.isNotValidAtThisTime,
          "isUntrusted": secInfo.isUntrusted
        });
      }

      // Stop timeout timer, the connection is gone, so...
      // ... it won't help us anymore...
      this.disconnect(reason);

      // if the request queue is not empty,
      // we should call directly on timeout..
      if ((this.listener) && (this.listener.onDisconnect))
        (async () => { await this.listener.onDisconnect(); })();
    }

    /**
     * Called when the connection to the remote as is ready.
     *
     * @param {nsIRequest} request
     *   the request which is ready.
     */
    // eslint-disable-next-line no-unused-vars
    onStartRequest(request) {
      this.getLogger().logState(`Connected to ${this.host}:${this.port} ...`);
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

      super.onReceive(data);
    }

    /**
     * @inheritdoc
     */
    onSend(data) {

      // Convert string into an UTF-8 array...
      const output = Array.prototype.slice.call(
        new Uint8Array(new TextEncoder("UTF-8").encode(data)));

      if (this.getLogger().isLevelStream())
        this.getLogger().logStream(`Client -> Server [Byte Array]:\n${output}`);

      this.binaryOutStream.writeByteArray(output, output.length);

      return;
    }
  }

  exports.Sieve = SieveMozClient;

})(module.exports);
