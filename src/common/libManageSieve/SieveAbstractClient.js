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

/*
 *  This class is a simple socket implementation for the manage sieve protocol.
 *  Due to the asymmetric nature of the Mozilla sockets we need message queue.
 *  <p>
 *  New requests are added via the "addRequest" method. In case of a response,
 *  the corresponding request will be automatically called back via its
 *  "addResponse" method.
 *  <p>
 *  If you need a secure connection, set the flag secure in the constructor.
 *  Then connect to the host. And invoke the "startTLS" Method as soon as you
 *  negotiated the switch to a encrypted connection. After calling startTLS
 *  Mozilla will immediately switch to an encrypted connection.
 *  <p>
 */

(function (exports) {

  "use strict";

  const DEFAULT_TIMEOUT = 20000;
  const NO_IDLE = 0;

  /**
   * An abstract implementation for the manage sieve protocol.
   *
   * It implements a message pump and parsing facility.
   * Only the connections to the transport are needed to be implemented.
   *
   * The javascript syntax for this code is extremely limited.
   * As this code is used for a mozilla module as well as in node js.
   *
   * Due to various limitation there is no window object and also no toSource().
   * Same applies to timeouts. They need to be implemented with platform
   * specific code.
   *
   * In general you should avoid the "new" operator as this makes imports difficult.
   * Mozilla's Modules, Node's Require and the new ES imports are mostly
   * incompatible to each other.
   *
   */
  class SieveAbstractClient {

    /**
     * Creates a new instance
     */
    constructor() {
      this.host = null;
      this.port = null;

      this.socket = null;
      this.data = null;

      this.queueLocked = false;

      this.requests = [];

      this.idleDelay = 0;


      // out of the box we support the following manage sieve commands...
      // ... the server might advertise additional commands they are added ...
      // ... or removed by the set compatibility method
      this.compatibility = {
        authenticate: true,
        starttls: true,
        logout: true,
        capability: true,
        // until now we do not support havespace...
        // havespace  : false,
        putscript: true,
        listscripts: true,
        setactive: true,
        getscript: true,
        deletescript: true
      };
    }

    /**
     * Gives this socket a hint, whether a sieve commands is supported or not.
     *
     * Setting the corresponding attribute to false, indicates, that a sieve command
     * should not be used. As this is only an advice, such command will still be
     * processed by this sieve socket.
     *
     * By default the socket seek maximal compatibility.
     *
     * @param {object} capabilities commands
     *   the supported sieve commands as an associative array. Attribute names have
     *   to be in lower case, the values can be either null, undefined, true or false.
     *
     * @example
     * sieve.setCompatibility({checkscript:true, rename:true, starttls:false});
     */
    setCompatibility(capabilities) {
      for (const capability in capabilities)
        this.compatibility[capability] = capabilities[capability];
    }

    /**
     * Returns a list of supported sieve commands. As the socket seeks
     * maximal compatibility, it always suggest the absolute minimal sieve
     * command set defined in the rfc. This value is only a hint, and does
     * not represent the server's capabilities!
     *
     * A command is most likely unsupported if the corresponding attribute is null and
     * disabled if the the attribute is false
     *
     * You should override these defaults as soon as possible.
     *
     * @returns {Struct}
     *   an associative array structure indicating supported sieve command.
     *   Unsupported commands are indicated by a null, disabled by false value...
     *
     * @example
     * if (sieve.getCompatibility().putscript) {
     *   // put script command supported...
     * }
     */
    getCompatibility() {
      return this.compatibility;
    }


    /**
     * Gets a reference to the current logger
     * @returns {SieveAbstractLogger}
     *   the current logger
     *
     * @abstract
     */
    getLogger() {
      throw new Error("Implement getLogger()");
    }

    /**
     * Checks if the connection to the server is still alive and can be used to send
     * and receive messages
     * @returns {boolean}
     *   true in case the connection is alive otherwise false
     */
    isAlive() {
      if (!this.socket)
        return false;

      return true;
    }

    /**
     * Check is the connection supports any connection security.
     * It could be either disabled by the client or the server.
     *
     * @abstract
     *
     * @returns {boolean}
     *   true in case the connection can be or is secure otherwise false
     */
    isSecure() {
      throw new Error("Implement isSecure()");
    }

    /**
     * This method secures the connection to the sieve server. By activating
     * Transport Layer Security all Data exchanged is encrypted.
     *
     * Before calling this method you need to request a encrypted connection by
     * sending a startTLSRequest. Invoke this method immediately after the server
     * confirms switching to TLS.
     *
     * @returns {SieveAbstractClient}
     *   a self reference
     **/
    startTLS() {
      if (!this.isSecure())
        throw new Error("TLS can't be started no secure socket");

      if (!this.socket)
        throw new Error(`Can't start TLS, your are not connected to ${this.host}`);

      // Need to be overwritten in a subclass....
      return this;
    }

    /**
     * An internal callback which is triggered when the request timeout timer
     * should be started. This is typically whenever a new request is about to
     * be send to the server.
     *
     * @abstract
     */
    onStartTimeout() {
      throw new Error("Implement onStartTimeout()");
    }

    /**
     * An internal callback which is triggered when the request timeout timer
     * should be stopped. This is typically whenever a response was received and
     * the request was completed.
     *
     * @abstract
     */
    onStopTimeout() {
      throw new Error("Implement onStopTimeout()");
    }


    /**
     * Returns the maximal interval in ms between a request and a response.
     * The default timeout is 20 seconds
     * @returns {int}
     *   the maximal number of milliseconds
     */
    getTimeoutWait() {

      // Apply some self healing magic...
      if (!this.timeoutDelay)
        return DEFAULT_TIMEOUT;

      return this.timeoutDelay;
    }

    /**
     * Specifies the maximal interval between a request and a response. If the
     * timeout elapsed, all pending request will be canceled and the event queue
     * will be cleared. Either the onTimeout() method of the most recent request
     * will invoked or in case the request does not support onTimeout() the
     * default's listener will be called.
     *
     * @param {int} interval
     *   the number of milliseconds before the timeout is triggered.
     *   Pass null to set the default timeout.
     * @returns {SieveAbstractClient}
     *   a self reference
     */
    setTimeoutWait(interval) {

      this.timeoutDelay = interval;
      return this;
    }


    /**
     * Internal method trigged after a request was completely processed.
     * @abstract
     */
    onStartIdle() {
      throw new Error("Implement onStartIdle()");
    }

    /**
     * Internal method triggered when a new request is processed.
     * @abstract
     */
    onStopIdle() {
      throw new Error("Implement onStopIdle()");
    }

    /**
     * Gets the maximal number of idle time between two subsequent requests.
     * A value of zero indicates idle detection is disabled.
     *
     * @returns {int}
     *   the number of ms to wait or null in case idle detection is disabled.
     */
    getIdleWait() {
      if (!this.idleDelay)
        return NO_IDLE;

      return this.idleDelay;
    }

    /**
     * Specifies the maximal interval between a response and a request.
     * If the max time elapsed, the listener's OnIdle() event will be called.
     * Thus it can be used for sending "Keep alive" packets.
     *
     * @param {int} ms
     *  the maximal number of milliseconds between a response and a request,
     *  pass null to deactivate.
     * @returns {SieveAbstractClient}
     *   a self reference
     */
    setIdleWait(ms) {
      if (ms) {
        this.idleDelay = ms;
        return this;
      }

      // No keep alive Packets should be sent, so null the timer and the delay.
      this.idleDelay = 0;
      this.onStopIdle();

      return this;
    }

    /**
     *
     * @param {*} listener
     */
    addListener(listener) {
      this.listener = listener;
    }

    /**
     * Adds a request to the send queue.
     *
     * Normal request runs to completion, so they are blocking the queue
     * until they are fully processed. If the request fails, the error
     * handler is triggered and the request is dequeued.
     *
     * A greedy request in contrast accepts whatever it can get. Upon an
     * error greedy request are not dequeued. They fail silently and the next
     * requests is processed. This continues until a request succeeds, a non
     * greedy request fails or the queue has no more requests.
     *
     * @param {SieveAbstractRequest} request
     *   the request object which should be added to the queue
     *
     * @param {boolean} [greedy]
     *   if true requests fail silently
     *
     * @returns {SieveAbstractClient}
     *   a self reference
     */
    addRequest(request, greedy) {

      // Attach the global bye listener only when needed.
      if (!request.byeListener)
        if (this.listener && this.listener.onByeResponse)
          request.addByeListener(this.listener.onByeResponse);

      // TODO: we should really store this internally, instead of tagging objects
      if (greedy)
        request.isGreedy = true;

      // Add the request to the message queue
      this.requests.push(request);

      // If the message queue was empty, we might have to reinitialize the...
      // ... request pump.

      // We can skip this if queue is locked...
      if (this.queueLocked)
        return this;

      let idx;
      // ... or it contains more than one full request
      for (idx = 0; idx < this.requests.length; idx++)
        if (this.requests[idx].isUnsolicited())
          break;

      if (idx === this.requests.length)
        return this;

      if (this.requests[idx] !== request)
        return this;

      this._sendRequest();

      return this;
    }


    /**
     * Connects to a ManageSieve server.
     * @abstract
     *
     * @param {string} host
     *   The target hostname or IP address as String
     * @param {int} port
     *   The target port as Integer
     * @param {boolean} secure
     *   If true, a secure socket will be created. This allows switching to a secure
     *   connection.
     * @param {nsIProxyInfo[]} proxy
     *   An Array of nsIProxyInfo Objects which specifies the proxy to use.
     *   Pass an empty array for no proxy.
     *   Set to null if the default proxy should be resolved. Resolving proxy info is
     *   done asynchronous. The connect method returns immediately, without any
     *   information on the connection status...
     *   Currently only the first array entry is evaluated.
     *
     * @returns {SieveAbstractClient}
     *   a self reference
     */
    // eslint-disable-next-line no-unused-vars
    connect(host, port, secure, proxy) {
      throw new Error("Implement me SieveAbstractClient ");
    }

    /**
     * Cancels all pending request.
     *
     * @param {Error} [reason]
     *   the optional reason why the request was canceled.
     */
    cancel(reason) {

      while (this.requests.length)
        this.requests.shift().cancel(reason);
    }

    /**
     * Disconnects from the server.
     *
     * Need to be overwritten. The current implementation is a stub
     * which takes care about stopping the timeouts.
     *
     * @param {Error} [reason]
     *   the optional reason why the client was disconnected.
     */
    disconnect(reason) {

      this.getLogger().logState(`Disconnecting ${this.host}:${this.port}...`);

      this.cancel(reason);

      // free requests...
      // this.requests = new Array();
      this.onStopTimeout();
      this.onStopIdle();
    }

    /**
     * Called whenever the client enters idle state.
     * Which means no request where send for the given idle time.
     *
     * It emits a signal to external idle listeners.
     */
    async onIdle() {

      this.onStopIdle();

      this.getLogger().logState("libManageSieve/Sieve.js:\nOnIdle");

      if (this.listener && this.listener.onIdle)
        await this.listener.onIdle();
    }

    /**
     * Called whenever a request was not responded in a reasonable timeframe.
     * It cancel all pending requests and emits a timeout signal to the listeners.
     */
    onTimeout() {

      this.onStopTimeout();

      this.getLogger().logState("libManageSieve/Sieve.js:\nOnTimeout");

      // clear receive buffer and any pending request...
      this.data = null;

      let idx = 0;
      while ((idx < this.requests.length) && (this.requests[idx].isGreedy))
        idx++;

      // ... and cancel the active request. It will automatically invoke the ...
      // ... request's onTimeout() listener.
      if (idx < this.requests.length) {
        const request = this.requests[idx];
        this.requests.splice(0, idx + 1);

        request.cancel(new Error("Timeout"));
        return;
      }

      // in case no request is active, we call the global listener
      this.requests = [];

      if (this.listener && this.listener.onTimeout)
        this.listener.onTimeout();

    }

    /**
     * Creates a new request parser instance
     * @abstract
     *
     * @param {byte[]} data
     *   the data to be parsed
     * @returns {SieveNodeResponseParser}
     *   the request parser
     */
    createParser(data) {
      throw new Error(`Implement SieveAbstractClient::createParser(${data})`);
    }

    /**
     * Creates a new response builder instance
     * @abstract
     *
     * @returns {SieveAbstractRequestBuilder}
     *   the response builder.
     */
    createRequestBuilder() {
      throw new Error("Implement SieveAbstractClient::createRequestBuilder");
    }

    /**
     * Called when data was received on the socket.
     *
     * @param {byte[]} data
     *   the data received.
     */
    onReceive(data) {

      if (this.getLogger().isLevelStream())
        this.getLogger().logStream(`Server -> Client [Byte Array]\n ${data}`);

      if (this.getLogger().isLevelResponse())
        this.getLogger().logResponse(data);

      // responses packets could be fragmented...
      if ((this.data === null) || (this.data.length === 0))
        this.data = data;
      else
        this.data = this.data.concat(data);

      // is a request handler waiting?
      if (this.requests.length === 0)
        return;

      // first clear the timeout, parsing starts...
      this.onStopTimeout();

      // As we are callback driven, we need to lock the event queue. Otherwise our
      // callbacks could manipulate the event queue while we are working on it.
      let requests = this._lockMessageQueue();

      // greedy request take might have an response but do not have to have one.
      // They munch what they get. If there's a request they are fine,
      // if there's no matching request it's also ok.
      let idx = -1;

      while (idx + 1 < requests.length) {
        idx++;
        const parser = this.createParser(this.data);

        try {
          requests[idx].addResponse(parser);

          // We do some cleanup as we don't need the parsed data anymore...
          this.data = parser.getByteArray();

          // parsing was successful, so drop every previous request...
          // ... keep in mid previous greedy request continue on exceptions.
          requests = requests.slice(idx);

          // we started to parse the request, so it can't be greedy anymore.
        }
        catch (ex) {
          // request could be fragmented or something else, as it's greedy,
          // we don't care about any exception. We just log them in oder
          // to make debugging easier....
          if (this.getLogger().isLevelState()) {
            this.getLogger().logState(`Parsing Warning in libManageSieve/Sieve.js:\\n${ex.toString()}`);
            this.getLogger().logState(ex.stack);
          }

          // a greedy request might or might not get an request, thus
          // it's ok if it fails
          if (requests[idx].isGreedy)
            continue;

          // ... but a non greedy response must parse without an error. Otherwise...
          // ... something is broken. this is most likely caused by a fragmented ...
          // ... packet, but could be also a broken response. So skip processing...
          // ... and restart the timeout. Either way the next packet or the ...
          // ... timeout will resolve this situation for us.

          this._unlockMessageQueue(requests);
          this.onStartTimeout();

          return;
        }

        // Request is completed...
        if (!requests[0].hasNextRequest()) {
          // so remove it from the event queue.
          const request = requests.shift();
          // and update the index
          idx--;

          // ... if it was greedy, we munched an unexpected packet...
          // ... so there is still a valid request dangling around.
          if (request.isGreedy)
            continue;
        }

        if (!parser.isEmpty())
          continue;

        this._unlockMessageQueue(requests);


        // Are there any other requests waiting in the queue.

        // TODO FIX ME should always be dispatched, to relax the main thread.
        // But in mozilla modules we don't have access to a window object and
        // timeouts are more complicated.

        // var that = this;
        // window.setTimeout(function () {that._sendRequest()}, 0);

        this._sendRequest();

        return;
      }


      // we end up here only if all responses where greedy or there were no...
      // ... response parser at all. Thus all we can do is release the message...
      // ... queue, cache the data and wait for a new response to be added.

      this._unlockMessageQueue(requests);

      this.getLogger().logState("Skipping Event Queue");
    }

    _sendRequest() {

      let idx = 0;
      while (idx < this.requests.length) {
        if (this.requests[idx].isUnsolicited())
          break;

        idx++;
      }

      if (idx >= this.requests.length)
        return;

      // start the timeout, before sending anything. So that we will timeout...
      // ... in case the socket is jammed...
      this.onStartTimeout();

      const output = this.requests[idx].getNextRequest(this.createRequestBuilder()).getBytes();

      if (this.getLogger().isLevelRequest())
        this.getLogger().logRequest(`Client -> Server:\n${output}`);

      this.onSend(output);

      return;
    }

    /**
     * Called everytime data is ready to send.
     * @abstract
     *
     * @param {object} data
     *   the data to send to the server.
     */
    onSend(data) {
      throw new Error(`Implement SieveAbstractClient::onSend(${data})`);
    }

    _lockMessageQueue() {
      this.queueLocked = true;
      const requests = this.requests.concat();

      this.requests = [];

      return requests;
    }

    _unlockMessageQueue(requests) {
      this.requests = requests.concat(this.requests);
      this.queueLocked = false;
    }
  }

  exports.SieveAbstractClient = SieveAbstractClient;

})(module.exports || this);
