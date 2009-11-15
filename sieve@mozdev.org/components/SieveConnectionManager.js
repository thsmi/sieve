/* 
 * The content of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
const nsISupports = Components.interfaces.nsISupports;

// You can change these if you like
const CLASS_ID = Components.ID("229e3f9b-240f-45d8-afaf-e1c14606bfe9");
const CLASS_NAME = "Sieve Connection Manager";
const CONTRACT_ID = "@sieve.mozdev.org/transport-service;1";

/**
 *  JavaScript Objects are usually create within the scope of a window. This 
 *  means it can't be shared between multiple windows. "The cleanest and most
 *  powerful way to share date" is according to MDC a XPCOM component.
 *  <p>
 *  This component is a simple wrapper to create an window independent sieve 
 *  object. The Sieve objects basically live within this XPCOM component. 
 **/


function SieveConnectionManager() 
{ 
  // you can cheat and use this
  // while testing without
  // writing your own interface
  this.wrappedJSObject = this;
  
  this.session = new Array();
  this.id = 0;
}

SieveConnectionManager.prototype =
{
  // returns a handle to the open session
  openSession : function ()
  {   
    
    this.id ++;
    this.session[this.id] 
      = Components.classes["@sieve.mozdev.org/transport;1"].createInstance().wrappedJSObject;  
  
    return this.id;
  },

  // closes the session ...
  closeSession : function (id)
  {
    // free resources if needed...
    if (this.session[id] == null)
      return;
      
    this.session[id].disconnect();
  
    this.session[id] = null;  
  },

  getSession : function (id)
  {
    return this.session[id];
  },

  QueryInterface : function(aIID)
  {
    // add any other interfaces you support here
    if (!aIID.equals(nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
}

// Factory
var SieveConnectionManagerFactory = {
  singleton: null,
  createInstance: function (aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
      
    if (this.singleton == null)
      this.singleton = new SieveConnectionManager();
      
    return this.singleton.QueryInterface(aIID);
  }
};

// Module
var SieveConnectionManagerModule = {
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
  },

  unregisterSelf: function(aCompMgr, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);        
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(CLASS_ID))
      return SieveConnectionManagerFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};

//module initialization
function NSGetModule(aCompMgr, aFileSpec) { return SieveConnectionManagerModule; }
