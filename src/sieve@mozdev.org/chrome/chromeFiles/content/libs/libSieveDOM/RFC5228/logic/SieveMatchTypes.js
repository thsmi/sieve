/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
"use strict";

function SieveIsMatch(docshell, id) {
  SieveAbstractElement.call(this, docshell, id);	
}

SieveIsMatch.prototype = Object.create(SieveAbstractElement.prototype);
SieveIsMatch.prototype.constructor = SieveIsMatch;

SieveIsMatch.nodeName = function () {
  return "match-type/is";
}

SieveIsMatch.nodeType  = function () {
  return "match-type/";
}

SieveIsMatch.isElement
    = function (parser, lexer)
{    
  if (parser.startsWith(":is"))
    return true;
  
  return false;
}

SieveIsMatch.prototype.init
    = function (parser)
{  
  if (!parser.startsWith(":is"))
    throw "Syntaxerror, no :is match type found";
    
  
  parser.extract(3);    
  return this;
}

SieveIsMatch.prototype.toScript
    = function ()
{    
  return ":is";
}


//*******************************************************************//

function SieveMatchesMatch(docshell, id) {
  SieveAbstractElement.call(this,docshell, id);
}

SieveMatchesMatch.prototype = Object.create(SieveAbstractElement.prototype);
SieveMatchesMatch.prototype.constructor = SieveMatchesMatch;

SieveMatchesMatch.nodeName = function () {
  return "match-type/matches";
}

SieveMatchesMatch.nodeType  = function () {
  return "match-type/";
}

SieveMatchesMatch.isElement
    = function (parser, lexer)
{    
  if (parser.startsWith(":matches"))
    return true;
  
  return false;
}

SieveMatchesMatch.prototype.init
    = function (parser)
{	
  if (!parser.startsWith(":matches"))
    throw "Syntaxerror, no :matches match type found";
    
  
  parser.extract(8);    
  return this;
}

SieveMatchesMatch.prototype.toScript
    = function ()
{    
  return ":matches";
}

//*******************************************************************//

function SieveContainsMatch(docshell, id) {
  SieveAbstractElement.call(this, docshell, id);
}

SieveContainsMatch.prototype = Object.create(SieveAbstractElement.prototype);
SieveContainsMatch.prototype.constructor = SieveContainsMatch;

SieveContainsMatch.nodeName = function () {
  return "match-type/contains";
}

SieveContainsMatch.nodeType  = function () {
  return "match-type/";
}

SieveContainsMatch.isElement
    = function (parser, lexer)
{    

  if (parser.startsWith(":contains"))
    return true;
  
  return false;
}


SieveContainsMatch.prototype.init
    = function (parser)
{	
  if (!parser.startsWith(":contains"))
    throw "Syntaxerror, no :contains match type found";
    
  
  parser.extract(9);    
  return this;
}

SieveContainsMatch.prototype.toScript
    = function ()
{    
  return ":contains";
}


//*******************************************************************//

function SieveMatchType(docshell, id) {
	// call super constructor.
	SieveAbstractElement.call(this, docshell, id);
	
	// the default matchtype is by definition a :is
	this.type = this._createByName("match-type/is",":is");
	this.optional = true;
}

SieveMatchType.prototype = Object.create(SieveAbstractElement.prototype);
SieveMatchType.prototype.constructor = SieveMatchType;

SieveMatchType.nodeName = function () {
  return "match-type";
}

SieveMatchType.nodeType  = function () {
  return "comparison";
}

SieveMatchType.isElement
    = function (parser, lexer)
{
  return lexer.probeByClass(["match-type/"], parser);
}

SieveMatchType.prototype.require
    = function (imports)
{
  this.type.require(imports);
}

SieveMatchType.prototype.init
    = function (parser)    
{
  this.type = this._createByClass(["match-type/"],parser);

  if (this.type instanceof SieveIsMatch)
    this.optional = false;  
  
  return this;
}

SieveMatchType.prototype.isOptional
    = function (value)
{
  if (typeof(value) === "undefined")
    return ((this.optional) && (this.type instanceof SieveIsMatch))
    
  this.optional = !!value; 
  
  return this;
}

SieveMatchType.prototype.matchType
    = function (value)
{
  if(typeof(value) === "undefined")
    return this.type.toScript();
    
  value = value.toLowerCase();
  
  if (!this._probeByClass(["match-type/"],value)) 
    throw "Unkonwn Match type >>"+value+"<<";
    
  this.type = this._createByClass(["match-type/"],value);	     
  
  return this;
}

SieveMatchType.prototype.toScript
    = function ()
{
  if (this.isOptional())
    return "";
    
  return this.type.toScript();
}


/******************************************************************************/

if (!SieveLexer)
  throw "Could not register MatchTypes";

SieveLexer.register(SieveIsMatch);
SieveLexer.register(SieveMatchesMatch);
SieveLexer.register(SieveContainsMatch);
SieveLexer.register(SieveMatchType);
      
   
