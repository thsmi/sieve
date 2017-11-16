/*
 * The contents of this file are licenced. You may obtain a copy of 
 * the license at https://github.com/thsmi/sieve/ or request it via 
 * email from the author.
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *      
 */
 
/* global window */
 
"use strict";
 
(function(exports) {
  
  /* global SieveLexer */
  /* global SieveAbstractElement */

  function SieveUserPart(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);  
  }
  
  SieveUserPart.prototype = Object.create(SieveAbstractElement.prototype);
  SieveUserPart.prototype.constructor = SieveUserPart;
  
  SieveUserPart.nodeName = function () {
    return "address-part/user";
  };
  
  SieveUserPart.nodeType  = function () {
    return "address-part/";
  };
  
  SieveUserPart.isCapable = function (capabilities) {
    return (capabilities["subaddress"] === true);      
  };
  
  SieveUserPart.prototype.require
      = function (imports)
  {
    imports["subaddress"] = true;
  };
  
  SieveUserPart.isElement
      = function (parser, lexer)
  {    
    if (parser.startsWith(":user"))
      return true;
    
    return false;
  };
  
  SieveUserPart.prototype.init
      = function (parser)
  {  
    parser.extract(":user");    
    return this;
  };
  
  SieveUserPart.prototype.toScript
      = function ()
  {    
    return ":user";
  };  

  //*************************************************************************//

  function SieveDetailPart(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);  
  }
  
  SieveDetailPart.prototype = Object.create(SieveAbstractElement.prototype);
  SieveDetailPart.prototype.constructor = SieveDetailPart;
  
  SieveDetailPart.nodeName = function () {
    return "address-part/detail";
  };
  
  SieveDetailPart.nodeType  = function () {
    return "address-part/";
  };

  SieveDetailPart.isCapable = function (capabilities) {
    return (capabilities["subaddress"] === true);      
  };
  
  SieveDetailPart.prototype.require
      = function (imports)
  {
    imports["subaddress"] = true;
  };
  
  SieveDetailPart.isElement
      = function (parser, lexer)
  {    
    if (parser.startsWith(":detail"))
      return true;
    
    return false;
  };
  
  SieveDetailPart.prototype.init
      = function (parser)
  {  
    parser.extract(":detail");    
    return this;
  };
  
  SieveDetailPart.prototype.toScript
      = function ()
  {    
    return ":detail";
  };  

  
  if (!SieveLexer)
    throw "Could not register Subaddress";
  
  SieveLexer.register(SieveUserPart);
  SieveLexer.register(SieveDetailPart);
  
})(window);   


//   :user "+" :detail "@" :domain
// \----:local-part----/
