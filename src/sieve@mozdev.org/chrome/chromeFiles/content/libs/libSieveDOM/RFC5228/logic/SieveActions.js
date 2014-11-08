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

SieveDiscard.prototype = Object.create(SieveAbstractElement.prototype);
SieveDiscard.prototype.constructor = SieveDiscard;

SieveDiscard.isElement = function (parser) {
  return parser.startsWith("discard");  
}

SieveDiscard.nodeName = function () {
  return "action/discard";
}

SieveDiscard.nodeType  = function () {
  return "action";
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

//***************************************

function SieveRedirect(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  
  this.whiteSpace = this._createByName("whitespace"," ");
  this.address = this._createByName("string","\"username@example.com\""); 
  this.semicolon = this._createByName("atom/semicolon");  
}

SieveRedirect.prototype = Object.create(SieveAbstractElement.prototype);
SieveRedirect.prototype.constructor = SieveRedirect;

SieveRedirect.isElement
    = function (parser)
{
  return parser.startsWith("redirect");
}

SieveRedirect.nodeName
    = function ()
{
  return "action/redirect";
}

SieveRedirect.nodeType
    = function ()
{
  return "action";
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

/******************************************************************************/

function SieveStop(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  
  this.semicolon = this._createByName("atom/semicolon");	
}

SieveStop.prototype = Object.create(SieveAbstractElement.prototype);
SieveStop.prototype.constructor = SieveStop;

SieveStop.isElement = function(parser) {
  return parser.startsWith("stop"); 
}

SieveStop.nodeName = function () {
  return "action/stop";     
}

SieveStop.nodeType = function () {
  return "action";
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


/******************************************************************************/

function SieveKeep(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  
  this.semicolon = this._createByName("atom/semicolon");
}

SieveKeep.prototype = Object.create(SieveAbstractElement.prototype);
SieveKeep.prototype.constructor = SieveKeep;

SieveKeep.isElement = function(parser) {
  return parser.startsWith("keep");
}

SieveKeep.nodeName = function () {
  return "action/keep";
}

SieveKeep.nodeType  = function () {
  return "action";
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


/******************************************************************************/

function SieveFileInto(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);

  this.whiteSpace = this._createByName("whitespace", " ");
  
  this.semicolon = this._createByName("atom/semicolon");
      
  this.string = this._createByName("string");
  this.string.init("\"INBOX\"");
}

SieveFileInto.prototype = Object.create(SieveAbstractElement.prototype);
SieveFileInto.prototype.constructor = SieveFileInto;

// Static methods needed for registration
SieveFileInto.isElement = function (parser) {
  return parser.startsWith("fileinto");
}

SieveFileInto.isCapable = function (capabilities) {
  return (capabilities["fileinto"] == true);      
}

SieveFileInto.nodeName = function () {
  return "action/fileinto";
}

SieveFileInto.nodeType  = function () {
  return "action";
}


// Dynamic methods...
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


/******************************************************************************/

if (!SieveLexer)
  throw "Could not register Actions";

SieveLexer.register(SieveDiscard);
SieveLexer.register(SieveKeep);
SieveLexer.register(SieveStop);
SieveLexer.register(SieveFileInto);
SieveLexer.register(SieveRedirect);
      
   
