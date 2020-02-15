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


  const {
    SieveAbstractSession
  } = require("./SieveAbstractSession.js");

  /**
   * @inheritdoc
   */
  class SieveNodeSession extends SieveAbstractSession {

    /**
     * @inheritdoc
     */
    async startTLS() {

      const options = {
        fingerprints : this.getOption("certFingerprints"),
        ignoreCertErrors : this.getOption("certIgnoreError")
      };

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

  }

  exports.SieveSession = SieveNodeSession;

})(exports || this);
