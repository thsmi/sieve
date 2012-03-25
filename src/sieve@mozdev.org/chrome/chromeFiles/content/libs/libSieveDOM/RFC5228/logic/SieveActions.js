/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";

function SieveDiscard(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id); 
  this.semicolon = this._createByName("atom/semicolon");
}

SieveDiscard.prototype.__proto__ = SieveAbstractElement.prototype;

SieveDiscard.isElement
     = function (parser)
{
  return parser.startsWith("discard");  
}

SieveDiscard.prototype.init
    = function (parser)
{
  // Syntax :
  // <"discard"> <";">
  parser.extract("discard");  
  this.semicolon.init(parser);
    
  return this;  
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
  return (new SieveDiscardUI(this));  
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
    = function (parser)
{
  return parser.startsWith("redirect");
}

SieveRedirect.prototype.init
    = function (parser)
{
  // Syntax :
  // <"redirect"> <address: string> <";">
  
  // remove the "redirect" identifier ...
  parser.extract("redirect");
  
  // ... eat the deadcode before the stringlist...
  this.whiteSpace.init(parser);
  
  // ... extract the redirect address...
  this.address.init(parser);
  
  // ... drop the semicolon
  this.semicolon.init(parser);
    
  return this;        
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
  return (new SieveRedirectUI(this));
}
 


/******************************************************************************/

function SieveStop(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  this.semicolon = this._createByName("atom/semicolon");
}

SieveStop.prototype.__proto__ = SieveAbstractElement.prototype;

SieveStop.isElement
    = function(parser)
{
  return parser.startsWith("stop");
}

SieveStop.prototype.init
    = function (parser)
{
  parser.extract("stop");
  
  this.semicolon.init(parser);
    
  return this; 
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
  return (new SieveStopUI(this));
}

/******************************************************************************/

function SieveKeep(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  this.semicolon = this._createByName("atom/semicolon");
}

SieveKeep.prototype.__proto__ = SieveAbstractElement.prototype;

SieveKeep.isElement
    = function(parser)
{
  return parser.startsWith("keep");
}

SieveKeep.prototype.init
    = function (parser)
{
  parser.extract("keep");
  
  this.semicolon.init(parser);
    
  return parser;
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
  return (new SieveKeepUI(this));
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
    = function (parser)
{
  return parser.startsWith("fileinto");
}

SieveFileInto.isCapable
    = function (capabilities)
{
  return (capabilities["fileinto"] == true);      
}

SieveFileInto.prototype.init
    = function (parser)
{
  // Syntax :
  // <"fileinto"> <string> <";">
  
  parser.extract("fileinto");
  
  // ... eat the deadcode before the string...
  this.whiteSpace.init(parser);
  
  // read the string
  this.string.init(parser);
  
  // ... and finally remove the semicolon;
  this.semicolon.init(parser);
      
  return this;
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
  return (new SieveFileIntoUI(this));
}

/******************************************************************************/

if (!SieveLexer)
  throw "Could not register Actions";

SieveLexer.register("action","action/discard", SieveDiscard);
SieveLexer.register("action","action/keep", SieveKeep);
SieveLexer.register("action","action/stop", SieveStop);

SieveLexer.register("action","action/fileinto", SieveFileInto);
SieveLexer.register("action","action/redirect",SieveRedirect);
      
   
