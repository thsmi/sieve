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
  const { SieveMozResponseParser } = require("./SieveMozResponseParser.js");
  const { SieveMozRequestBuilder } = require("./SieveMozRequestBuilder.js");

  // eslint-disable-next-line no-magic-numbers
  const LOG_RESPONSE = (1 << 1);

  /**
   *  This realizes the abstract sieve implementation by using
   *  the mozilla specific network implementation.
   *
   * @param {SieveAbstractLogger} logger
   *   the logger which should be used.
   * @constructor
   */
  function Sieve(logger) {
    // Call the parent constructor...
    SieveAbstractClient.call(this);


    this.timeoutTimer = null;
    this.idleTimer = null;

    this.outstream = null;
    this.binaryOutStream = null;

    this._logger = logger;


  }

  Sieve.prototype = Object.create(SieveAbstractClient.prototype);
  Sieve.prototype.constructor = Sieve;

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
  Sieve.prototype.jsStringToByteArray = function (str) {
    // cleanup linebreaks...

    // eslint-disable-next-line no-control-regex
    str = str.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");

    return Array.prototype.slice.call(
      new Uint8Array(new TextEncoder("UTF-8").encode(str)));
  };

  Sieve.prototype.convertToString = function (byteArray) {
    byteArray = new Uint8Array(byteArray);
    return (new TextDecoder("UTF-8")).decode(byteArray);
  };

  // Needed for the Gecko 2.0 Component Manager...
  Sieve.prototype.QueryInterface
    = function (aIID) {
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
    };

  Sieve.prototype.isAlive
    = function () {
      if (!SieveAbstractClient.prototype.isAlive.call(this))
        return false;

      return this.socket.isAlive();
    };

  /**
   * This method secures the connection to the sieve server. By activating
   * Transport Layer Security all Data exchanged is crypted.
   *
   * Before calling this method you need to request a crypted connection by
   * sending a startTLSRequest. Invoke this method imediately after the server
   * confirms switching to TLS.
   *
   * @param {Function} callback
   *   the callback which should be invoked.
   * @returns {boolean}
   *   a self reference.
   **/
  Sieve.prototype.startTLS
    = function (callback) {
      SieveAbstractClient.prototype.startTLS.call(this);

      let securityInfo = this.socket.securityInfo.QueryInterface(Ci.nsISSLSocketControl);
      securityInfo.StartTLS();

      if (callback)
        callback();

      return this;
    };

  /**
   * An internal callback which is triggered when the request timeout timer should be started.
   * This is typically when a new request is about to be send to the server.
   *
   */
  Sieve.prototype.onStartTimeout
    = function () {

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

    };

  /**
   * An internal callback wich is triggered when the request timeout timer should be stopped.
   * This is typically when a response was received and the request was completed.
   *
   */
  Sieve.prototype.onStopTimeout
    = function () {

      // clear any existing timeouts.
      if (this.timeoutTimer)
        this.timeoutTimer.cancel();

      // and start the idle timer
      this.onStartIdle();
    };

  /**
   * Called when the idle timer should be started or restarted
   *
   */
  Sieve.prototype.onStartIdle
    = function () {

      // first ensure the timer is stopped..
      this.onStopIdle();

      // ... then configure the timer.
      let delay = this.getIdleWait();

      if (!delay)
        return;

      if (!this.idleTimer)
        return;

      this.idleTimer.initWithCallback(this, delay,
        Components.interfaces.nsITimer.TYPE_ONE_SHOT);
    };

  /**
   * Called when the idle timer should be stopped.
   *
   */
  Sieve.prototype.onStopIdle
    = function () {

      if (!this.idleTimer)
        return;

      this.idleTimer.cancel();
    };

  /**
   * When a mozilla timer triggers, it calls this
   * well known method.
   *
   * @param {nsITimer} timer
   *   the timer which caused this callback.
   *
   */
  Sieve.prototype.notify
    = function (timer) {

      if (this.idleTimer === timer) {
        this.onIdle();
        return;
      }

      if (this.timeoutTimer === timer) {
        this.onTimeout();
        return;
      }
    };


  Sieve.prototype.createParser
    = function (data) {
      return new SieveMozResponseParser(data);
    };

  Sieve.prototype.createRequestBuilder = function () {
    return new SieveMozRequestBuilder();
  };

  Sieve.prototype.getLogger
    = function () {
      return this._logger;
    };

  /**
   * Connects to a ManageSieve server.
   *
   * @param {string} host
   *   The target hostname or IP address as String
   * @param {Int} port
   *   The target port as Interger
   * @param {boolean} secure
   *   If true, a secure socket will be created. This allows switching to a secure
   *   connection.
   * @param {Components.interfaces.nsIBadCertListener2} badCertHandler
   *   Listener to call incase of an SSL Error. Can be null. See startTLS for more
   *   details.
   * @param {Array[nsIProxyInfo]} proxy
   *   An Array of nsIProxyInfo Objects which specifies the proxy to use.
   *   Pass an empty array for no proxy.
   *   Set to null if the default proxy should be resolved. Resolving proxy info is
   *   done asynchronous. The connect method returns imedately, without any
   *   information on the connection status...
   *   Currently only the first array entry is evaluated.
   */

  Sieve.prototype.connect
    = function (host, port, secure, badCertHandler, proxy) {
      if (this.socket)
        return;

      /* if ( (this.socket != null) && (this.socket.isAlive()) )
        return;*/

      this.host = host;
      this.port = port;
      this.secure = secure;
      this.badCertHandler = badCertHandler;

      this.idleTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
      this.timeoutTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

      this.getLogger().logState("Connecting to " + this.host + ":" + this.port + " ...");

      // If we know the proxy setting, we can do a shortcut...
      if (proxy) {
        this.onProxyAvailable(null, null, proxy[0], null);
        return;
      }

      this.getLogger().logState("Lookup Proxy Configuration for x-sieve://" + this.host + ":" + this.port + " ...");

      let ios = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);

      let uri = ios.newURI("x-sieve://" + this.host + ":" + this.port, null, null);

      let pps = Cc["@mozilla.org/network/protocol-proxy-service;1"]
        .getService(Ci.nsIProtocolProxyService);
      pps.asyncResolve(uri, 0, this);
    };

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
  Sieve.prototype.onProxyAvailable
    = function (aRequest, aURI, aProxyInfo, aStatus) {

      if (aProxyInfo)
        this.getLogger().logState("Using Proxy: [" + aProxyInfo.type + "] " + aProxyInfo.host + ":" + aProxyInfo.port);
      else
        this.getLogger().logState("Using Proxy: Direct");


      let transportService =
        Cc["@mozilla.org/network/socket-transport-service;1"]
          .getService(Ci.nsISocketTransportService);

      if (this.secure)
        this.socket = transportService.createTransport(["starttls"], 1, this.host, this.port, aProxyInfo);
      else
        this.socket = transportService.createTransport(null, 0, this.host, this.port, aProxyInfo);

      if (this.badCertHandler)
        this.socket.securityCallbacks = this.badCertHandler;

      this.outstream = this.socket.openOutputStream(0, 0, 0);

      this.binaryOutStream =
        Cc["@mozilla.org/binaryoutputstream;1"]
          .createInstance(Ci.nsIBinaryOutputStream);

      this.binaryOutStream.setOutputStream(this.outstream);

      let stream = this.socket.openInputStream(0, 0, 0);
      let pump = Cc["@mozilla.org/network/input-stream-pump;1"]
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
    };

  Sieve.prototype.disconnect
    = function () {
      SieveAbstractClient.prototype.disconnect.call(this);

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
    };

  Sieve.prototype.onStopRequest
    = function (request, context, status) {
      // this method is invoked anytime when the socket connection is closed
      // ... either by going to offlinemode or when the network cable is disconnected
      this.getLogger().logState("Stop request received ...");

      // we can ignore this if we are already disconnected.
      if (!this.socket)
        return;

      // Stop timeout timer, the connection is gone, so...
      // ... it won't help us anymore...
      this.disconnect();

      // if the request queue is not empty,
      // we should call directly on timeout..
      if ((this.listener) && (this.listener.onDisconnect))
        this.listener.onDisconnect();
    };

  Sieve.prototype.onStartRequest
    = function (request, context) {
      this.getLogger().logState("Connected to " + this.host + ":" + this.port + " ...");
    };

  /**
   * Called as soon as data arrives.
   * In Thunderbird 67+ the method signature was changed and api
   * compatibility broken. So we need this magic wrapper.
   *
   * @param {...Object} args
   *   the parameters passed to on DataAvailable
   * @returns {undefined}
   *   nothing to return
   */
  Sieve.prototype.onDataAvailable = function (...args) {

    // The old api passes the stream as third parameter
    if (args[2] instanceof Ci.nsIInputStream)
      return this.onDataReceived(args[2], args[4]);

    // The new api uses the second parameter
    if (args[1] instanceof Ci.nsIInputStream)
      return this.onDataReceived(args[1], args[3]);

    throw new Error("Unknown signature for nsIStreamListener.onDataAvailable()");
  };

  /**
   * Call as soon as data arrives and needs to be processed.
   *
   * @param {nsIInputStream} inputStream
   *   the input stream containing the data chunks
   * @param {int} count
   *   the maximum number of bytes which can be read in this call.
   */
  Sieve.prototype.onDataReceived
    = function (inputStream, count) {

      let binaryInStream = Cc["@mozilla.org/binaryinputstream;1"]
        .createInstance(Ci.nsIBinaryInputStream);

      binaryInStream.setInputStream(inputStream);

      let data = binaryInStream.readByteArray(count);

      this.getLogger().logStream("Server -> Client [Byte Array]\n" + data);

      if (this.getLogger().isLoggable(LOG_RESPONSE)) {

        let byteArray = data.slice(0, data.length);

        this.getLogger().logResponse("Server -> Client\n", this.convertToString(byteArray));
      }

      SieveAbstractClient.prototype.onDataReceived.call(this, data);
    };

  Sieve.prototype.onSend
    = function (data) {

      // Force String to UTF-8...
      let output = this.jsStringToByteArray(data);

      this.getLogger().logStream("Client -> Server [Byte Array]:\n" + output);

      this.binaryOutStream.writeByteArray(output, output.length);

      return;
    };

  exports.Sieve = Sieve;

})(module.exports);
