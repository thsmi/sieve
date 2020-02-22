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

  const { SieveAbstractLogger } = require("./SieveAbstractLogger.js");

  /**
   * Implements a sieve compatible logger instance for node
   */
  class SieveNodeLogger extends SieveAbstractLogger {

    /**
     * @inheritdoc
     */
    log(message, level) {

      if (!this.isLoggable(level))
        return this;

      // eslint-disable-next-line no-console
      console.log("[" + this.getTimestamp() + " " + this.prefix() + "] " + message);
      return this;
    }
  }

  exports.SieveLogger = SieveNodeLogger;

})(this);

