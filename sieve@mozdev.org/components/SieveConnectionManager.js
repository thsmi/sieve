/* 
 * The content of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

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
  // with this hack we can access this component from javascript...
  // ...without writing your own interface
  this.wrappedJSObject = this;
  
  this.session = new Array();
  this.id = 0;
}

SieveConnectionManager.prototype =
{
  classID : Components.ID("7ec95cc0-14eb-11df-b46e-0002a5d5c51b"),
  contactID : "@sieve.mozdev.org/transport-service;1",
  classDescription: "Sieve Connection Manager",
  
  /**
   * Creates and opens a new Manage Sieve Session
   * @return {int} a handle to the open session 
   */
  openSession : function ()
  {   
    
    this.id ++;
    this.session[this.id] = Cc["@sieve.mozdev.org/transport;1"]
                                .createInstance().wrappedJSObject;  
  
    return this.id;
  },

  /**
   * Closes and frees a Manage Sieve Session 
   * @param {int} id
   *   handle identifing the session that should be terminated
   */
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
    if (!aIID.equals(Ci.nsISupports))
      throw Cr.NS_ERROR_NO_INTERFACE;
    return this;
  }
}

// Factory
var SieveConnectionManagerFactory = {
  singleton: null,
  createInstance: function (aOuter, aIID)
  {
    if (aOuter != null)
      throw Cr.NS_ERROR_NO_AGGREGATION;
      
    if (this.singleton == null)
      this.singleton = new SieveConnectionManager();
      
    return this.singleton.QueryInterface(aIID);
  }
};

// Module
var SieveConnectionManagerModule = {
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(
        SieveConnectionManager.prototype.classID,
        SieveConnectionManager.prototype.classDescription,
        SieveConnectionManager.prototype.contactID, 
        aFileSpec, aLocation, aType);
  },

  unregisterSelf: function(aCompMgr, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(
        SieveConnectionManager.prototype.classID, aLocation);        
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (!aIID.equals(Ci.nsIFactory))
      throw Cr.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(SieveConnectionManager.prototype.classID))
      return SieveConnectionManagerFactory;

    throw Cr.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};


try
{
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
}
catch (e) { }

// Gecko 2.x uses NSGetFactory to register XPCOM Components...
// ... while Gecko 1.x uses NSGetModule

if ((XPCOMUtils) && (XPCOMUtils.generateNSGetFactory))
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([SieveConnectionManager])
else
  var NSGetModule = function(compMgr, fileSpec) { return SieveConnectionManagerModule; }

