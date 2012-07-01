/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *   
 * The code is based on the devmo tutorial "How to Build an XPCOM Component
 * in Javascript" and a loose adaption of Enigmail's codebase (enigmail.mozdev.org)
 * 
 */

/*
 *  [scriptable, uuid(70032DE0-CD59-41ba-839D-FC1B65367EE7)]
 *  interface nsIMsgAccountManagerExtension : nsISupports
 *  {
 *    readonly attribute ACString name;   // examples:  mdn
 *    boolean showPanel(in nsIMsgIncomingServer server);
 *    readonly attribute ACString chromePackageName;  // example:  messenger, chrome://messenger/content/am-mdn.xul and chrome://messenger/locale/am-mdn.properties
 *  };
 *  
 */
// Enable Strict Mode
"use strict";

if (typeof(Cc) == 'undefined')
  { var Cc = Components.classes; }

if (typeof(Ci) == 'undefined')
  { var Ci = Components.interfaces; }  

if (typeof(Cr) == 'undefined')
  { var Cr = Components.results; }


//class constructor
function SieveAccountManagerExtension() {};

// class definition
SieveAccountManagerExtension.prototype = 
{
  classID : Components.ID("{87f5b0a0-14eb-11df-a769-0002a5d5c51b}"),
  contactID : "@mozilla.org/accountmanager/extension;1?name=sieve.mozdev.org",
  classDescription: "Sieve Account Manager Extension",
  
  name : "sieve-account",  
  chromePackageName : "sieve",
  showPanel: function(server) 
  {
    if (server.type == "imap")
      return true;
      
    if (server.type == "pop3")
      return true;
      
    return false;
  },

  QueryInterface: function(aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIMsgAccountManagerExtension) 
      && !aIID.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

// ************************************************************************** //

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
const NSGetFactory = XPCOMUtils.generateNSGetFactory([SieveAccountManagerExtension])
