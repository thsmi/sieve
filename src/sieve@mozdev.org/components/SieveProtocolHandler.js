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

// Enable Strict Mode
"use strict";

if (typeof(Cc) == 'undefined')
  { var Cc = Components.classes; }

if (typeof(Ci) == 'undefined')
  { var Ci = Components.interfaces; }  

if (typeof(Cr) == 'undefined')
  { var Cr = Components.results; }

/**
 * Implements an Protocol handler component for sieve. This is needed inorder
 * to obtain proxy information. As it has basically a stub, without any function,
 * it uses "x-sieve" as scheme instead of "sieve". 
 */
function SieveProtocolHandler() {};

SieveProtocolHandler.prototype = 
{
  scheme : "x-sieve",    
  defaultPort : 4190,
  
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


// entrypoint 
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
const NSGetFactory = XPCOMUtils.generateNSGetFactory([SieveProtocolHandler])
