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

import { SieveAbstractClient } from "./SieveAbstractClient.mjs";

import { SieveCertValidationException } from "./SieveExceptions.mjs";

const net = require('net');
const tls = require('tls');

const NOT_FOUND = -1;

/**
 * Uses Node networking to realize a sieve client.
 */
class SieveNodeClient extends SieveAbstractClient {


  /**
   * Creates a new instance
   * @param {AbstractLogger} logger
   *   the logger instance to use
   **/
  constructor(logger) {
    super();

    this.tlsSocket = null;
    this._logger = logger;
    this.secure = true;
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
  getLogger() {
    return this._logger;
  }

  /**
   * Connects to a ManageSieve server.
   * @param {string} host
   *   The target hostname or IP address as String
   * @param {int} port
   *   The target port as integer
   * @param {boolean} secure
   *   If true, a secure socket will be created. This allows switching to a secure
   *   connection.
   *
   * @returns {SieveAbstractClient}
   *   a self reference
   */
  connect(host, port, secure) {

    if (this.socket !== null)
      return this;

    this.host = host;
    this.port = port;
    this.secure = secure;

    this.socket = net.connect(this.port, this.host);

    this.socket.on('data', async (data) => { await this.onReceive(data); });
    this.socket.on('error', (error) => {
      this.getLogger().logState(`SieveClient: OnError (Connection ${this.host}:${this.port})`);
      // Node guarantees that close is called after error.
      if ((this.listener) && (this.listener.onError))
        (async () => { await this.listener.onError(error); })();
    });
    this.socket.on('close', async () => {
      this.getLogger().logState(`SieveClient: OnClose (Connection ${this.host}:${this.port})`);
      await this.disconnect();
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
            resolve();
            this.getLogger().logState('Socket upgraded! (Chain of Trust)');
            return;
          }

          // so let's check the if the server's sha1 fingerprint matches the pinned one.
          if (options.fingerprints.indexOf(cert.fingerprint) !== NOT_FOUND) {
            resolve();
            this.getLogger().logState('Socket upgraded! (Chain of Trust and pinned SHA1 fingerprint)');
            return;
          }

          // then check the sha256 fingerprint.
          if (options.fingerprints.indexOf(cert.fingerprint256) !== NOT_FOUND) {
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
        if (options.ignoreCertErrors.indexOf(error.code) !== NOT_FOUND) {

          // Check if the fingerprint is well known...
          if (options.fingerprints.indexOf(cert.fingerprint) !== NOT_FOUND) {
            resolve();

            this.getLogger().logState('Socket upgraded! (Trusted SHA1 Finger Print)');
            return;
          }

          // Check if the fingerprint is well known...
          if (options.fingerprints.indexOf(cert.fingerprint256) !== NOT_FOUND) {
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

      this.tlsSocket.on('data', async (data) => { await this.onReceive(data); });
    });
  }

  /**
   * @inheritdoc
   */
  async disconnect() {

    this.getLogger().logState(`SieveClient: Disconnecting ${this.host}:${this.port}...`);

    // Just a precaution ensures all timers are stopped.
    await super.disconnect();

    // In case the socket is gone we can skip right here
    if (!this.socket)
      return;

    if (this.socket) {
      this.socket.destroy();
      if (this.socket && this.socket.unref)
        this.socket.unref();
      this.socket = null;
    }

    if (this.tlsSocket) {
      this.tlsSocket.destroy();
      if (this.socket && this.socket.unref)
        this.tlsSocket.unref();
      this.tlsSocket = null;
    }

    if ((this.listener) && (this.listener.onDisconnected))
      await this.listener.onDisconnected();

    this.getLogger().logState("SieveClient: ... client disconnected.");
  }

  /**
   * Called when data was received and is ready to be processed.
   * @param {object} buffer
   *   the received data.
   */
  async onReceive(buffer) {

    this.getLogger().logState(`onDataRead (${buffer.length})`);

    const data = [];

    for (let i = 0; i < buffer.length; i++) {
      data[i] = buffer.readUInt8(i);
    }

    await (super.onReceive(data));
  }

  /**
   * @inheritdoc
   */
  onSend(data) {

    if (this.getLogger().isLevelStream()) {
      // Force String to UTF-8...
      const output = Array.prototype.slice.call(
        new Uint8Array(new TextEncoder("UTF-8").encode(data)));

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
