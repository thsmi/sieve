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


const NOT_STARTED = -1;

/**
 * Implements a locked message queue.
 */
class LockedMessageQueue {

  /**
   * Creates a new instance and moves all of the given requests
   * into the locked queue.
   *
   * @param {SieveAbstractRequest[]} items
   *   the data which should be moved.
   */
  constructor(items) {
    this.offset = NOT_STARTED;
    this.items = [...items.splice(0, items.length)];
  }

  /**
   * Removes all remaining element from the queue and returns them
   * as array
   *
   * @returns {SieveAbstractRequest[]}
   *   all remaining items.
   */
  dequeue() {
    let offset = this.offset;

    if (offset === NOT_STARTED)
      offset = 0;

    this.offset = NOT_STARTED;
    return this.items.splice(offset, this.items.length);
  }

  /**
   * Used to drain the message queue. Marks all  all pending requests as abandoned
   * This typically happens when the connection was lost or upon an
   * forced disconnect.
   *
   * @param {object} reason
   *   the reason why the message queue was abandoned. Typically an exception.
   */
  shutdown(reason) {
    for (const item of this.items)
      item.abandon(reason);
  }

  /**
   * Truncates the queue on the current position.
   * The current element plus all previous elements will be removed.
   * The queue iterator will be reset to not started;
   */
  trunc() {
    if (this.offset === NOT_STARTED)
      return;

    this.items.splice(0, this.offset + 1);
    this.reset();
  }

  /**
   * Returns the remaining number of elements contained inside this queue.
   *
   * @returns {int}
   *   the number of remaining elements.
   */
  length() {
    if (this.offset === NOT_STARTED)
      return this.items.length;

    return this.items.length - this.offset;
  }

  /**
   * Resets the iterator to not started.
   */
  reset() {
    this.offset = NOT_STARTED;
  }

  /**
   * Checks if the queue has remaining elements.
   *
   * @returns {boolean}
   *   true in case there are more elements. False in case end was reached.
   */
  hasNext() {
    return (this.offset + 1 < this.items.length);
  }

  /**
   * Returns the queues next element.
   *
   * @returns {SieveAbstractRequest}
   *   the next queued request.
   */
  getNext() {
    this.offset++;
    return this.items[this.offset];
  }
}

/**
 * Implements a simple message queue logic.
 */
class MessageQueue {

  /**
   * Creates a new message queue instance.
   */
  constructor() {
    this.queued = [];
    this.locked = null;
    this.canceled = false;
  }

  /**
   * Adds a new request to the end of the message queue
   *
   * @param {SieveAbstractRequest} request
   *   the request to be added.
   *
   * @returns {MessageQueue}
   *   a self reference.
   */
  enqueue(request) {
    this.queued.push(request);
    return this;
  }

  /**
   * Used to drain the message queue. Marks all all enqueued requests as abandoned.
   *
   * @param {string} reason
   *   the human readable string why the message queue was abandoned.
   *
   * @returns {MessageQueue}
   *   a self reference.
   */
  shutdown(reason) {

    if (this.isLocked())
      this.getLock().shutdown(reason);

    while (this.queued.length)
      this.queued.shift().abandon(reason);

    return this;
  }

  /**
   * Checks if the message queue has non completed request.
   *
   * @returns {boolean}
   *   true in case the queue is locked otherwise false.
   */
  isEmpty() {
    if (this.isLocked() && this.locked.length())
      return false;

    return (this.queued.length === 0);
  }

  /**
   * Checks if the message queue is currently busy.
   *
   * @returns {boolean}
   *   true in case the message queue is busy otherwise false.
   */
  isLocked() {
    return (this.locked !== null);
  }

  /**
   * Returns the locked and protected message queue.
   * It will work only in case the queue is locked.
   * Otherwise and exception will be thrown.
   *
   * @returns {LockedMessageQueue}
   *   the currently locked message queue.
   */
  getLock() {
    if (!this.locked)
      throw new Error("Message queue is not locked");

    return this.locked;
  }

  /**
   * Locks and protects the current message queue from changes.
   *
   * @returns {MessageQueue}
   *    a self reference
   */
  lock() {

    if (this.isLocked())
      throw new Error("Message queue is already locked");

    this.locked = (new LockedMessageQueue(this.queued));
    return this;
  }

