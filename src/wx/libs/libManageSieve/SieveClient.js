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

  // eslint-disable-next-line no-magic-numbers
  const LOG_RESPONSE = (1 << 1);

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
     * Converts an UTF16 encoded Javascript string to an UTF8 encoded
     * byte aray.
     *
     * It also normalizes all linebreaks. In sieve all linebreaks have
     * to be \r\n
     *
     * @param {string} str
     *   the string to convert.
     *
     * @returns {byte[]}
     *   an utf8 encoded byte array.
     */
    jsStringToByteArray(str) {
      // cleanup linebreaks...

      // eslint-disable-next-line no-control-regex
      str = str.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");

      return Array.prototype.slice.call(
        new Uint8Array(new TextEncoder("UTF-8").encode(str)));
    }

    convertToString(byteArray) {
      byteArray = new Uint8Array(byteArray);
      return (new TextDecoder("UTF-8")).decode(byteArray);
    }

    // Needed for the Gecko 2.0 Component Manager...
    QueryInterface(aIID) {
      if (aIID.equals(Ci.nsISupports))
        return this;
      // onProxyAvailable...
      if (aIID.equals(Ci.nsIProtocolProxyCallback))
        return this;
      // onDataAvailable...
      if (aIID.equals(Ci.nsIStreamListener))
        return this;
      // onStartRequest and onStopRequest...
      if (aIID.equals(Ci.nsIRequestObserver))
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
     * Transport Layer Security all Data exchanged is crypted.
     *
     * Before calling this method you need to request a crypted connection by
     * sending a startTLSRequest. Invoke this method imediately after the server
     * confirms switching to TLS.
     *
     **/
    async startTLS() {

      await super.startTLS();

      const securityInfo = this.socket.securityInfo.QueryInterface(Ci.nsISSLSocketControl);
      securityInfo.StartTLS();
    }

    /**
     * An internal callback which is triggered when the request timeout timer should be started.
     * This is typically when a new request is about to be send to the server.
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
     * An internal callback wich is triggered when the request timeout timer should be stopped.
     * This is typically when a response was received and the request was completed.
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

      this.getLogger().logState("Connecting to " + this.host + ":" + this.port + " ...");

      // If we know the proxy setting, we can do a shortcut...
      if (proxy) {
        this.onProxyAvailable(null, null, proxy[0], null);
        return this;
      }

      this.getLogger().logState("Lookup Proxy Configuration for x-sieve://" + this.host + ":" + this.port + " ...");

      const ios = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);

      // const uri = ios.newURI("x-sieve://" + this.host + ":" + this.port, null, null);
      const uri = ios.newURI("http://" + this.host + ":" + this.port, null, null);

      this.getLogger().logState("Connecting to " + uri.hostPort + ":" + this.host + " ...");


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
     * the array lenght. After the change the length parameter was removed
     * which causes all the other agruments to shift by one.
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

      if (transportService.createTransport.length === 4)
        return transportService.createTransport(((secure) ? ["starttls"] : []), host, port, proxyInfo);

      if (transportService.createTransport.length === 5) {
        if (secure)
          return transportService.createTransport(["starttls"], 1, host, port, proxyInfo);

        return transportService.createTransport(null, 0, host, port, proxyInfo);
      }

      throw new Error("Unknown Create Transport signature");
    }

    /**
     *
     * This is an closure for asyncronous Proxy
     * @private
     * @param {*} aRequest
     * @param {*} aURI
     * @param {*} [aProxyInfo]
     *   the proxy information from the lookup, if omitted or null a direct
     *   connection will be used.
     * @param {*} aStatus
     *
     **/
    onProxyAvailable(aRequest, aURI, aProxyInfo, aStatus) {

      if (aProxyInfo)
        this.getLogger().logState("Using Proxy: [" + aProxyInfo.type + "] " + aProxyInfo.host + ":" + aProxyInfo.port);
      else
        this.getLogger().logState("Using Proxy: Direct");


      this.socket = this.createTransport(this.host, this.port, this.isSecure(), aProxyInfo);

      this.outstream = this.socket.openOutputStream(0, 0, 0);

      this.binaryOutStream =
        Cc["@mozilla.org/binaryoutputstream;1"]
          .createInstance(Ci.nsIBinaryOutputStream);

      this.binaryOutStream.setOutputStream(this.outstream);

      const stream = this.socket.openInputStream(0, 0, 0);
      const pump = Cc["@mozilla.org/network/input-stream-pump;1"]
        .createInstance(Ci.nsIInputStreamPump);

      // the guys at mozilla changed their api without caring
      // about backward compatibility. Which means we need
      // Some try catch magic here.
      try {
        // first we try the new api definition...
        pump.init(stream, 5000, 2, true);
      } catch (ex) {

        // ... in case we run into an not enough args exception
        // we try the old api definition and in any other case
        // we just rethrow the exception
        if (ex.name !== "NS_ERROR_XPC_NOT_ENOUGH_ARGS")
          throw ex;

        this.getLogger().logState("Falling back to legacy stream pump initalization ...");
        pump.init(stream, -1, -1, 5000, 2, true);
      }

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

    // FIXME make var Arg like onDataAvilable...
    /**
     *
     * @param {*} request
     * @param {*} context
     * @param {int} status
     *   the reason why the stop was called.
     */
    onStopRequest(request, context, status) {

      if (status === undefined)
        status = context;

      console.error("On Stop Request " + status);
      // this method is invoked anytime when the socket connection is closed
      // ... either by going to offlinemode or when the network cable is disconnected
      this.getLogger().logState("Stop request received ...");

      // we can ignore this if we are already disconnected.
      if (!this.socket)
        return;

      let reason;

      if (this.isBadCert(status)) {
        const secInfo = this.socket.securityInfo.QueryInterface(Ci.nsITransportSecurityInfo);

        reason = new SieveCertValidationException("error", {
          "rawDER": secInfo.serverCert.getRawDER({}),
          "errorCodeString" : secInfo.errorCodeString,
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

    onStartRequest(request, context) {
      this.getLogger().logState(`Connected to ${this.host}:${this.port} ...`);
    }

    /**
     * Called as soon as data arrives.
     * In Thunderbird 67+ the method signature was changed and api
     * compatibility broken. So we need this magic wrapper.
     *
     * @param {...object} args
     *   the parameters passed to on DataAvailable
     * @returns {undefined}
     *   nothing to return
     */
    onDataAvailable(...args) {

      // The old api passes the stream as third parameter
      if (args[2] instanceof Ci.nsIInputStream)
        return this.onDataReceived(args[2], args[4]);

      // The new api uses the second parameter
      if (args[1] instanceof Ci.nsIInputStream)
        return this.onDataReceived(args[1], args[3]);

      throw new Error("Unknown signature for nsIStreamListener.onDataAvailable()");
    }

    /**
     * Call as soon as data arrives and needs to be processed.
     *
     * @param {nsIInputStream} inputStream
     *   the input stream containing the data chunks
     * @param {int} count
     *   the maximum number of bytes which can be read in this call.
     */
    onDataReceived(inputStream, count) {

      const binaryInStream = Cc["@mozilla.org/binaryinputstream;1"]
        .createInstance(Ci.nsIBinaryInputStream);

      binaryInStream.setInputStream(inputStream);

      const data = binaryInStream.readByteArray(count);

      this.getLogger().logStream("Server -> Client [Byte Array]\n" + data);

      if (this.getLogger().isLoggable(LOG_RESPONSE)) {

        this.getLogger().logResponse(
          "Server -> Client\n" + this.convertToString(data.slice(0, data.length)));
      }

      SieveAbstractClient.prototype.onReceive.call(this, data);
    }

    /**
     * @inheritdoc
     */
    onSend(data) {

      // Force String to UTF-8...
      const output = this.jsStringToByteArray(data);

      this.getLogger().logStream("Client -> Server [Byte Array]:\n" + output);

      this.binaryOutStream.writeByteArray(output, output.length);

      return;
    }
  }

  exports.Sieve = SieveMozClient;

})(module.exports);
