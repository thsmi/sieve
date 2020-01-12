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

  const { SieveAbstractClient } = require("./SieveAbstractClient.js");
  const { SieveNodeResponseParser } = require("./SieveNodeResponseParser.js");
  const { SieveNodeRequestBuilder } = require("./SieveNodeRequestBuilder.js");

  const { SieveCertValidationException } = require("./SieveExceptions.js");

  const net = require('net');
  const tls = require('tls');
  const timers = require('timers');

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
    }


    /**
     * @inheritdoc
     */
    onStartTimeout() {

      // Clear any existing timeouts
      if (this.timeoutTimer) {
        timers.clearTimeout(this.timeoutTimer);
        this.timeoutTimer = null;
      }

      // ensure the idle timer is stopped
      this.onStopIdle();

      // then restart the timeout timer
      this.timeoutTimer = timers.setTimeout(
        () => { this.onTimeout(); },
        this.getTimeoutWait());
    }

    /**
     * @inheritdoc
     */
    onStopTimeout() {

      // clear any existing timeout
      if (this.timeoutTimer) {
        timers.clearTimeout(this.timeoutTimer);
        this.timeoutTimer = null;
      }

      // and start the idle timer.
      this.onStartIdle();

      return;
    }

    /**
     * @inheritdoc
     */
    onStartIdle() {
      // first ensure the timer is stopped..
      this.onStopIdle();

      // ... then configure the timer.
      const delay = this.getIdleWait();

      if (!delay)
        return;

      this.idleTimer
        = timers.setTimeout(async () => { await this.onIdle(); }, delay);
    }

    /**
     * @inheritdoc
     */
    onStopIdle() {

      if (!this.idleTimer)
        return;

      timers.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    /**
     * @inheritdoc
     */
    createParser(data) {
      return new SieveNodeResponseParser(data);
    }

    /**
     * @inheritdoc
     */
    createRequestBuilder() {
      return new SieveNodeRequestBuilder();
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
     *   The target port as Interger
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

      this.socket.on('data', (data) => { this.onReceive(data); });
      this.socket.on('error', (error) => {
        // Node guarantees that close is called after error.
        if ((this.listener) && (this.listener.onError))
          (async () => { await this.listener.onError(error); })();
      });
      this.socket.on('close', () => {
        this.disconnect();

        if ((this.listener) && (this.listener.onDisconnect))
          (async () => { await this.listener.onDisconnect(); })();
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

      if (options.ignoreErrors === undefined || options.ignoreErrors === null || options.ignoreErrors === "")
        options.ignoreErrors = [];

      if (Array.isArray(options.ignoreErrors) === false)
        options.ignoreErrors = [options.ignoreErrors];

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
              this.getLogger().log('Socket upgraded! (Chain of Trust)');
              return;
            }

            // so let's check the if the server's fingerpint matches the pinned one.
            if (options.fingerprints.indexOf(cert.fingerprint) !== NOT_FOUND) {
              resolve();
              this.getLogger().log('Socket upgraded! (Chain of Trust and pinned fingerprint)');
              return;
            }

            // If not we need to fail right here...
            reject(new SieveCertValidationException(
              new Error("Server fingerprint does not match pinned fingerprint"),
              this.tlsSocket.getPeerCertificate(true)));
            return;
          }

          const error = this.tlsSocket.ssl.verifyError();

          // dealing with self signed certificates
          if (options.ignoreErrors.indexOf(error.code) !== NOT_FOUND) {

            // Check if the fingerprint is well known...
            if (options.fingerprints.indexOf(cert.fingerprint) !== NOT_FOUND) {
              resolve();

              this.getLogger().log('Socket upgraded! (Trusted Finger Print)');
              return;
            }
          }

          reject(new SieveCertValidationException(
            this.tlsSocket.ssl.verifyError(),
            this.tlsSocket.getPeerCertificate(true)));

          this.tlsSocket.destroy();
        });

        this.tlsSocket.on('data', (data) => { this.onReceive(data); });
      });
    }

    /**
     * @inheritdoc
     */
    disconnect() {

      super.disconnect();

      this.getLogger().log("Disconnecting...");
      if (this.socket) {
        this.socket.destroy();
        this.socket.unref();
        this.socket = null;
      }

      if (this.tlsSocket) {
        this.tlsSocket.destroy();
        this.tlsSocket.unref();
        this.tlsSocket = null;
      }

      this.idleTimer = null;
      this.timeoutTimer = null;

      this.getLogger().logState("Disconnected ...");
    }

    // TODO detect server disconnects and communication errors...

    /**
     * Called when data was received and is ready to be processed.
     * @param {object} buffer
     *   the received data.
     */
    onReceive(buffer) {

      this.getLogger().log('onDataRead (' + buffer.length + ')\n' + buffer.toString("utf8"));

      const data = [];

      for (let i = 0; i < buffer.length; i++) {
        data[i] = buffer.readUInt8(i);
      }

      super.onReceive(data);
    }

    /**
     * @inheritdoc
     */
    onSend(data) {
      if (this.tlsSocket !== null) {
        this.tlsSocket.write(data, "utf8");
        return;
      }

      this.socket.write(data, "utf8");
    }
  }


  exports.Sieve = SieveNodeClient;

})(this);
