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
import {
  SieveAbstractClient,
  TLS_SECURITY_EXPLICIT
} from "./SieveAbstractClient.mjs";

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
  async isAlive() {
    if (!(await super.isAlive(this)))
      return false;

    const state = await (browser.tcpSocket.getReadyState(this.socket));

    if (state !== "open")
      return false;

    return true;
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

    await browser.tcpSocket.upgradeToSecure(this.socket);

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

    this.security = TLS_SECURITY_EXPLICIT;

    this.getLogger().logState(`Connecting to ${this.host}:${this.port} ...`);

    this.socket = await browser.tcpSocket.create();

    // We need to register the listeners before calling connect otherwise
    // we create race between the threads.
    browser.tcpSocket.onData.addListener((bytes) => {
      this.onData(bytes);
    }, this.socket);

    browser.tcpSocket.onError.addListener(async (type, details) => {
      this.getLogger().logState(`SieveClient: OnError (Connection ${this.host}:${this.port})`);

      // Exceptions can't be transferred between experiments and background pages
      // This means we need to convert the error object into an exception.
      let error = null;

      if (type === "SecurityError")
        error = new SieveCertValidationException(details);
      else if (error.type === "SocketError")
        error = new SieveClientException(details.message);
      else
        error = new SieveException(details.message);

      if ((this.listener) && (this.listener.onError))
        await this.listener.onError(error);

    }, this.socket);

    await (browser.tcpSocket.onClose.addListener(async () => {
      this.getLogger().logState(`SieveClient: OnClose (Connection ${this.host}:${this.port})`);

      await this.disconnect(new Error("Server closed connection unexpectedly"));
    }, this.socket));

    await (browser.tcpSocket.connect(this.socket, this.host, this.port, {}));

    return this;
  }

  /**
   * @inheritdoc
   */
  async destroy() {
    this.getLogger().logState(`[SieveClient:destroy()] ... destroying socket...`);
    await browser.tcpSocket.destroy(this.socket);
    this.socket = null;
  }

  /**
   * @inheritdoc
   */
  onSend(data) {

    // Convert string into an UTF-8 array...
    const output = new Uint8Array((new TextEncoder()).encode(data));

    if (this.getLogger().isLevelStream())
      this.getLogger().logStream(`Client -> Server [Byte Array]:\n${output}`);

    browser.tcpSocket.sendBytes(this.socket, output.buffer, 0, output.buffer.byteLength);
  }
}

export { SieveMozClient as Sieve };
