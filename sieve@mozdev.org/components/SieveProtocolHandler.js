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

const SIEVE_SCHEME = "x-sieve";
const SIEVE_PORT = 2000;


const SIEVE_CONTRACT_ID =
    "@mozilla.org/network/protocol;1?name="+SIEVE_SCHEME;
const SIEVE_CLASS_NAME =
    SIEVE_SCHEME+" protocol handler"
const SIEVE_CLASS_ID =
    Components.ID("{65f30660-14eb-11df-8351-0002a5d5c51b}");


// class constructor
/**
 * Implements an Protocol handler component for sieve. This is needed inorder
 * to obtain proxy information. As it has basically a stub, without any function,
 * it uses "x-sieve" as scheme instead of "sieve". 
 */
function SieveProtocolHandler() {};

SieveProtocolHandler.prototype = 
{   
  protocolFlags :
    Ci.nsIProtocolHandler.URI_NORELATIVE |
    Ci.nsIProtocolHandler.URI_NOAUTH |
    Ci.nsIProtocolHandler.ALLOWS_PROXY |
    (("URI_DANGEROUS_TO_LOAD" in Ci.nsIProtocolHandler) ? Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE : 0) |
    (("URI_NON_PERSISTABLE" in Ci.nsIProtocolHandler) ? Ci.nsIProtocolHandler.URI_NON_PERSISTABLE : 0) |
    (("URI_DOES_NOT_RETURN_DATA" in Ci.nsIProtocolHandler) ? Ci.nsIProtocolHandler.URI_DOES_NOT_RETURN_DATA : 0),
    
  defaultPort : SIEVE_PORT,
  scheme : SIEVE_SCHEME,  
  
  allowPort : function(port, scheme)
  {
    if (scheme==SIEVE_SCHEME)
      return true;
    else
      return false;    
  },
  
  newURI : function (spec, charset, baseURI)
  {
    var url = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIStandardURL);
  
    // Normalize URL to an standard URL
    url.init(Ci.nsIStandardURL.URLTYPE_AUTHORITY/*URLTYPE_STANDARD*/, SIEVE_PORT, spec, charset, baseURI);

    return url.QueryInterface(Ci.nsIURI);
  },

  newChannel : function (URI)
  {
    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;    
  }
}

// Factory
var SieveProtocolHandlerFactory = 
{
  createInstance : function(aOuter, aIID)
  {
    if (aOuter != null)
        throw Components.results.NS_ERROR_NO_AGGREGATION;

    if (!aIID.equals(Ci.nsIProtocolHandler) && !aIID.equals(Ci.nsISupports))
        throw Components.results.NS_ERROR_INVALID_ARG;

    return new SieveProtocolHandler();
  }
}

// Module
var SieveProtocolHandlerModule = 
{
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(SIEVE_CLASS_ID, SIEVE_CLASS_NAME,
        SIEVE_CONTRACT_ID, aFileSpec, aLocation, aType);   
  },

  unregisterSelf: function(aCompMgr, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(SIEVE_CLASS_ID, aLocation);
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {    
    if (aCID.equals(SIEVE_CLASS_ID))
      return SieveProtocolHandlerFactory;      
        
    if (!aIID.equals(Ci.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
  
  canUnload: function(aCompMgr)
  { 
    return true;
  }
}

/* entrypoint */
function NSGetModule(compMgr, fileSpec)
{
  return SieveProtocolHandlerModule;
}

function NSGetFactory(aCid)
{
  if (aCID.equals(SIEVE_CLASS_ID))
    return SieveProtocolHandlerFactory;   
}