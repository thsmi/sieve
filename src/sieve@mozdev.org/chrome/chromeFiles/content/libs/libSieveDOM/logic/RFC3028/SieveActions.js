/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";

/******************************************************************************/

function SieveDiscard(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id); 
  this.semicolon = this._createByName("atom/semicolon");
}

SieveDiscard.prototype.__proto__ = SieveAbstractElement.prototype;

SieveDiscard.isElement
     = function (token)
{
  return (token.substring(0,7).toLowerCase().indexOf("discard") == 0);  
}

SieveDiscard.prototype.init
    = function (data)
{
  // Syntax :
  // <"discard"> <";">
  
  data = data.slice("discard".length);  
  data = this.semicolon.init(data);
    
  return data;  
}

SieveDiscard.prototype.toScript
    = function ()
{
  return "discard"
    + this.semicolon.toScript();  
}

SieveDiscard.prototype.toWidget
    = function ()
{
  return (new SieveDiscardUI(this)).getWidget();  
}

//***************************************

function SieveRedirect(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  
  this.whiteSpace = this._createByName("whitespace"," ");
  
  this.address = this._createByName("string","\"username@example.com\""); 
  
  this.semicolon = this._createByName("atom/semicolon");
}

SieveRedirect.prototype.__proto__ = SieveAbstractElement.prototype;

SieveRedirect.isElement
    = function (token)
{
  return (token.substring(0,8).toLowerCase().indexOf("redirect") == 0);
}

SieveRedirect.prototype.init
    = function (data)
{
  // Syntax :
  // <"redirect"> <address: string> <";">
  
  // remove the "redirect" identifier ...
  data = data.slice("redirect".length);
  
  // ... eat the deadcode before the stringlist...
  data = this.whiteSpace.init(data);
  
  // ... extract the redirect address...
  data = this.address.init(data);
  
  // ... drop the semicolon
  data = this.semicolon.init(data);
    
  return data;        
}

SieveRedirect.prototype.setAddress
   = function (address)
{
  this.address.setValue(address);  
}

SieveRedirect.prototype.getAddress
   = function()
{
  return this.address.getValue();    
}

SieveRedirect.prototype.toScript
    = function ()
{
  return "redirect"
    + this.whiteSpace.toScript()
    + this.address.toScript()
    + this.semicolon.toScript();
}

SieveRedirect.prototype.toWidget
    = function ()
{  
  return (new SieveRedirectUI(this)).getWidget();
}
 
/******************************************************************************/

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
  return (new SieveRejectUI(this)).getWidget();  
}


/******************************************************************************/

function SieveStop(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  this.semicolon = this._createByName("atom/semicolon");
}

SieveStop.prototype.__proto__ = SieveAbstractElement.prototype;

SieveStop.isElement
    = function(token)
{
  return (token.substring(0,4).toLowerCase().indexOf("stop") == 0);
}

SieveStop.prototype.init
    = function (data)
{
  data = data.slice("stop".length);
  
  data = this.semicolon.init(data);
    
  return data; 
}    

SieveStop.prototype.toScript
    = function ()
{
  return "stop"
    + this.semicolon.toScript();
}

SieveStop.prototype.toWidget
    = function ()
{
  return (new SieveStopUI(this)).getWidget();
}

/******************************************************************************/

function SieveKeep(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  this.semicolon = this._createByName("atom/semicolon");
}

SieveKeep.prototype.__proto__ = SieveAbstractElement.prototype;

SieveKeep.isElement
    = function(token)
{
  return (token.substring(0,4).toLowerCase().indexOf("keep") == 0);
}

SieveKeep.prototype.init
    = function (data)
{
  data = data.slice("keep".length);
  
  data = this.semicolon.init(data);
    
  return data;
}    

SieveKeep.prototype.toScript
    = function ()
{
  return "keep"
    + this.semicolon.toScript();
}

SieveKeep.prototype.toWidget
    = function ()
{
  return (new SieveKeepUI(this)).getWidget();
}


/******************************************************************************/

function SieveFileInto(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);

  this.whiteSpace = this._createByName("whitespace", " ");
  
  this.semicolon = this._createByName("atom/semicolon");
      
  this.string = this._createByName("string");
  this.string.init("\"INBOX\"");
}

SieveFileInto.prototype.__proto__ = SieveAbstractElement.prototype;

SieveFileInto.isElement
    = function (token)
{
  return (token.substring(0,8).toLowerCase().indexOf("fileinto") == 0);
}

SieveFileInto.prototype.init
    = function (data)
{
  // Syntax :
  // <"fileinto"> <string> <";">
  
  data = data.slice("fileinto".length);
  
  // ... eat the deadcode before the string...
  data = this.whiteSpace.init(data);
  
  // read the string
  data = this.string.init(data);
  
  // ... and finally remove the semicolon;
  data = this.semicolon.init(data);
      
  return data;
}

SieveFileInto.prototype.require
    = function (requires)
{
  requires["fileinto"] = true;
}

SieveFileInto.prototype.setPath
    = function (path)
{
  this.string.setValue(path)
}

SieveFileInto.prototype.getPath
    = function ()
{
  return this.string.getValue();
}

SieveFileInto.prototype.toScript
    = function ()
{
  return "fileinto"  
    + this.whiteSpace.toScript()
    + this.string.toScript()
    + this.semicolon.toScript();
}

SieveFileInto.prototype.toWidget
    = function ()
{
  return (new SieveFileIntoUI(this)).getWidget();
}

/******************************************************************************/

if (!SieveLexer)
  throw "Could not register Actions";

SieveLexer.register("action","action/discard", SieveDiscard);
SieveLexer.register("action","action/keep", SieveKeep);
SieveLexer.register("action","action/stop", SieveStop);

SieveLexer.register("action","action/fileinto", SieveFileInto);
SieveLexer.register("action","action/redirect",SieveRedirect);
SieveLexer.register("action","action/reject", SieveReject);
      
   