  /**
   * Unlocks the message queue, and allows changes.
   *
   * @returns {MessageQueue}
   *   a self reference
   */
  unlock() {
    if (!this.isLocked())
      return this;

    // Copy all entries from the locked queue back into our normal queue.
    this.queued = [...this.locked.dequeue(), ...this.queued];
    this.locked = null;

    return this;
  }

  /**
   * Checks if the queue is unlocked and if there are any
   * queued request which are ready to be processed.
   *
   * @returns {SieveAbstractRequest}
   *   the next element or null in case the queue is locked or no
   *   request is enqueued.
   */
  peek() {
    // The queue is locked this means we should not send anything.
    if (this.isLocked())
      return null;

    // Check if there is any request which can be send out.
    for (const item of this.queued) {
      if (!item.hasRequest())
        continue;

      return item;
    }

    return null;
  }
}

/**
 * A simple double buffer implementation.
 *
 * JavaScript is single threaded but async. Which means when deferring
 * a call it can happen that some one else modifies the buffer.
 *
 * In order to prevent this we use two buffers one buffer which can be
 * always safely written and an other buffer which can be always read.
 *
 * When calling flush the write buffer will be transferred into the read buffer
 * Calling trunc cleans the read buffer.
 */
class DoubleBuffer {

  /**
   * Creates a new instance.
   */
  constructor() {
    this.writer = [];
    this.reader = [];
  }

  /**
   * Stores data inside the double buffer.
   *
   * @param {byte[]} data
   *   the data to be stored inside the writer
   * @returns {DoubleBuffer}
   *   a self reference.
   */
  write(data) {
    this.writer.push(...data);
    return this;
  }

  /**
   * Returns a reference to the data stored inside the reader.
   * It will update and sync the reader buffer with the writer buffer
   * before returning.
   *
   * It does not change or consume any reader buffer data.
   * To shrink or truncate the reader buffer call truncate.
   *
   * @returns {byte[]}
   *   the data stored inside the reader.
   */
  read() {
    // We need the reader length to determine the number of new bytes.
    const offset = this.reader.length;

    // Copy the writer into the reader.
    this.reader.push(...this.writer);
    // an then shrink the writer.
    this.writer.splice(0, this.reader.length - offset);

    return this.reader;
  }

  /**
   * Truncates the read buffer
   *
   * @param {int} count
   *   the number of bytes to be truncated
   * @returns {DoubleBuffer}
   *   a self reference
   */
  trunc(count) {
    this.reader.splice(0, count);
    return this;
  }

  /**
   * Checks if the write buffer is dirty.
   * This means new data has arrived and wait to be processed.
   *
   * @returns {boolean}
   *  true in case the write buffer is dirty otherwise false;
   */
  isDirty() {
    return (this.writer.length !== 0);
  }

  /**
   * Clears the read as well as the write buffer.
   *
   * @returns {DoubleBuffer}
   *   a self reference
   */
  clear() {
    this.reader = [];
    this.writer = [];

    return this;
  }

