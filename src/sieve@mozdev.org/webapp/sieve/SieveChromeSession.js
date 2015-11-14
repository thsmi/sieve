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

// Enable Strict Mode
"use strict";

(function(exports) {
	
/**
 * This class pools and caches concurrent connections (Channel) to an destinct 
 * remote server (Session).
 * Furthermore it's a wrapper around the Sieve object. It implements
 * the login/logout process, a watchdog, an hartbeat an much more. 
 * 
 * A session can contain arbitary connections, but there will be only one 
 * "physical" link to the server. All channels share the session's link.
 * 
 * @param {SieveAccount} account
 *   an reference to a sieve account. this is needed to obtain login informations.
 * @param @optional {Object} sid
 *   a unique Identifier for this Session. Only needed to make debugging easier.
 *   
 */

  function SieveSession(account, sid)
  {    
    var logger =  new SieveLogger(sid);
    logger.level(account.getSettings().getDebugFlags());
    logger.prefix(sid);
    
    SieveAbstractSession.call(this, account, logger)
  }

  SieveSession.prototype = Object.create(SieveAbstractSession.prototype);
  SieveSession.prototype.constructor = SieveSession;  

  exports.SieveSession = SieveSession;

})(window);   
