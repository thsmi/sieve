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

import { SieveTimer } from "./SieveTimer.mjs";
import { SieveResponseParser } from "./SieveResponseParser.mjs";
import { SieveRequestBuilder } from "./SieveRequestBuilder.mjs";

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

    this.timeoutTimer = new SieveTimer();
    this.idleTimer = new SieveTimer();


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
   * @returns {SieveLogger}
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
    // clear any existing timeouts
    this.getTimeoutTimer().cancel();

    // ensure the idle timer is stopped
    this.onStopIdle();

    // then restart the timeout timer.
    this.getTimeoutTimer().start(
      () => { this.onTimeout(); },
      this.getTimeoutWait());
  }

  /**
   * An internal callback which is triggered when the request timeout timer
   * should be stopped. This is typically whenever a response was received and
   * the request was completed.
   *
   * @abstract
   */
  onStopTimeout() {

    // clear any existing timeouts.
    this.getTimeoutTimer().cancel();

    // and start the idle timer
    this.onStartIdle();
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
   * Returns the timer used to track timeouts.
   * It is guaranteed to be non null.
   *
   * @returns {SieveTimer}
   *   the current timeout timer
   */
  getTimeoutTimer() {
    return this.timeoutTimer;
  }

  /**
   * Returns the timer used to track idle.
   * It is guaranteed to be non null.
   *
   * @returns {SieveTimer}
   *   the current idle timer.
   */
  getIdleTimer() {
    return this.idleTimer;
  }

  /**
   * Internal method trigged after a request was completely processed.
   * @abstract
   */
  onStartIdle() {
    // first ensure the timer is stopped..
    this.onStopIdle();

    // ... then configure the timer.
    const delay = this.getIdleWait();

    if (!delay)
      return;

    this.getIdleTimer().start(() => { this.onIdle(); }, delay);
  }

  /**
   * Internal method triggered when a new request is processed.
   */
  onStopIdle() {
    this.getIdleTimer().cancel();
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
   * Sets the callback listener.
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
   * @param {SieveAbstractRequest} request
   *   the request object which should be added to the queue
   *
   * @returns {SieveAbstractClient}
   *   a self reference
   */
  async addRequest(request) {

    // Attach the global bye listener only when needed.
    if (!request.byeListener)
      if (this.listener && this.listener.onByeResponse)
        request.addByeListener(this.listener.onByeResponse);

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
      if (this.requests[idx].hasRequest())
        break;

    if (idx === this.requests.length)
      return this;

    if (this.requests[idx] !== request)
      return this;

    await this._sendRequest();

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
   *
   * @returns {SieveAbstractClient}
   *   a self reference
   */
  // eslint-disable-next-line no-unused-vars
  connect(host, port, secure) {
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
  async disconnect(reason) {

    this.getLogger().logState(`SieveAbstractClient: Disconnecting ${this.host}:${this.port}...`);

    this.getIdleTimer().cancel();
    this.getTimeoutTimer().cancel();

    this.cancel(reason);


    // free requests...
    // this.requests = new Array();
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
   * Called whenever a request was not responded in a reasonable time frame.
   * It cancel all pending requests and emits a timeout signal to the listeners.
   */
  onTimeout() {

    this.onStopTimeout();

    this.getLogger().logState("libManageSieve/Sieve.js:\nOnTimeout");

    // clear receive buffer and any pending request...
    this.data = null;

    // ... and cancel the active request. It will automatically invoke the ...
    // ... request's onTimeout() listener.
    if (this.requests.length) {
      this.requests.shift().cancel(new Error("Timeout"));
      return;
    }

    // in case no request is active, we call the global listener
    this.requests = [];

    if (this.listener && this.listener.onTimeout)
      this.listener.onTimeout();
  }

  /**
   * Creates a new request parser instance
   *
   * @param {byte[]} data
   *   the data to be parsed
   * @returns {SieveAbstractResponseParser}
   *   the request parser
   */
  createParser(data) {
    return new SieveResponseParser(data);
  }

  /**
   * Creates a new response builder instance
   *
   * @returns {SieveAbstractRequestBuilder}
   *   the response builder.
   */
  createRequestBuilder() {
    return new SieveRequestBuilder();
  }

  /**
   * Called when data was received on the socket.
   *
   * @param {byte[]} data
   *   the data received.
   */
  async onReceive(data) {

    this.getLogger().logState("[SieveAbstractClient:onReceive] Processing received data");

    if (this.getLogger().isLevelStream())
      this.getLogger().logStream(`[SieveAbstractClient:onReceive] Server -> Client [Byte Array]\n ${data}`);

    if (this.getLogger().isLevelResponse())
      this.getLogger().logResponse(data);

    // responses packets could be fragmented...
    if ((this.data === null) || (this.data.length === 0))
      this.data = data;
    else
      this.data = this.data.concat(data);

    // is a request handler waiting?
    if (this.requests.length === 0) {
      this.getLogger().logState("[SieveAbstractClient:onReceive] Processing received data");
      return;
    }

    // first clear the timeout, parsing starts...
    this.onStopTimeout();

    // Sound strange but as we are async, we need to lock the event queue.
    // Otherwise an async function may manipulate the event queue while
    // we are waiting for a callback.
    this.getLogger().logState("[SieveAbstractClient:onReceive] Locking Message Queue");
    const requests = this._lockMessageQueue();
    try {
      let offset = 0;

      while (offset !== requests.length) {

        this.getLogger().logState(`[SieveAbstractClient:onReceive] `
          + `Start parsing ${offset}, ${requests.length}, ${this.data.length}`);

        // We can abort if we ran out of data
        if (!this.data.length) {
          this.getLogger().logState("[SieveAbstractClient:onReceive] ... ran out of data, waiting for more");
          return;
        }

        const parser = this.createParser(this.data);

        try {
          await (requests[offset].addResponse(parser));

          // We do some cleanup as we don't need the parsed data anymore...
          this.data = parser.getByteArray();

          this.getLogger().logState(`[SieveAbstractClient:onReceive] `
            + `Parsing successfully, remaining ${this.data.length} bytes`);

        } catch (ex) {

          if (requests[offset].isOptional()) {
            this.getLogger().logState(`[SieveAbstractClient:onReceive] `
              + `... failed but is optional, skipping to next request`);

            offset++;
            continue;
          }

          // Parsing the response failed. This is most likely caused by fragmentation
          // and will be resolved as soon as the remaining bytes arrive.
          //
          // In case it is really a syntax error the we will run into a timeout.
          //
          // So in either way the next packet or the timeout will resolve this
          // situation for us.

          if (this.getLogger().isLevelState()) {
            this.getLogger().logState(`Parsing Warning in libManageSieve/Sieve.js:\\n${ex.toString()}`);
            this.getLogger().logState(ex.stack);
          }

          // Restore the message queue and restart the timer.
          this.onStartTimeout();

          this.getLogger().logState("[SieveAbstractClient:onReceive] Waiting for more data to continue");
          return;
        }

        // Remove the request in case it is completed.
        if (!requests[offset].hasNextRequest()) {
          requests.splice(0, offset + 1);
          offset = 0;

          this.getLogger().logState(`[SieveAbstractClient:onReceive] `
            + `Removing request from queue ${offset}, ${requests.length}, ${this.data.length}`);
          continue;
        }
      }
    } finally {
      this._unlockMessageQueue(requests);
    }

    // Finally we need to check if a new request arrived while we were
    // parsing the response and restart the message processing
    if (this.requests.length) {
      this.getLogger().logState("[SieveAbstractClient:onReceive] Restarting request processing");
      await this._sendRequest();
    }

    this.getLogger().logState("[SieveAbstractClient:onReceive] Finished processing received data");
  }

  /**
   * Send the next request, if available.
   */
  async _sendRequest() {

    let idx = 0;
    while (idx < this.requests.length) {
      if (this.requests[idx].hasRequest())
        break;

      idx++;
    }

    if (idx >= this.requests.length)
      return;

    // start the timeout, before sending anything. So that we will timeout...
    // ... in case the socket is jammed...
    this.onStartTimeout();

    const output = (await this.requests[idx].getNextRequest(this.createRequestBuilder())).getBytes();

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

  /**
   * Locks the message queue.
   *
   * We are async which means while waiting for a callback, some other
   * function may manipulate the event queue.
   *
   * It technically sets a lock/semaphore and then removes all entries from
   * the request queue and returns.
   *
   * @returns {SieveAbstractRequest[]}
   *   a list with all of the locked requests.
   */
  _lockMessageQueue() {
    this.queueLocked = true;

    // Copies the requests array.
    const requests = this.requests.concat();

    this.requests = [];

    return requests;
  }

  /**
   * Unlocks the message queue.
   *
   * It concatenates the locked requests and newly added requests.
   *
   * @param {SieveAbstractRequest[]} requests
   *   typically the processed _lockMessageQueue list after processing it.
   */
  _unlockMessageQueue(requests) {
    this.requests = requests.concat(this.requests);
    this.queueLocked = false;
  }
}

export { SieveAbstractClient };
