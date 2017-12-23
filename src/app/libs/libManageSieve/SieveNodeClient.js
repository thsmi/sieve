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

  /* global require */
  const { SieveAbstractClient } = require("./SieveAbstractClient.js");
  const { SieveNodeResponseParser } = require("./SieveNodeResponseParser.js");
  const { SieveNodeRequestBuilder } = require("./SieveNodeRequestBuilder.js");

  const net = require('net');
  const tls = require('tls');
  const timers = require('timers');

  /**
   * Uses Node networking to realize a sieve client.
   *
   * @param {AbstractLogger} logger
   *   the logger instance to use
   * @constructor
   */
  function Sieve(logger) {
    // Call the parent constructor...
    SieveAbstractClient.call(this);

    this.tlsSocket = null;
    this._logger = logger;
  }

  Sieve.prototype = Object.create(SieveAbstractClient.prototype);
  Sieve.prototype.constructor = Sieve;

  // Method used to controll the timers...
  Sieve.prototype.onStartTimeout
    = function () {

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
    };

  Sieve.prototype.onStopTimeout = function () {

    // clear any existing timeout
    if (this.timeoutTimer) {
      timers.clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    // and start the idle timer.
    this.onStartIdle();

    return;
  };

  Sieve.prototype.onStartIdle
    = function () {
      // first ensure the timer is stopped..
      this.onStopIdle();

      // ... then configure the timer.
      let delay = this.getIdleWait();

      if (!delay)
        return;

      this.idleTimer
        = timers.setTimeout(() => { this.onIdle(); }, delay);
    };

  Sieve.prototype.onStopIdle
    = function () {

      if (!this.idleTimer)
        return;

      timers.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    };

  Sieve.prototype.createParser
    = function (data) {
      return new SieveNodeResponseParser(data);
    };

  Sieve.prototype.createRequestBuilder = function () {
    return new SieveNodeRequestBuilder();
  };

  Sieve.prototype.getLogger
    = function () {
      return this._logger;
    };

  // connect...

  Sieve.prototype.connect
    = function (host, port, secure) {

      if (this.socket !== null)
        return;

      this.host = host;
      this.port = port;
      this.secure = secure;

      this.socket = net.connect(this.port, this.host);

      this.socket.on('connect', () => { this.onSocketConnected(); });
      this.socket.on('data', (data) => { this.onReceive(data); });
      this.socket.on('close', () => { this.disconnect(); });
    };

  Sieve.prototype.startTLS = function (callback) {

    SieveAbstractClient.prototype.startTLS.call(this);

    // Upgrade the current socket.
    //this.tlsSocket = tls.TLSSocket(socket, options).connect();
    this.tlsSocket = tls.connect({ socket: this.socket });

    this.tlsSocket.on('secureConnect', () => {
      this.getLogger().log('Socket upgraded!');
      callback();
    });

    this.tlsSocket.on('data', (data) => { this.onReceive(data); });
  };

  Sieve.prototype.disconnect
    = function () {

      SieveAbstractClient.prototype.disconnect.call(this);

      if (this.socket === null)
        return;

      this.getLogger().log("Disconnecting...");
      this.socket.destroy();
      this.socket.unref();
      this.socket = null;

      this.tlsSocket.destroy();
      this.tlsSocket.unref();
      this.tlsSocket = null;

      this.idleTimer = null;
      this.timeoutTimer = null;

      this.getLogger().log("Disconnected ...", (1 << 2));
    };

  // TODO detect server disconnects and communication errors...

  Sieve.prototype.onReceive
    = function (buffer) {

      this.getLogger().log('onDataRead (' + buffer.length + ')\n' + buffer.toString("utf8"));

      let data = [];

      for (let i = 0; i < buffer.length; i++) {
        data[i] = buffer.readUInt8(i);
      }

      SieveAbstractClient.prototype.onDataReceived.call(this, data);
    };

  Sieve.prototype.onSocketConnected
    = function (result) {
    };

  Sieve.prototype.onSend
    = function (data) {
      if (this.tlsSocket !== null) {
        this.tlsSocket.write(data, "utf8");
        return;
      }

      this.socket.write(data, "utf8");
    };


  exports.Sieve = Sieve;

})(this);