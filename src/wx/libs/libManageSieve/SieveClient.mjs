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

import {
  SieveCertValidationException,
  SieveClientException,
  SieveException
} from "./SieveExceptions.mjs";

import { SieveUrl } from "./SieveUrl.mjs";

/**
 *  This realizes the abstract sieve implementation by using
 *  the mozilla specific network implementation.
 */
class SieveMozClient extends SieveAbstractClient {

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

    this.getLogger().logState("[SieveClient:startTLS()] Upgrading to secure socket");

    await browser.sieve.socket.startTLS(this.socket);

    this.secured = true;
  }

  /**
   * @inheritdoc
   */
  async connect(url) {
    if (this.socket)
      return this;

    if (typeof url === 'string' || url instanceof String)
      url = new SieveUrl(url);

    this.host = url.getHost();
    this.port = url.getPort();

    this.getLogger().logState(`Connecting to ${this.host}:${this.port} ...`);

    this.socket = await (browser.sieve.socket.create(
      this.host, this.port, this.getLogger().level()));

    await (browser.sieve.socket.onData.addListener((bytes) => {
      this.onData(bytes);
    }, this.socket));

    await (browser.sieve.socket.onError.addListener(async (error) => {
      this.getLogger().logState(`SieveClient: OnError (Connection ${this.host}:${this.port})`);

      // Exceptions can't be transferred between experiments and background pages
      // This means we need to convert the error object into an exception.
      if (error && error.type === "CertValidationError")
        error = new SieveCertValidationException(error);
      else if (error && error.type === "SocketError")
        error = new SieveClientException(error.message);
      else
        error = new SieveException(`Socket failed without providing an error code.`);

      if ((this.listener) && (this.listener.onError))
        await this.listener.onError(error);
    }, this.socket));

    await (browser.sieve.socket.onClose.addListener(async () => {
      this.getLogger().logState(`SieveClient: OnClose (Connection ${this.host}:${this.port})`);

      await this.disconnect(new Error("Server closed connection unexpectedly"));
    }, this.socket));

    await (browser.sieve.socket.connect(this.socket));

    return this;
  }

  /**
   * @inheritdoc
   */
  async destroy() {
    this.getLogger().logState(`[SieveClient:destroy()] ... destroying socket...`);
    await browser.sieve.socket.destroy(this.socket);
    this.socket = null;
  }

  /**
   * @inheritdoc
   */
  onSend(data) {

    // Convert string into an UTF-8 array...
    const output = Array.prototype.slice.call(
      (new TextEncoder()).encode(data));

    if (this.getLogger().isLevelStream())
      this.getLogger().logStream(`Client -> Server [Byte Array]:\n${output}`);

    browser.sieve.socket.send(this.socket, output);
  }
}

export { SieveMozClient as Sieve };
