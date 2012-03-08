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

SieveReject.prototype.__proto__ = SieveAbstractElement.prototype;

SieveReject.isElement
    = function (token)
{
  return (token.substring(0,6).toLowerCase().indexOf("reject") == 0);
}


SieveReject.prototype.init
    = function (data)
{ 
  // Syntax :
  // <"reject"> <reason: string> <";">
  
  // remove the "redirect" identifier ...
  data = data.slice("reject".length);
  
  // ... eat the deadcode before the stringlist...
  data = this.whiteSpace.init(data);
  
  // ... extract the reject reason...
  data = this.reason.init(data);
    
  // ... drop the semicolon
  data = this.semicolon.init(data);
  
  return data;
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

SieveReject.prototype.toWidget
    = function ()
{
  return (new SieveRejectUI(this));  
}

if (!SieveLexer)
  throw "Could not register Actions";
  
SieveLexer.register("action","action/reject", SieveReject);
