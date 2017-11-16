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

"use strict";

(function(exports) {

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  /* global Components */
  /* global SieveAbstractLogger */

	var Cc = Components.classes;
	var Ci = Components.interfaces;

  var loader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
                 .getService(Ci.mozIJSSubScriptLoader);

  loader.loadSubScript("chrome://sieve-common/content/libManageSieve/SieveAbstractLogger.js", this, "UTF-8" );

  /**
   * @classdesc A mozilla specific logger
   * @class
   * @extends SieveAbstractLogger
   */
  function SieveLogger()
  {
    SieveAbstractLogger.call(this);
  }

  SieveLogger.prototype = Object.create(SieveAbstractLogger.prototype);
  SieveLogger.prototype.constructor = SieveLogger;


  /**
   * @private
   *
   * Padds the given string with leading zeros
   *
   * @param {string} n
   *   the string which should be padded
   * @param {int} m
   *   the maximum padding.
   *
   * @returns {string}
   *   the padded string
   */
  SieveLogger.prototype._pad
    = function(n, m) {

    var str = n;

    for (var i = 0; i < m; i++)
      if (n < Math.pow(10,i))
        str = '0'+str;

    return str;
  };

  SieveLogger.prototype.getTimestamp
    = function () {

    let date = new  Date();
    return this._pad(date.getHours(),2)
      + ":"+this._pad(date.getMinutes(),2)
      + ":"+this._pad(date.getSeconds(),2)
      + "."+this._pad(date.getMilliseconds(),3);
  };

  /**
   * @override
   **/
  SieveLogger.prototype.log
    = function (message, level) {

    if (!this.isLoggable(level))
      return;

    Cc["@mozilla.org/consoleservice;1"]
      .getService(Ci.nsIConsoleService)
      .logStringMessage("["+this.getTimestamp()+" "+this.prefix()+"] "+message);

    /*Cc["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Components.interfaces.nsIPromptService)
      .alert(null, "Alert", msg);*/
    return this;
  };

  exports.SieveLogger = SieveLogger;
  exports.EXPORTED_SYMBOLS.push("SieveLogger");

})(this);

