/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
"use strict";
 
// TODO Implement Extended Reject
  
function SieveReject(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  
  this.reason = this._createByName("string", "text:\r\n.\r\n");  
  
  this.whiteSpace = this._createByName("whitespace"," ");
  
  this.semicolon = this._createByName("atom/semicolon");    
}

SieveReject.prototype = Object.create(SieveAbstractElement.prototype);
SieveReject.prototype.constructor = SieveReject;

SieveReject.isElement
    = function (parser)
{
  return parser.startsWith("reject");
}

SieveReject.isCapable
    = function (capabilities)
{
  return (capabilities["reject"] == true);      
}

SieveReject.nodeName = function () {
  return "action/reject";
}

SieveReject.nodeType  = function () {
  return "action";
}

SieveReject.prototype.init
    = function (parser)
{ 
  // Syntax :
  // <"reject"> <reason: string> <";">
  
  // remove the "redirect" identifier ...
  parser.extract("reject");
  
  // ... eat the deadcode before the stringlist...
  this.whiteSpace.init(parser);
  
  // ... extract the reject reason...
  this.reason.init(parser);
    
  // ... drop the semicolon
  this.semicolon.init(parser);
  
  return this;
}

SieveReject.prototype.getReason
    = function ()
{
  return this.reason.getValue();      
}

SieveReject.prototype.setReason
    = function (reason)
{
  return this.reason.setValue(reason);      
}

SieveReject.prototype.require
    = function (requires)
{
  requires["reject"] = true;
}

SieveReject.prototype.toScript
    = function ()
{ 
  return "reject"
    + this.whiteSpace.toScript()
    + this.reason.toScript()
    + this.semicolon.toScript();
}


if (!SieveLexer)
  throw "Could not register Actions";
  
SieveLexer.register(SieveReject);
