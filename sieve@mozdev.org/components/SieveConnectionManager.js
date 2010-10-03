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

Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader) 
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveSession.js"); 
    
// The connection manager is a service therefore we need to ensure it's... 
// ... a singleton, so we implement our own nsIFactory

const SieveConnectionManagerFactory = {
  _singleton: null,
  createInstance: function (aOuter, aIID)
  {
    if (aOuter != null)
      throw Cr.NS_ERROR_NO_AGGREGATION;
      
    if (this._singleton == null)
      this._singleton = new SieveConnectionManager();
      
    return this._singleton.QueryInterface(aIID);
  }
};
 
/**
 *  JavaScript Objects are usually create within the scope of a window. This 
 *  means it can't be shared between multiple windows. "The cleanest and most
 *  powerful way to share data" is according to MDC a XPCOM component.
 *  <p>
 *  This component is a simple wrapper to create a window independent sieve 
 *  object. The Sieve objects basically live within this XPCOM component.
 *  <p>
 *  Connections are pooled, as most sieve servers do not allow concurrent 
 *  connections. Every sieve account can have exactly one active session. A 
 *  session consits of indefinte channels. As channel are associated to a 
 *  single consumer/window, a session can be shared between multiple consumers 
 *  or windows.     
 **/

function SieveConnectionManager() 
{ 
  // with this hack we can access this component from javascript...
  // ...without writing your own interface
  this.wrappedJSObject = this;
  
  this.sessions = new Array();  
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
  createSession : function (account)
  {    
    // The session id should be something unique. As Mozilla garantees, that...
    // ...the account key is unique. So let's use it.
    var sid = account.getKey();

    if (!this.sessions[sid])
      this.sessions[sid] = new SieveSession(account,sid);
        
    return sid;    
  },

  /**
   * Creates a new channel for a given session. A channel needs to be closed
   * afer creating it, otherwise the channel might get blocked 
   * 
   * @param {} sid
   * @return {}
   */
  createChannel : function(sid)
  {
    if (!this.sessions[sid])
      throw "createChannel: Invalid Session ("+sid+")";
                            
    return this.sessions[sid].addChannel();
  },  
  
  openChannel : function (sid,cid,hostname)
  {
    if (!this.sessions[sid])
      throw "Invalid Session Identifier";
   
    if (!this.sessions[sid].hasChannel(cid))
      throw "Invalid Channel";
    
    this.sessions[sid].connect(hostname);    
  },
  
  addSessionListener : function (sid,listener)
  {
    if (!this.sessions[sid])
      throw "addSessionListener: Invalid Session ("+sid+")";
      
    this.sessions[sid].listener = listener;
  },
  
  removeSessionListener : function (sid)
  {
    if (this.sessions[sid])
      delete this.sessions[sid].listener;
  },
  
  /**
   * Closes and frees a Manage Sieve Session 
   * @param {int} id
   *   handle identifing the session that should be terminated
   */
  /*closeSession : function (id)
  {
    // free resources if needed...
    if (this.sessions[id] == null)
      return;  
    
    this.sessions[id].sieve.disconnect();
    
    // Inform all channels, that the Session is gone.
    
    for (var i=0; i<this.sessions[id].channels.length; i++)
      if (this.session[id].channels[i] && this.session[id].channels[i].onChannelClosed)
        this.session[id].channels[i].onChannelClosed();
        
    this.sessions[id] = null;
  },*/
  

  
  closeChannel : function(sid, cid)
  {
    if (!this.sessions[sid])
      return;
      //throw "closeChannel: Invalid Session ("+sid+")";
          
    if (this.sessions[sid].removeChannel(cid))
      if ((this.sessions[sid].listener) && (this.sessions[sid].listener.onChannelClosed))
        this.sessions[sid].listener.onChannelClosed(cid);    
    

    // In case the seesion has no active channels...
    if (this.sessions[sid].hasChannels())
      return;
    
    this.sessions[sid].listener = null;
    // ... it's ok to close the session
    this.sessions[sid].disconnect();
   
    delete this.sessions[sid];
  },
  
 /* countChannels : function(sid)
  {
    if (!this.session[sid])
      return 0;
      
    return this.session[sid].channels.length;
  },*/
  /**
   * Retuns the Sieve Object associated to this session.
   * @param {} sid
   *   The identifier identifing the session instance
   * @param {} cid
   *   An Identifier the channel
   * @return {}
   */
  getChannel : function(sid,cid)
  {    
    if (!this.sessions[sid])
      throw "getChannel: Invalid Session ("+sid+")";
                  
    if (!this.sessions[sid].hasChannel(cid)) 
      throw "getChannel: Invalid Channel ("+cid+")";
   
    if (!(this.sessions[sid].sieve) || !(this.sessions[sid].sieve.isAlive()) )
      throw "getChannel: Session closed ("+sid+" / "+cid+")";
    
    return this.sessions[sid].sieve;
  },

  QueryInterface : function(aIID)
  {
    // add any other interfaces you support here
    if (!aIID.equals(Ci.nsISupports))
      throw Cr.NS_ERROR_NO_INTERFACE;
    return this;
  },

  _xpcom_factory: SieveConnectionManagerFactory
};


// Module
/**
 * @deprecated since Gecko 2.0  
 */
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

if ((typeof(XPCOMUtils) != "undefined") && (typeof(XPCOMUtils.generateNSGetFactory) != "undefined"))
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([SieveConnectionManager])
else
  var NSGetModule = function(compMgr, fileSpec) { return SieveConnectionManagerModule; }

