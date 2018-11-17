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

/* global window */

(function (exports) {

  "use strict";

  const { SieveAbstractLogger } = require("./SieveAbstractLogger.js");

  /* global console */

  /**
   * Implements a sieve compatilbe logger instance for node
   * @constructor
   */
  class SieveLogger extends SieveAbstractLogger {

    /**
     * @inheritDoc
     */
    log(message, level) {

      if (!this.isLoggable(level))
        return;

      console.log("[" + this.getTimestamp() + " " + this.prefix() + "] " + message);
    }
  }

  exports.SieveLogger = SieveLogger;

})(this);

