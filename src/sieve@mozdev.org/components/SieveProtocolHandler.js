/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 * 
 *  Inspired by ChatZilla code...
 */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

/**
 * Implements an Protocol handler component for sieve. This is needed inorder
 * to obtain proxy information. As it has basically a stub, without any function,
 * it uses "x-sieve" as scheme instead of "sieve". 
 */
function SieveProtocolHandler() {};

SieveProtocolHandler.prototype = 
{
  scheme : "x-sieve",    
  defaultPort : 2000,
  
  classID : Components.ID("{65f30660-14eb-11df-8351-0002a5d5c51b}"),
  contactID : "@mozilla.org/network/protocol;1?name="+SieveProtocolHandler.prototype.scheme,
  classDescription: SieveProtocolHandler.prototype.scheme+" protocol handler",  
  
  protocolFlags :
    Ci.nsIProtocolHandler.URI_NORELATIVE |
    Ci.nsIProtocolHandler.URI_NOAUTH |
    Ci.nsIProtocolHandler.ALLOWS_PROXY |
    (("URI_DANGEROUS_TO_LOAD" in Ci.nsIProtocolHandler) ? Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE : 0) |
    (("URI_NON_PERSISTABLE" in Ci.nsIProtocolHandler) ? Ci.nsIProtocolHandler.URI_NON_PERSISTABLE : 0) |
    (("URI_DOES_NOT_RETURN_DATA" in Ci.nsIProtocolHandler) ? Ci.nsIProtocolHandler.URI_DOES_NOT_RETURN_DATA : 0),
  
  allowPort : function(port, scheme)
  {
    if (scheme==this.scheme)
      return true;
    else
      return false;    
  },
  
  newURI : function (spec, charset, baseURI)
  {
    var url = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIStandardURL);
  
    // Normalize URL to an standard URL
    url.init(Ci.nsIStandardURL.URLTYPE_AUTHORITY/*URLTYPE_STANDARD*/, this.defaultPort, spec, charset, baseURI);

    return url.QueryInterface(Ci.nsIURI);
  },

  newChannel : function (URI)
  {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;    
  },
  
  QueryInterface : function(aIID)
  {
    if (aIID.equals(Ci.nsISupports))
      return this;
      
    // nsIProtocolHandler defines newURI(), newChannel(), allowPort, ...
    // ... protocolFlags, defaultPort and scheme    
    if (aIID.equals(Ci.nsIProtocolHandler))
      return this;
    
    throw Cr.NS_ERROR_NO_INTERFACE;
  }    
}

// Factory
/**
 * @deprecated since Gecko 2.0  
 */
var SieveProtocolHandlerFactory = 
{
  createInstance : function(aOuter, aIID)
  {
    if (aOuter != null)
        throw Cr.NS_ERROR_NO_AGGREGATION;

    if (!aIID.equals(Ci.nsIProtocolHandler) && !aIID.equals(Ci.nsISupports))
        throw Cr.NS_ERROR_INVALID_ARG;

    return new SieveProtocolHandler();
  }
}

// Module
/**
 * @deprecated since Gecko 2.0  
 */
var SieveProtocolHandlerModule = 
{
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(
        SieveProtocolHandler.prototype.classID, 
        SieveProtocolHandler.prototype.classDescription,
        SieveProtocolHandler.prototype.contactID, 
        aFileSpec, aLocation, aType);   
  },

  unregisterSelf: function(aCompMgr, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(SieveProtocolHandler.prototype.classID, aLocation);
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {    
    if (aCID.equals(SieveProtocolHandler.prototype.classID))
      return SieveProtocolHandlerFactory;      
        
    if (!aIID.equals(Ci.nsIFactory))
      throw Cr.NS_ERROR_NOT_IMPLEMENTED;

    throw Cr.NS_ERROR_NO_INTERFACE;
  },
  
  canUnload: function(aCompMgr)
  { 
    return true;
  }
}

/* entrypoint */
try
{
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
}
catch (e) { }

// Gecko 2.x uses NSGetFactory to register XPCOM Components...
// ... while Gecko 1.x uses NSGetModule

if ((typeof(XPCOMUtils) != "undefined") && (typeof(XPCOMUtils.generateNSGetFactory) != "undefined"))
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([SieveProtocolHandler])
else
  var NSGetModule = function(compMgr, fileSpec) { return SieveProtocolHandlerModule; }
