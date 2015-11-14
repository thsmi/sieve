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

// TODO Split logic into classes representing the atomar states
// disconnected -> [connecting] -> connected -> [disconnecting] -> disconnected
//                              -> disconnected
//
// disconnected.connect(onSucces, onError);
// disconnected.disconnect(onSuccess);
// 


var EXPORTED_SYMBOLS = [ "SieveSession" ];

const Cc = Components.classes; 
const Ci = Components.interfaces;   
const Cr = Components.results; 
const Cu = Components.utils;

      
// pre load modules .
Cu.import("chrome://sieve/content/modules/sieve/SieveMozLogger.js");

Cu.import("chrome://sieve/content/modules/sieve/SieveAccounts.js");
Cu.import("chrome://sieve/content/modules/sieve/SieveMozClient.js");

(function(exports) {
	
  var Cc = Components.classes;
  var Ci = Components.interfaces;

  var loader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
                 .getService(Ci.mozIJSSubScriptLoader);
               
  loader.loadSubScript("chrome://sieve-common/content/libManageSieve/SieveAbstractSession.js", this, "UTF-8" );  
	
	
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
   **/

  function SieveSession(accountId, sid)
  {
    var account = SieveAccountManager.getAccountByName(accountId);
    
    var logger =  new SieveLogger(sid);
    logger.level(account.getSettings().getDebugFlags());
    logger.prefix(sid);
    
    SieveAbstractSession.call(this, account, logger)
  }
  
  SieveSession.prototype = Object.create(SieveAbstractSession.prototype);
  SieveSession.prototype.constructor = SieveSession;   
  

  SieveSession.prototype.onTimeout
      = function(message)
  {
    var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
    
    if (ioService.offline)
    {
      this._invokeListeners("onOffline");
      return;
    }
    
    this._invokeListeners("onTimeout",message);
  }
  
  
  // Needed for Bad Cert Listener....
  SieveSession.prototype.QueryInterface
      = function badcert_queryinterface(aIID)
  {
    if (aIID.equals(Ci.nsISupports))
      return this;
      
    if (aIID.equals(Ci.nsIBadCertListener2))
      return this;
    if (aIID.equals(Ci.nsISSLErrorListener))
      return this;
      
    if (aIID.equals(Ci.nsIInterfaceRequestor))
      return this;
            
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
  
  // Ci.nsIInterfaceRequestor
  SieveSession.prototype.getInterface
      = function (aIID)
  {
    return this.QueryInterface(aIID);
  },  
  
  // Ci.nsiBadCertListerner2
  // Implement nsIBadCertListener2 Interface to override
  // the "bad cert" dialog. The the connection will be closed
  // after an Certificate error...
  /**
   * @param {} socketInfo
   * @param {} sslStatus
   * @param {String} targetSite
   * @return {Boolean}
   */
  SieveSession.prototype.notifyCertProblem
      = function (socketInfo, sslStatus, targetSite)
  {
    this.logger.log("Sieve BadCertHandler: notifyCertProblem");
  
    // no listener registert, show the default UI
    if (!this._hasListeners("onBadCert"))
      return false;
      
    this._invokeListeners("onBadCert",targetSite,sslStatus);
    return true;
  },
  
  // Ci.nsISSLErrorListener
  /**
   * 
   * @param {} socketInfo
   * @param {} error
   * @param {} targetSite
   * @return {Boolean}
   */
  SieveSession.prototype.notifySSLError
      = function (socketInfo, error, targetSite)
  {
    this.logger.log("Sieve BadCertHandler: notifySSLError");
    
    // no listener registert, show the default UI 
    if (!this._hasListeners("onBadCert"))
      return false;

    // otherwise call the listener and supress the default UI
    this._invokeListeners("onBadCert",targetSite,error);
    return true;      
  }  
  
  exports.SieveSession = SieveSession;
  
})(this); 
