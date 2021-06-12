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

import { SieveUrl } from "./SieveUrl.mjs";
import { SieveAbstractClient } from "./SieveAbstractClient.mjs";

import { SieveCertValidationException } from "./SieveExceptions.mjs";

const net = require('net');
const tls = require('tls');

/**
 * Uses Node networking to realize a sieve client.
 */
class SieveNodeClient extends SieveAbstractClient {

  /**
   * @inheritdoc
   */
  constructor(logger) {

    super(logger);

    this.tlsSocket = null;
  }

  /**
   * @inheritdoc
   */
  isAlive() {
    if (this.isSecured() && !this.tlsSocket)
      return false;

    if (this.isSecured() && this.tlsSocket.destroyed)
      return false;

    if (!this.socket)
      return false;

    if (this.socket.destroyed)
      return false;

    return true;
  }

  /**
   * @inheritdoc
   */
  connect(url, secure) {

    if (this.socket)
      return this;

    if (typeof url === 'string' || url instanceof String)
      url = new SieveUrl(url);

    this.host = url.getHost();
    this.port = url.getPort();

    this.secure = secure;
    this.secured = false;

    this.socket = net.connect(this.port, this.host);

    this.socket.on('data', async (data) => {
      this.onData(data);
    });

    this.socket.on('error', async(error) => {
      this.getLogger().logState(`SieveClient: OnError (Connection ${this.host}:${this.port})`);
      // Node guarantees that close is called after error.
      if ((this.listener) && (this.listener.onError))
        await this.listener.onError(error);
    });

    this.socket.on('close', async () => {
      this.getLogger().logState(`SieveClient: OnClose (Connection ${this.host}:${this.port})`);

      // The sever closed the connection, so no time to gracefully disconnect.
      await this.disconnect(new Error("Server closed connection unexpectedly"));
    });

    return this;
  }

  /**
   * @inheritdoc
   */
  async startTLS(options) {

    if (options === undefined || options === null)
      options = {};

    if (options.fingerprints === undefined || options.fingerprints === null || options.fingerprints === "")
      options.fingerprints = [];

    if (Array.isArray(options.fingerprints) === false)
      options.fingerprints = [options.fingerprints];

    if (options.ignoreCertErrors === undefined || options.ignoreCertErrors === null || options.ignoreCertErrors === "")
      options.ignoreCertErrors = [];

    if (Array.isArray(options.ignoreCertErrors) === false)
      options.ignoreCertErrors = [options.ignoreCertErrors];

    await super.startTLS();

    return await new Promise((resolve, reject) => {
      // Upgrade the current socket.
      // this.tlsSocket = tls.TLSSocket(socket, options).connect();
      this.tlsSocket = tls.connect({
        socket: this.socket,
        rejectUnauthorized: false
      });

      this.tlsSocket.on('secureConnect', () => {

        const cert = this.tlsSocket.getPeerCertificate(true);

        if (this.tlsSocket.authorized === true) {

          // in case the fingerprint is not pinned we can skip right here.
          if (!options.fingerprints.length) {
            this.secured = true;
            resolve();
            this.getLogger().logState('Socket upgraded! (Chain of Trust)');
            return;
          }

          // so let's check the if the server's sha1 fingerprint matches the pinned one.
          if (options.fingerprints.includes(cert.fingerprint)) {
            this.secured = true;
            resolve();
            this.getLogger().logState('Socket upgraded! (Chain of Trust and pinned SHA1 fingerprint)');
            return;
          }

          // then check the sha256 fingerprint.
          if (options.fingerprints.includes(cert.fingerprint256)) {
            this.secured = true;
            resolve();
            this.getLogger().logState('Socket upgraded! (Chain of Trust and pinned SHA256 fingerprint)');
            return;
          }

          const secInfo = {
            host: this.host,
            port: this.port,

            fingerprint: cert.fingerprint,
            fingerprint256: cert.fingerprint256,

            message: "Server fingerprint does not match pinned fingerprint"
          };

          // If not we need to fail right here...
          reject(new SieveCertValidationException(secInfo));
          return;
        }

        const error = this.tlsSocket.ssl.verifyError();

        // dealing with self signed certificates
        if (options.ignoreCertErrors.includes(error.code)) {

          // Check if the fingerprint is well known...
          if (options.fingerprints.includes(cert.fingerprint)) {
            this.secured = true;
            resolve();

            this.getLogger().logState('Socket upgraded! (Trusted SHA1 Finger Print)');
            return;
          }

          // Check if the fingerprint is well known...
          if (options.fingerprints.includes(cert.fingerprint256)) {
            this.secured = true;
            resolve();

            this.getLogger().logState('Socket upgraded! (Trusted SHA256 Finger Print)');
            return;
          }
        }

        const secInfo = {
          host: this.host,
          port: this.port,

          fingerprint: cert.fingerprint,
          fingerprint256: cert.fingerprint256,

          code: error.code,
          message: error.message
        };

        reject(new SieveCertValidationException(secInfo));

        this.tlsSocket.destroy();
      });

      this.tlsSocket.on('data', (data) => { this.onData(data); });
    });
  }

  /**
   * @inheritdoc
   */
  async destroy() {
    this.getLogger().logState(`[SieveClient:destroy()] ... destroying socket...`);

    this.socket.destroy();

    if (this.socket && this.socket.unref)
      this.socket.unref();
    this.socket = null;

    if (this.tlsSocket) {
      this.tlsSocket.destroy();
      if (this.socket && this.socket.unref)
        this.tlsSocket.unref();
      this.tlsSocket = null;
    }
  }

  /**
   * Called when data was received and is ready to be processed.
   * @param {object} buffer
   *   the received data.
   */
  onData(buffer) {

    this.getLogger().logState(`onDataRead (${buffer.length})`);

    const data = [];

    for (let i = 0; i < buffer.length; i++) {
      data[i] = buffer.readUInt8(i);
    }

    super.onData(data);
  }

  /**
   * @inheritdoc
   */
  onSend(data) {

    if (this.getLogger().isLevelStream()) {
      // Force String to UTF-8...
      const output = Array.prototype.slice.call((new TextEncoder()).encode(data));

      this.getLogger().logStream(`Client -> Server [Byte Array]:\n${output}`);
    }

    if (this.tlsSocket !== null) {
      this.tlsSocket.write(data, "utf8");
      return;
    }

    this.socket.write(data, "utf8");
  }
}

export { SieveNodeClient as Sieve };
