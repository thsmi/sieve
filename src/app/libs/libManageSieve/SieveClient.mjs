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
import {
  SieveAbstractClient,
  TLS_SECURITY_IMPLICIT,
  TLS_SECURITY_EXPLICIT
} from "./SieveAbstractClient.mjs";

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
  async connect(url, options) {

    if (this.socket)
      return this;

    if (typeof url === 'string' || url instanceof String)
      url = new SieveUrl(url);

    this.host = url.getHost();
    this.port = url.getPort();


    if (typeof(options) === "undefined" || options === null)
      options = {};

    if (typeof(options.security) === "undefined" || options.security === null)
      options.security = TLS_SECURITY_EXPLICIT;

    this.security = options.security;
    this.secured = false;

    this.socket = net.connect(this.port, this.host);

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

    // In case of implicit tls we directly upgrade the socket...
    // ... so no need to set a data listener here ...
    if (this.security === TLS_SECURITY_IMPLICIT) {
      await this.startTLS(options);
      return this;
    }

    this.socket.on('data', async (data) => {
      this.onData(data);
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

    return await new Promise((resolve) => {
      // Upgrade the current socket.
      // this.tlsSocket = tls.TLSSocket(socket, options).connect();
      this.tlsSocket = tls.connect({
        socket: this.socket,
        servername: this.host,
        rejectUnauthorized: false        
      });

      this.tlsSocket.on('secureConnect', () => {

        try {

          const cert = this.tlsSocket.getPeerCertificate(true);

          if (this.tlsSocket.authorized === true) {

            // The connection is trusted, so we are good to go.
            // But a user still might deicide to pin the fingerprint for
            // additional security.
            if (!options.fingerprints.length) {
              this.secured = true;
              resolve();
              this.getLogger().logState('Socket upgraded! (Chain of Trust)');
              return;
            }

            if (this.isPinnedCert(cert, options.fingerprints)) {
              this.secured = true;
              resolve();
              return;
            }

            // If not we need to fail right here...
            throw new SieveCertValidationException({
              host: this.host,
              port: this.port,

              fingerprint: cert.fingerprint,
              fingerprint256: cert.fingerprint256,

              message: "Server fingerprint does not match pinned fingerprint"
            });
          }

          // Authorized is false which means we have an ssl error.
          // So let's check if it is an verification error.
          //
          // It will be non null e.g. for self signed certificates.
          const error = this.tlsSocket.ssl.verifyError();

          if ((error !== null ) && (options.ignoreCertErrors.includes(error.code))) {

            if (this.isPinnedCert(cert, options.fingerprints)) {
              this.secured = true;
              resolve();
              return;
            }

            throw new SieveCertValidationException({
              host: this.host,
              port: this.port,

              fingerprint: cert.fingerprint,
              fingerprint256: cert.fingerprint256,

              code: error.code,
              message: error.message
            });
          }

          if (this.tlsSocket.authorizationError === "ERR_TLS_CERT_ALTNAME_INVALID") {
            if (this.isPinnedCert(cert, options.fingerprints)) {
              this.secured = true;
              resolve();
              return;
            }
          }

          throw new SieveCertValidationException({
            host: this.host,
            port: this.port,

            fingerprint: cert.fingerprint,
            fingerprint256: cert.fingerprint256,

            code: error.code,
            message: `Error upgrading (${this.tlsSocket.authorizationError})`
          });

        } catch (ex) {
          // We cannot exit here with a reject or exception. Because the server
          // side will hang up the connection thus triggers a disconnect event.
          // As this disconnect will cause an exception we would race against it.
          //
          // To avoid this race we call disconnect gracefully here, which will
          // mark the connection as dead, thus the disconnect handler will not fire,
          // but the disconnect call will still throw an error for us.
          this.disconnect(ex);
        }
      });

      this.tlsSocket.on('data', (data) => { this.onData(data); });
    });
  }

  /**
   * Checks if the cert's finger print was pinned down and is trusted.
   *
   * @param {object} cert
   *    the peer certificate where the fingerprints should be checked.
   * @param {string[]} fingerprints
   *    an array of fingerprints
   *
   * @returns {boolean}
   *   true in case the fingerprint was pinned and the certificate is
   *   trustworthy otherwise false.
   */
  isPinnedCert(cert, fingerprints) {

    // so let's check the if the server's sha1 fingerprint matches the pinned one.
    if (fingerprints.includes(cert.fingerprint)) {
      this.getLogger().logState('Socket upgraded! (Pinned SHA1 fingerprint)');
      return true;
    }

    // then check the sha256 fingerprint.
    if (fingerprints.includes(cert.fingerprint256)) {
      this.getLogger().logState('Socket upgraded! (Pinned SHA256 fingerprint)');
      return true;
    }

    return false;
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

export {
  SieveNodeClient as Sieve
};
