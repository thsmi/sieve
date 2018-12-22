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

  /* global Components */

  Components.utils.import("chrome://sieve/content/modules/sieve/SieveRequire.jsm");

  const { SieveLogger } = require("./SieveMozLogger.js");
  const { Sieve } = require("./SieveMozClient.js");
  const { SieveInitRequest } = require("./SieveRequest.js");

  /**
   *
   */
  class SieveAutoConfigHost {

    /**
     * Test if a serve can be reached with the current configuration
     *
     * @param {string} host
     *   the hostname
     * @param {int} port
     *   the port which should be tests
     * @param {Proxy} proxy
     *   a reference to the proxy configuration
     * @param {Object} listener
     *   the listener's onSuccess will be called when the server could be reached.
     *   the onError message will be called upon a timeout or a connection error.
     * @param {SieveAbstractLogger} logger
     *   a reference to a logger instance
     */
    constructor(host, port, proxy, listener, logger) {
      this.port = port;
      this.host = host;
      this.proxy = proxy;
      this.listener = listener;

      this.sieve = new Sieve(logger);

      this.sieve.addListener(this);

      let request = new SieveInitRequest();
      request.addErrorListener(this);
      request.addResponseListener(this);
      this.sieve.addRequest(request);
    }

    /**
     * Internal callback, handles init responses.
     *
     */
    onInitResponse() {
      this.listener.onSuccess(this);
      this.cancel();
    }

    /**
     * Internal callback, handles on idle events
     *
     */
    onIdle() {
      // just an empty stub...
    }

    /**
     * Internal callback, handled on error events
     *
     */
    onError() {
      if (this.listener)
        this.listener.onError(this);

      this.cancel();
    }

    /**
     * Internal callback, handles a timeout event
     *
     */
    onTimeout() {
      this.onError();
    }

    /**
     * Internal callback, handles on disconnect event
     *
     */
    onDisconnect() {
      this.onError();
    }

    /**
     * Cancels the current auto configuration
     *
     **/
    cancel() {
      this.callback = null;
      this.sieve.disconnect();
    }

    /**
     * Starts the auto configuration.
     *
     */
    run() {
      this.sieve.connect(this.host, this.port, false, null, this.proxy);
    }
  }

  /**
   * Tries to detect the host sieve port.
   * All test are run concurrently. When the first test succeeds all others are canceled.
   * In worst case all test fail with a timeout.
   */
  class SieveAutoConfig {

    /**
     * Creates a new auto config instance
     **/
    constructor() {
      this.logger = new SieveLogger();
      this.hosts = [];
    }

    /**
     * Adds a new test request to the queue.
     *
     * @param {string} host
     *   the hostname which should be tested
     * @param {int} port
     *   the port which should be tested
     * @param {Proxy} proxy
     *   the proxy configuration
     *
     */
    addHost(host, port, proxy) {
      if (this.activeHosts > 0)
        throw new Error("Auto config already running");

      this.hosts.push(new SieveAutoConfigHost(host, port, proxy, this, this.logger));
    }

    /**
     * Runs all enqueued tests.
     *
     * @param {SieveAutoConfigHost} listener
     *   the listener which is invoked when either a test succeeds or all of the test fail.
     *
     */
    run(listener) {
      if (this.activeHosts > 0)
        throw new Error("Auto config already running");

      this.listener = listener;
      this.activeHosts = this.hosts.length;

      for (let i = 0; i < this.hosts.length; i++)
        this.hosts[i].run();
    }

    /**
     * Cancels all pending tests.
     *
     **/
    cancel() {
      for (let i = 0; i < this.hosts.length; i++)
        this.hosts[i].cancel();

      this.hosts = [];
      this.activeHosts = this.hosts.length;
    }

    /**
     * Internal callback, called when a host test fails.
     *
     *
     */
    onError() {
      this.activeHosts--;

      // the error listener is only invoked, when all tests failed...
      if (this.activeHosts > 0)
        return;

      this.cancel();
      this.listener.onError();
    }

    /**
     * Internal callback, called when a host test succeeds.
     * It automatically cancel all other pending test.
     *
     * @param {SieveAutoConfigHost} sender
     *   the host test which succeeded
     *
     */
    onSuccess(sender) {
      // decrement our ref counter;
      this.activeHosts--;

      // the first successfull test wins...
      // ... so cancel all pending ones...
      this.cancel();

      // ... and invoke the callback
      this.listener.onSuccess(sender.host, sender.port, sender.proxy);
    }
  }

  exports.SieveAutoConfig = SieveAutoConfig;

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  exports.EXPORTED_SYMBOLS.push("SieveAutoConfig");

})(this);
