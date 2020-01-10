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

  // Enable Strict Mode
  "use strict";

  const { Sieve } = require("./SieveNodeClient.js");

  const { SieveLogger } = require("./SieveNodeLogger.js");

  const {
    SieveAbstractSession
  } = require("./SieveAbstractSession.js");

  const {
    SieveReferralException
  } = require("./SieveExceptions.js");

  /**
   * @inheritdoc
   */
  class SieveSession extends SieveAbstractSession {

    /**
     * Creates a new Session instance.
     * @param {SieveAccount} account
     *   an reference to a sieve account. this is needed to obtain login informations.
     * @param {string} [sid]
     *   a unique Identifier for this Session. Only needed to make debugging easier.
     */
    constructor(account, sid) {

      super(
        account,
        new SieveLogger(sid, account.getSettings().getDebugFlags()));
    }

    /**
     * @inheritdoc
     */
    getSieve() {
      return this.sieve;
    }

    /**
     * @inheritdoc
     */
    createSieve() {
      this.sieve = new Sieve(this.getLogger());
    }

    /**
     * @inheritdoc
     */
    destroySieve() {
      this.sieve = null;
    }

    /**
     * @inheritdoc
     */
    async startTLS(options) {

      if (options === undefined || options === null)
        options = {};

      if (options.fingerprints === undefined || options.fingerprints === null)
        options.fingerprints = this.account.getHost().getFingerprint();

      if (options.ignoreErrors === undefined || options.ignoreErrors === null)
        options.ignoreErrors = this.account.getHost().getIgnoreCertErrors();

      await super.startTLS(options);
    }

    /**
     * The default error handler called upon any unhandled error or exception.
     * Called e.g. when the connection to the server was terminated unexpectedly.
     *
     * The default behaviour is to disconnect.
     *
     * @param {Error} error
     *   the error message which causes this exceptinal state.
     */
    async onError(error) {

      this.getLogger().log("OnError: " + error.message);

      await this.disconnect(true);
    }

    /**
     * Connects the session to the given port.
     *
     * By default the host and port configured in the settings are used
     * By you may override host and port, e.g. to realize a referal.
     *
     * @param {string} [hostname]
     *   the hostname, in case omitted the hostname from the account's settings is used
     * @param {string} [port]
     *   the port, in case omitted the port from the account's settings is used
     * @returns {SieveSession}
     *   a self reference
     */
    async connect(hostname, port) {

      try {
        await super.connect(hostname, port);
      } catch (ex) {

        if (!(ex instanceof SieveReferralException))
          throw ex;

        await this.disconnect(true);
        await this.connect(ex.getHostname(), ex.getPort());
      }

      return this;
    }

  }

  exports.SieveSession = SieveSession;

})(exports || this);