  /**
   * Returns the total buffer length, the sum of the read plus the write buffer.
   *
   * @returns {int}
   *   the total buffer length
   */
  length() {
    return this.reader.length + this.writer.length;
  }
}

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
    this.buffer = new DoubleBuffer();
    this.queue = new MessageQueue();

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

    this.getLogger().logState("[SieveAbstractClient:onStartTimeout()] Starting/Restarting timeout");
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
    this.getLogger().logState("[SieveAbstractClient:onStopTimeout()] Stopping timeout");

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
    this.queue.enqueue(request);
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

    this.getLogger().logState(`[SieveAbstractClient:cancel()] Shutting down message queue ${reason}`);

    // Mark the queue as canceled...
    this.queue.shutdown(reason);

    // ... and then retrigger the queue with an empty message.
    // does not hurt...
    this.onReceive([]);
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
    this.getLogger().logState("[SieveAbstractClient:onTimeout()] Timeout fired");

    this.onStopTimeout();

    this.queue.shutdown(new Error("Timeout"));

    return;
  }

  /**
   * Creates a new request parser instance
   *
   * @param {byte[]} data
   *   the data to be parsed
   * @returns {SieveResponseParser}
   *   the request parser
   */
  createParser(data) {
    return new SieveResponseParser(data);
  }

  /**
   * Creates a new response builder instance
   *
   * @returns {SieveRequestBuilder}
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

    this.getLogger().logState("[SieveAbstractClient:onReceive] Starting processing received data...");

    if (this.getLogger().isLevelStream())
      this.getLogger().logStream(`[SieveAbstractClient:onReceive] Server -> Client [Byte Array]\n ${data}`);

    if (this.getLogger().isLevelResponse())
      this.getLogger().logResponse(data);

    // responses packets could be fragmented...
    this.getLogger().logState("[SieveAbstractClient:onReceive] ... add data to buffer...");
    this.buffer.write(data);

    // is a request handler waiting?
    if (this.queue.isEmpty()) {
      this.getLogger().logState("[SieveAbstractClient:onReceive] ... skipping, no request handler ready.");
      return;
    }

    if (this.queue.isLocked()) {
      this.getLogger().logState("[SieveAbstractClient:onReceive] ... skipping queue is locked.");
      return;
    }

    // first clear the timeout, parsing starts...
    this.onStopTimeout();

    // Sound strange but as we are async, we need to lock the event queue.
    // Otherwise an async function may manipulate the event queue while
    // we are waiting for a callback.
    this.getLogger().logState("[SieveAbstractClient:onReceive] ... locking Message Queue ...");

    try {
      const lock = this.queue.lock().getLock();

      while (lock.hasNext()) {

        const request = lock.getNext();

        if (request.isAbandoned()) {
          this.getLogger().logState("[SieveAbstractClient:onReceive] ... skipping abandoned request ...");
          await request.onAbandoned();
          this.buffer.clear();
          lock.trunc();
          continue;
        }

        // We can bail out in case we ran out of data
        if (!this.buffer.length()) {
          this.getLogger().logState("[SieveAbstractClient:onReceive] ... ran out of data, waiting for more");
          this.onStartTimeout();
          return;
        }

        this.getLogger().logState(`[SieveAbstractClient:onReceive] `
          + `Start parsing ${this.buffer.length()}`);

        try {
          const parser = this.createParser(this.buffer.read());

          await (request.onResponse(parser));

          // We do some cleanup as we don't need the parsed data anymore...
          this.buffer.trunc(parser.getPosition());

          this.getLogger().logState(`[SieveAbstractClient:onReceive] `
            + `Parsing successful, remaining ${this.buffer.length()} bytes`);

        } catch (ex) {

          if (request.isOptional()) {
            this.getLogger().logState(`[SieveAbstractClient:onReceive] `
              + `... failed but is optional, skipping to next request`);

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

          // In case the buffer is dirty new data arrived while we were parsing
          // and we are ready to try it again.
          if (this.buffer.isDirty()) {
            this.getLogger().logState(`[SieveAbstractClient:onReceive] `
              + `... buffers are dirty, restarting parsing.`);

            lock.reset();
            continue;
          }

          // Restore the message queue and restart the timer.
          this.onStartTimeout();
          this.getLogger().logState("[SieveAbstractClient:onReceive] Waiting for more data to continue");
          return;
        }

        // The request was processed but it is not yet completed because
        // is needs to send a new response.
        //
        // This means we need to stop here so that the message queue restarts.
        if (request.hasNextRequest()) {
          // First drop all processed request and then restart the processing
          lock.reset();
          break;
        }

        // The request was processed and is completed. So let's get rid of it.
        lock.trunc();

        this.getLogger().logState(`[SieveAbstractClient:onReceive] `
          + `Removing request from queue ${lock.length()}, ${this.buffer.length()}`);
      }
    } finally {
      this.getLogger().logState("[SieveAbstractClient:onReceive] ... unlocking Message Queue ...");
      this.queue.unlock();
    }

    // Finally we need to check if a new request arrived while we were
    // parsing the response and restart the message processing
    if (!this.queue.isEmpty()) {
      this.getLogger().logState("[SieveAbstractClient:onReceive] Restarting request processing");
      await this._sendRequest();
    }

    this.getLogger().logState("[SieveAbstractClient:onReceive] Finished processing received data");
  }

  /**
   * Send the next request, if available.
   */
  async _sendRequest() {

    const request = this.queue.peek();

    if (!request)
      return;

    // start the timeout, before sending anything. So that we will timeout...
    // ... in case the socket is jammed...
    this.onStartTimeout();

    const output = (await request.getNextRequest(this.createRequestBuilder())).getBytes();

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
}

export { SieveAbstractClient };
