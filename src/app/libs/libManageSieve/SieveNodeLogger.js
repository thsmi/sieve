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

"use strict";

(function (exports) {

  const { SieveAbstractLogger } = require("./SieveAbstractLogger.js");

  /* global console */

  /**
   * Implements a sieve compatilbe logger instance for node
   * @constructor
   */
  function SieveLogger() {
    SieveAbstractLogger.call(this);
  }

  SieveLogger.prototype = Object.create(SieveAbstractLogger.prototype);
  SieveLogger.prototype.constructor = SieveLogger;

  SieveLogger.prototype.log
    = function (message, level) {

      if (!this.isLoggable(level))
        return;

      console.log("[" + this.getTimestamp() + " " + this.prefix() + "] " + message);
    };

  exports.SieveLogger = SieveLogger;

})(this);

