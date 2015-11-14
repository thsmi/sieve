/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
"use strict";
 
 
/// Flags an keywords are defined in http://tools.ietf.org/html/rfc5788
 
// setflag <variablename: string> <list-of-flags: string-list>


function SieveSetFlag(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id); 
  
  this.whiteSpace = this._createByName("whitespace"," ");
  this.flaglist = this._createByName("stringlist");
  this.semicolon = this._createByName("atom/semicolon");
}

SieveSetFlag.prototype = Object.create(SieveAbstractElement.prototype);
SieveSetFlag.prototype.constructor = SieveSetFlag;

SieveSetFlag.isElement
    = function (parser, lexer)
{
  return parser.startsWith("setflag");
}
    
SieveSetFlag.isCapable
    = function (capabilities)
{
  return (capabilities["imap4flags"] == true);      
}

SieveSetFlag.nodeName = function () {
  return "action/setflag";
}

SieveSetFlag.nodeType  = function () {
  return "action";
}

SieveSetFlag.prototype.init
    = function (parser)
{  
  parser.extract("setflag");
  
  // ... eat the deadcode before the string...
  this.whiteSpace.init(parser);
      
  this.flaglist.init(parser)

  this.semicolon.init(parser);
    
  return this;
}

SieveSetFlag.prototype.require
    = function (requires)
{
  requires["imap4flags"] = true;
}

SieveSetFlag.prototype.toScript
    = function ()
{
  return "setflag"
    + this.whiteSpace.toScript()
    + this.flaglist.toScript()
    + this.semicolon.toScript();
}



/******************************************************************************/

//addflag <variablename: string> <list-of-flags: string-list>

function SieveAddFlag(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id); 
  
  this.whiteSpace = [];
  this.whiteSpace[0] = this._createByName("whitespace"," ");
  this.whiteSpace[1] = this._createByName("whitespace");  
                
  this.flaglist =  this._createByName("stringlist");
  
  this.semicolon = this._createByName("atom/semicolon");
}

SieveAddFlag.prototype = Object.create(SieveAbstractElement.prototype);
SieveAddFlag.prototype.constructor = SieveAddFlag;

SieveAddFlag.isElement
    = function (parser, lexer)
{
  return parser.startsWith("addflag");
}

SieveAddFlag.isCapable
    = function (capabilities)
{
  return (capabilities["imap4flags"] == true);      
}

SieveAddFlag.nodeName = function () {
  return "action/addflag";
}

SieveAddFlag.nodeType  = function () {
  return "action";
}


SieveAddFlag.prototype.init
    = function (parser)
{
  // Syntax :
  // <"fileinto"> <string> <";">
  
  parser.extract("addflag");
  
  // ... eat the deadcode before the string...
  this.whiteSpace[0].init(parser);
  
  this.flaglist.init(parser)

  this.whiteSpace[1].init(parser);
    
  this.semicolon.init(parser);
    
  return this;
}

SieveAddFlag.prototype.require
    = function (requires)
{
  requires["imap4flags"] = true;
}

SieveAddFlag.prototype.toScript
    = function ()
{
  return "addflag"
    + this.whiteSpace[0].toScript()
    + this.flaglist.toScript()
    + this.whiteSpace[1].toScript()        
    + this.semicolon.toScript();
}

/******************************************************************************/

//removeflag <variablename: string> <list-of-flags: string-list>



function SieveRemoveFlag(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id); 
  
  this.whiteSpace = [];
  this.whiteSpace[0] = this._createByName("whitespace", " ");
  this.whiteSpace[1] = this._createByName("whitespace");  
                
  this.flaglist =  this._createByName("stringlist");
  
  this.semicolon = this._createByName("atom/semicolon");
}

SieveRemoveFlag.prototype = Object.create(SieveAbstractElement.prototype);
SieveRemoveFlag.prototype.constructor = SieveRemoveFlag;

SieveRemoveFlag.isElement
  = function(parser, lexer)
{ 
  return parser.startsWith("removeflag");
}

SieveRemoveFlag.isCapable
    = function (capabilities)
{
  return (capabilities["imap4flags"] == true);      
}

SieveRemoveFlag.nodeName = function () {
  return "action/removeflag";
}

SieveRemoveFlag.nodeType  = function () {
  return "action";
}

SieveRemoveFlag.prototype.init
    = function (parser)
{
  // Syntax :
  // <"fileinto"> <string> <";">
  
  parser.extract("removeflag");
  
  // ... eat the deadcode before the string...
  this.whiteSpace[0].init(parser);
      
  this.flaglist.init(parser)

  this.whiteSpace[1].init(parser);
    
  // ... and finally remove the semicolon;
  this.semicolon.init(parser);
    
  return this;
}

SieveRemoveFlag.prototype.require
    = function (requires)
{
  requires["imap4flags"] = true;
}

SieveRemoveFlag.prototype.toScript
    = function ()
{
  return "removeflag"
    + this.whiteSpace[0].toScript()
    + this.flaglist.toScript()
    + this.whiteSpace[1].toScript()        
    + this.semicolon.toScript();
}


/******************************************************************************/

//hasflag [MATCH-TYPE] <variable-list: string-list> <list-of-flags: string-list>

// REGISTER


 
function SieveHasFlag(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id); 

  this.whiteSpace = [];
  this.whiteSpace[0] = this._createByName("whitespace", " ");
  this.whiteSpace[1] = this._createByName("whitespace", " ");
  this.whiteSpace[2] = this._createByName("whitespace", " ");    

  this.matchType      = null;
  this.flaglist = this._createByName("stringlist");
}

SieveHasFlag.prototype = Object.create(SieveAbstractElement.prototype);
SieveHasFlag.prototype.constructor = SieveHasFlag;

SieveHasFlag.isElement
  = function(parser, lexer)
{ 
  return parser.startsWith("hasflag");
}

SieveHasFlag.isCapable
    = function (capabilities)
{
  return (capabilities["imap4flags"] == true);      
}

SieveHasFlag.nodeName = function () {
  return "test/hasflag";
}

SieveHasFlag.nodeType  = function () {
  return "test";
}

SieveHasFlag.prototype.init
    = function (parser)
{
  parser.extract("hasflag")
  
  this.whiteSpace[0].init(parser)
  
  
  if (this._probeByName("match-type",parser))
  {
    this.matchType = this._createByName("match-type",parser);    
    this.whiteSpace[1].init(parser);
  }
  
  this.flaglist.init(parser);
  this.whiteSpace[2].init(parser);
      
  return this;
}    

SieveHasFlag.prototype.require
    = function (imports)
{
  imports["imap4flags"] = true;
  
  if (this.matchType)
    this.matchType.require(imports);
}

SieveHasFlag.prototype.toScript
    = function ()
{
  return "hasflag"
    + this.whiteSpace[0].toScript()
    + ((this.matchType != null)?this.matchType[0].toScript():"")
    + ((this.matchType != null)?this.whiteSpace[1].toScript():"")
    + this.flaglist.toScript()
    + this.whiteSpace[2].toScript();
}


/******************************************************************************/

if (!SieveLexer)
  throw "Could not register IMAP Flags";

SieveLexer.register(SieveAddFlag);
      
SieveLexer.register(SieveRemoveFlag);  
      
SieveLexer.register(SieveSetFlag);
      
SieveLexer.register(SieveHasFlag);
 