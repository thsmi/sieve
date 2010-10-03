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

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;


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

/***********************************************************
class factory

This object is a member of the global-scope Components.classes.
It is keyed off of the contract ID. Eg:

myHelloWorld = Components.classes["@dietrich.ganx4.com/helloworld;1"].
                          createInstance(Components.interfaces.nsIHelloWorld);

* @deprecated since Gecko 2.0 
*/
var SieveAccountManagerExtensionFactory = 
{
  createInstance : function (aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
      
    return (new SieveAccountManagerExtension()).QueryInterface(aIID);
  }
}

/**
 * module definition (xpcom registration)
 *
 * @deprecated since Gecko 2.0 
 */
var SieveAccountManagerExtensionModule = 
{
  registerSelf: function(compMgr, fileSpec, location, type)
  {
    compMgr = compMgr.QueryInterface(Ci.nsIComponentRegistrar);
    compMgr.registerFactoryLocation(
        SieveAccountManagerExtension.prototype.classID, 
        SieveAccountManagerExtension.prototype.classDescription,
        SieveAccountManagerExtension.prototype.contactID,
        fileSpec, location, type);
        
    var catMgr = Components.classes["@mozilla.org/categorymanager;1"]
                     .getService(Ci.nsICategoryManager);
               
    catMgr.addCategoryEntry(
        "mailnews-accountmanager-extensions",
        SieveAccountManagerExtension.prototype.classDescription,
        SieveAccountManagerExtension.prototype.contactID,
        true, true);    
  },

  unregisterSelf: function(compMgr, location, type)
  {
    compMgr = compMgr.QueryInterface(Ci.nsIComponentRegistrar);
    compMgr.unregisterFactoryLocation(
        SieveAccountManagerExtension.prototype.classID, location);
    
    var catMgr = Components.classes["@mozilla.org/categorymanager;1"]
                     .getService(Ci.nsICategoryManager);
    catMgr.deleteCategoryEntry(
        "mailnews-accountmanager-extensions",
        SieveAccountManagerExtension.prototype.contactID, true);    
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (!aIID.equals(Ci.nsIFactory))
      throw Cr.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(SieveAccountManagerExtension.prototype.classID))
      return SieveAccountManagerExtensionFactory;

    throw Cr.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};

/***********************************************************
module initialization

When the application registers the component, this function
is called.
***********************************************************/

try
{
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
}
catch (e) { }

// Gecko 2.x uses NSGetFactory to register XPCOM Components...
// ... while Gecko 1.x uses NSGetModule


if ((typeof(XPCOMUtils) != "undefined") && (typeof(XPCOMUtils.generateNSGetFactory) != "undefined"))
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([SieveAccountManagerExtension])
else
  var NSGetModule = function(compMgr, fileSpec) { return SieveAccountManagerExtensionModule; }
