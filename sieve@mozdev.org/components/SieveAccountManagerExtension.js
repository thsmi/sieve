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


// Define the Contact information needed for this Component...
// ... the Unique Component Identifier, ...
const SIEVE_CLASS_ID = Components.ID("{649ce960-9dfb-11dd-ad8b-0800200c9a66}");
// ... the description and ...
const SIEVE_CLASS_NAME = "Sieve Account Manager Extension";
// ... textual unique identifier or rendevous point in the ...
// ... category manager.
const SIEVE_CONTACT_ID = "@mozilla.org/accountmanager/extension;1?name=sieve.mozdev.org";

// ************************************************************************** //

//class constructor
function SieveAccountManagerExtension() {};

// class definition
SieveAccountManagerExtension.prototype = 
{
  name : "sieve-account",
  chromePackageName : "sieve",
  showPanel: function(server) 
  {
    if (server.type == "imap")
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

***********************************************************/
var SieveAccountManagerExtensionFactory = 
{
  createInstance : function (aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
      
    return (new SieveAccountManagerExtension()).QueryInterface(aIID);
  }
}

/***********************************************************
module definition (xpcom registration)
***********************************************************/
var SieveAccountManagerExtensionModule = 
{
  registerSelf: function(compMgr, fileSpec, location, type)
  {
    compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    compMgr.registerFactoryLocation(SIEVE_CLASS_ID, SIEVE_CLASS_NAME, 
        SIEVE_CONTACT_ID, fileSpec, location, type);
        
    var catMgr = Components.classes["@mozilla.org/categorymanager;1"]
                     .getService(Components.interfaces.nsICategoryManager);
               
    catMgr.addCategoryEntry("mailnews-accountmanager-extensions",
                            SIEVE_CLASS_NAME,SIEVE_CONTACT_ID, true, true);    
  },

  unregisterSelf: function(compMgr, location, type)
  {
    compMgr = compMgr.
        QueryInterface(Components.interfaces.nsIComponentRegistrar);
    compMgr.unregisterFactoryLocation(SIEVE_CLASS_ID, location);
    
    var catMgr = Components.classes["@mozilla.org/categorymanager;1"]
                     .getService(Components.interfaces.nsICategoryManager);
    catMgr.deleteCategoryEntry("mailnews-accountmanager-extensions",
                               SIEVE_CONTACT_ID, true);    
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(SIEVE_CLASS_ID))
      return SieveAccountManagerExtensionFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};

/***********************************************************
module initialization

When the application registers the component, this function
is called.
***********************************************************/
function NSGetModule(aCompMgr, aFileSpec)
{
  return SieveAccountManagerExtensionModule; 
}
