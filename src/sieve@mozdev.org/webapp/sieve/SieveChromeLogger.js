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

(function(exports) {
	
	/* global console */
	/* global SieveAbstractLogger */
	
  function SieveLogger()
  {
    SieveAbstractLogger.call(this);
  }
  
  SieveLogger.prototype = Object.create(SieveAbstractLogger.prototype);
  SieveLogger.prototype.constructor = SieveLogger;   
  
  /**
   * 
   * @param {} message
   * @optional @param {} level
   */
  SieveLogger.prototype.log
    = function (message, level) {
    	
    if (!this.isLoggable(level))
      return;
      
    console.log("["+this.prefix()+"] "+message);      
  };

  exports.SieveLogger = SieveLogger;  
  
})(window);

