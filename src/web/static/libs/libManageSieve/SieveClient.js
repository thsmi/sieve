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

  // Handle all imports..
  const { SieveAbstractClient } = require("./SieveAbstractClient.js");
  const { SieveResponseParser } = require("./SieveResponseParser.js");
  const { SieveRequestBuilder } = require("./SieveRequestBuilder.js");

  const { SieveTimer } = require("./SieveTimer.js");

  /**
   * Implements a websocket based transport.
   * It message based and thus way simpler than a conventional socket
   * implementation. Authentication, fragmentation and security are abstracted
   * inside the websocket layer.
   */
  class SieveWebSocketClient extends SieveAbstractClient {


    /**
     * Creates a new instance
     * @param {SieveAbstractLogger} logger
     *   the logger which should be used.
     */
    constructor(logger) {

      super();

      this.timeoutTimer = new SieveTimer();
      this.idleTimer = new SieveTimer();

      this.socket = null;
      this._logger = logger;
      this.secure = true;
    }


    /**
     * WebSockets work like http it is either secure or not
     * but it can not be upgraded later.
     **/
    async startTLS() {
      throw new Error("WebSockets do not support starttls");
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
    connect(host, port, secure) {

      if (this.socket)
        return this;

      this.host = host;
      this.port = port;
      this.secure = secure;

      this.getLogger().logState(`Connecting to ${this.host}:${this.port} ...`);

      // Create the socket...
      if (secure)
        this.socket = new WebSocket(`wss://${host}:${port}`);
      else
        this.socket = new WebSocket(`ws://${host}:${port}`);

      // ... connect the event listeners.
      this.socket.onopen = function (ev) {
        this.onOpen(ev);
      };

      this.socket.onmessage = (ev) => {
        this.onReceive(ev.data.text());
      };

      this.socket.onerror = async (ev) => {
        if ((this.listener) && (this.listener.onError))
          await this.listener.onError(ev.message);
      };

      this.socket.onclose = async () => {
        this.disconnect();

        if ((this.listener) && (this.listener.onDisconnect))
          await this.listener.onDisconnect();
      };

      return this;
    }

    /**
     * @inheritdoc
     */
    disconnect() {
      super.disconnect();

      if (!this.socket)
        return;

      this.socket.close();
      this.socket = null;

      if (this.idleTimer) {
        window.clearTimeout(this.idleTimer);
        this.idleTimer = null;
      }

      if (this.timeoutTimer) {
        window.clearTimeout(this.timeoutTimer);
        this.timeoutTimer = null;
      }

      this.getLogger().logState("Disconnected ...");
    }


    /**
     * Called when the websocket connection is open.
     *
     * @param {Event} ev
     *  the event handler with details about the open event.
     */
    onOpen(ev) {
      this.getLogger().logState(`Connected to ${this.host}:${this.port} ...`);
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

      this.socket.send(output);
    }
  }

  exports.Sieve = SieveWebSocketClient;

})(module.exports);
