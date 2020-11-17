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

/* global browser */

// Handle all imports..
import { SieveAbstractClient } from "./SieveAbstractClient.mjs";
import { SieveResponseParser } from "./SieveResponseParser.mjs";
import { SieveRequestBuilder } from "./SieveRequestBuilder.mjs";

import { SieveTimer } from "./SieveTimer.mjs";
import {
  SieveCertValidationException,
  SieveClientException,
  SieveException
} from "./SieveExceptions.mjs";

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

    this.timeoutTimer = new SieveTimer();
    this.idleTimer = new SieveTimer();

    this._logger = logger;
    this.secure = true;
  }

  /**
   * @inheritdoc
   */
  isAlive() {
    if (!super.isAlive(this))
      return false;

    return browser.sieve.socket.isAlive(this.socket);
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
    await browser.sieve.socket.startTLS(this.socket);
  }

  /**
   * @inheritdoc
   */
  getTimeoutTimer() {
    return this.timeoutTimer;
  }

  /**
   * @inheritdoc
   */
  getIdleTimer() {
    return this.idleTimer;
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
  async connect(host, port, secure) {
    if (this.socket)
      return this;

    this.host = host;
    this.port = port;
    this.secure = secure;

    this.getLogger().logState(`Connecting to ${this.host}:${this.port} ...`);

    this.socket = await (browser.sieve.socket.create(host, port, secure));

    await (browser.sieve.socket.onLog.addListener((message) => {
      this.getLogger().logState(message);
    }, this.socket));

    await (browser.sieve.socket.onData.addListener((bytes) => {
      super.onReceive(bytes);
    }, this.socket));

    await (browser.sieve.socket.onError.addListener((error) => {

      // Exceptions can't be transferred between experiments and background pages
      // This means we need to convert the error object into an exception.
      if (error && error.type === "CertValidationError")
        error = new SieveCertValidationException(error);
      else if (error && error.type === "SocketError")
        error = new SieveClientException(error.message);
      else
        error = new SieveException(`Socket failed without providing an error code.`);

      if ((this.listener) && (this.listener.onError))
        (async () => { await this.listener.onError(error); })();
    }, this.socket));

    await (browser.sieve.socket.onClose.addListener((hadError) => {
      super.disconnect();
      browser.sieve.socket.destroy(this.socket);

      if ((this.listener) && (this.listener.onDisconnected))
        (async () => { await this.listener.onDisconnected(hadError); })();
    }, this.socket));

    await (browser.sieve.socket.connect(this.socket));

    return this;
  }

  /**
   * @inheritdoc
   */
  disconnect(reason) {

    super.disconnect(reason);

    if (!this.socket)
      return;

    browser.sieve.socket.destroy(this.socket);

    this.getLogger().logState("Disconnected ...");
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

    browser.sieve.socket.send(this.socket, output);

    return;
  }
}

export { SieveMozClient as Sieve };
