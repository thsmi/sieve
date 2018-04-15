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

  const {SieveAbstractLogger} = require("./SieveAbstractLogger.js");

  /**
   * @classdesc A mozilla specific logger
   * @class
   * @extends SieveAbstractLogger
   */
  function SieveLogger() {
    SieveAbstractLogger.call(this);
  }

  SieveLogger.prototype = Object.create(SieveAbstractLogger.prototype);
  SieveLogger.prototype.constructor = SieveLogger;

  /**
   * @override
   **/
  SieveLogger.prototype.log
    = function (message, level) {

      if (!this.isLoggable(level))
        return this;

      Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService)
        .logStringMessage("[" + this.getTimestamp() + " " + this.prefix() + "] " + message);

      /* Cc["@mozilla.org/embedcomp/prompt-service;1"]
        .getService(Components.interfaces.nsIPromptService)
        .alert(null, "Alert", msg); */
      return this;
    };

  exports.SieveLogger = SieveLogger;

})(module.exports);

