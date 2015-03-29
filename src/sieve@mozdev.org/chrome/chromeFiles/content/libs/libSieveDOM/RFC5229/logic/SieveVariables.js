/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
"use strict";
 
 
//   Usage:  ":lower" / ":upper" / ":lowerfirst" / ":upperfirst" /
//           ":quotewildcard" / ":length"
 
// set [MODIFIER] <name: string> <value: string>


/**
 * The "set" action stores the specified value in the variable identified by name.  
 * The name MUST be a constant string and conform to the syntax of variable-name.  
 * Match variables cannot be set.  A namespace cannot be used unless an extension 
 * explicitly allows its use in "set". An invalid name MUST be detected as a syntax error.
 *
 * Variable names are case insensitive.
 * 
 * Syntax:  set [MODIFIER] <name: string> <value: string>
 * 
 * @param {} docshell
 * @param {} id
 */
function SieveSetVariable(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id); 
  
  this.items = [];
  
  this.items[0] = this._createByName("whitespace"," ");  
  this.items[1] = this._createByName("modifier","");
  this.items[2] = this._createByName("string","\"variable\"");
  this.items[3] = this._createByName("whitespace"," ");
  this.items[4] = this._createByName("string","\"value\""); 
  this.items[5] = this._createByName("atom/semicolon");
}

SieveSetVariable.prototype = Object.create(SieveAbstractElement.prototype);
SieveSetVariable.prototype.constructor = SieveSetVariable;

SieveSetVariable.isElement
    = function (parser, lexer)
{
  return parser.startsWith("set");
}
    
SieveSetVariable.isCapable = function (capabilities) {
  return (capabilities["variables"] == true);      
}

SieveSetVariable.prototype.require
    = function (imports)
{
  imports["variables"] = true;
}

SieveSetVariable.nodeName = function () {
  return "action/setvariable";
}

SieveSetVariable.nodeType  = function () {
  return "action";
}

SieveSetVariable.prototype.init
    = function (parser)
{  
  //debugger;	
  parser.extract("set");
    
  // ... eat the deadcode before the modifier...
  this.items[0].init(parser);
      
  // the optional modifier
  this.items[1].init(parser);
    
  // the name
  this.items[2].init(parser);
  
  // the separating whitespace
  this.items[3].init(parser);
  
  // the value
  this.items[4].init(parser);
  
  // semicolon
  this.items[5].init(parser);
    
  return this;
}


SieveSetVariable.prototype.toScript
    = function ()
{
 // debugger;
  
  var result = "set"
  
  this.items.forEach( function(element, index, array) {
  	if (element)
  	  result += element.toScript();
  });  
  
  return result;
}



/******************************************************************************/



/**
 *
 *    Usage:  string [MATCH-TYPE] [COMPARATOR]
           <source: string-list> <key-list: string-list>
 */ 
function SieveTestString(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id); 

  this.items = [];
 
  this.items[0] = this._createByName("whitespace", " ");
  // Matchtype
  this.items[1] = this._createByName("match-type");
  this.items[2] = this._createByName("whitespace", " ");
  // Comparator
  this.items[3] = this._createByName("comparator");    
  this.items[4] = this._createByName("whitespace", " ");
  // Source
  this.items[5] = this._createByName("stringlist");
  this.items[6] = this._createByName("whitespace", " ");
  // key list
  this.items[7] = this._createByName("stringlist");
  
}

SieveTestString.prototype = Object.create(SieveAbstractElement.prototype);
SieveTestString.prototype.constructor = SieveTestString;

SieveTestString.isElement
  = function(parser, lexer)
{ 
  return parser.startsWith("string");
}

SieveTestString.isCapable
    = function (capabilities)
{
  return (capabilities["variables"] == true);      
}

SieveTestString.prototype.require
    = function (imports)
{
  imports["variables"] = true;
  
  if (this.matchType)
    this.matchType.require(imports);
}

SieveTestString.nodeName = function () {
  return "test/string";
}

SieveTestString.nodeType  = function () {
  return "test";
}

SieveTestString.prototype.init
    = function (parser)
{
  parser.extract("string");
  
  this.items[0].init(parser);
  
  // match-types
  if (this._probeByName("match-type",parser))
  {
    this.items[1] = this._createByName("match-type",parser);    
    this.items[2].init(parser);
  }

  // Comparator
  if (this._probeByName("comparator",parser))
  {
    this.items[3] = this._createByName("comparator");    
    this.items[4].init(parser);  	
  }

  // Source
  this.items[5].init(parser);
  this.items[6].init(parser);
  
  // Keylist
  this.items[7].init(parser);
  
  return this;
}    



SieveTestString.prototype.toScript
    = function ()
{
	var result = "string";
	
	result += this.items[0].toScript();
	
	if (!this.items[1].isOptional()) {
		result += this.items[1].toScript();
		result += this.items[2].toScript();
	}
	
	if (!this.items[3].isOptional()) {
		result += this.items[3].toScript();
		result += this.items[4].toScript();
	}
	
	result += this.items[5].toScript();
	result += this.items[6].toScript();
	
	result += this.items[7].toScript();

	return result;
}


//*******************************************************************//

function SieveLowerModifier(docshell, id) {
  SieveAbstractElement.call(this, docshell, id);
}

SieveLowerModifier.prototype = Object.create(SieveAbstractElement.prototype);
SieveLowerModifier.prototype.constructor = SieveLowerModifier;

SieveLowerModifier.nodeName = function () {
  return "modifier/lower";
}

SieveLowerModifier.nodeType  = function () {
  return "modifier/";
}

SieveLowerModifier.isElement
    = function (parser, lexer)
{    

  if (parser.startsWith(":lower"))
    return true;
  
  return false;
}


SieveLowerModifier.prototype.init
    = function (parser)
{	
  parser.extract(":lower");    
  return this;
}

SieveLowerModifier.prototype.toScript
    = function ()
{    
  return ":lower";
}

//*******************************************************************//

function SieveUpperModifier(docshell, id) {
  SieveAbstractElement.call(this, docshell, id);
}

SieveUpperModifier.prototype = Object.create(SieveAbstractElement.prototype);
SieveUpperModifier.prototype.constructor = SieveUpperModifier;

SieveUpperModifier.nodeName = function () {
  return "modifier/upper";
}

SieveUpperModifier.nodeType  = function () {
  return "modifier/";
}

SieveUpperModifier.isElement
    = function (parser, lexer)
{    

  if (parser.startsWith(":upper"))
    return true;
  
  return false;
}


SieveUpperModifier.prototype.init
    = function (parser)
{	
  parser.extract(":upper");    
  return this;
}

SieveUpperModifier.prototype.toScript
    = function ()
{    
  return ":upper";
}

//*******************************************************************//

function SieveLowerFirstModifier(docshell, id) {
  SieveAbstractElement.call(this, docshell, id);
}

SieveLowerFirstModifier.prototype = Object.create(SieveAbstractElement.prototype);
SieveLowerFirstModifier.prototype.constructor = SieveLowerFirstModifier;

SieveLowerFirstModifier.nodeName = function () {
  return "modifier/lowerFirst";
}

SieveLowerFirstModifier.nodeType  = function () {
  return "modifier/";
}

SieveLowerFirstModifier.isElement
    = function (parser, lexer)
{    

  if (parser.startsWith(":lowerfirst"))
    return true;
  
  return false;
}


SieveLowerFirstModifier.prototype.init
    = function (parser)
{	
  parser.extract(":lowerfirst");    
  return this;
}

SieveLowerFirstModifier.prototype.toScript
    = function ()
{    
  return ":lowerfirst";
}

//*******************************************************************//

function SieveUpperFirstModifier(docshell, id) {
  SieveAbstractElement.call(this, docshell, id);
}

SieveUpperFirstModifier.prototype = Object.create(SieveAbstractElement.prototype);
SieveUpperFirstModifier.prototype.constructor = SieveUpperFirstModifier;

SieveUpperFirstModifier.nodeName = function () {
  return "modifier/upperFirst";
}

SieveUpperFirstModifier.nodeType  = function () {
  return "modifier/";
}

SieveUpperFirstModifier.isElement
    = function (parser, lexer)
{    

  if (parser.startsWith(":upperfirst"))
    return true;
  
  return false;
}


SieveUpperFirstModifier.prototype.init
    = function (parser)
{	
  parser.extract(":upperfirst");    
  return this;
}

SieveUpperFirstModifier.prototype.toScript
    = function ()
{    
  return ":upperfirst";
}

//*******************************************************************//

function SieveQuoteWildcardModifier(docshell, id) {
  SieveAbstractElement.call(this, docshell, id);
}

SieveQuoteWildcardModifier.prototype = Object.create(SieveAbstractElement.prototype);
SieveQuoteWildcardModifier.prototype.constructor = SieveQuoteWildcardModifier;

SieveQuoteWildcardModifier.nodeName = function () {
  return "modifier/quotewildcard";
}

SieveQuoteWildcardModifier.nodeType  = function () {
  return "modifier/";
}

SieveQuoteWildcardModifier.isElement
    = function (parser, lexer)
{    

  if (parser.startsWith(":quotewildcard"))
    return true;
  
  return false;
}


SieveQuoteWildcardModifier.prototype.init
    = function (parser)
{	
  parser.extract(":quotewildcard");    
  return this;
}

SieveQuoteWildcardModifier.prototype.toScript
    = function ()
{    
  return ":quotewildcard";
}



//*******************************************************************//

function SieveLengthModifier(docshell, id) {
  SieveAbstractElement.call(this, docshell, id);
}

SieveLengthModifier.prototype = Object.create(SieveAbstractElement.prototype);
SieveLengthModifier.prototype.constructor = SieveLengthModifier;

SieveLengthModifier.nodeName = function () {
  return "modifier/length";
}

SieveLengthModifier.nodeType  = function () {
  return "modifier/";
}

SieveLengthModifier.isElement
    = function (parser, lexer)
{    

  if (parser.startsWith(":length"))
    return true;
  
  return false;
}


SieveLengthModifier.prototype.init
    = function (parser)
{	
  parser.extract(":length");    
  return this;
}

SieveLengthModifier.prototype.toScript
    = function ()
{    
  return ":length";
}

/******************************************************************************/

function SieveModifierList(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  this.modifiers = [];
}

SieveModifierList.prototype = Object.create(SieveAbstractElement.prototype);
SieveModifierList.prototype.constructor = SieveModifierList;

SieveModifierList.isElement
   = function (parser, lexer)
{
  return lexer.probeByClass(["modifier/"],parser);
}

SieveModifierList.nodeName = function () {
  return "modifier";
}

SieveModifierList.nodeType  = function () {
  return "modifier";
}

SieveModifierList.prototype.init
    = function (parser)
{   
  this.modifiers = [];
  
  while (this._probeByClass("modifier/", parser)) {

  	// extract the modifier
  	this.modifiers.push(this._createByClass("modifier/", parser));
  	
  	// and the white space we know there has to be one...
  	this.modifiers.push(this._createByName("whitespace", parser)); 	
  }
   
  return this;
}

SieveModifierList.prototype.toScript
    = function()
{
  var result = "";
  
  this.modifiers.forEach(function(element, index, array) {
  	  result += element.toScript();
  } );
    
  return result;  
}

SieveModifierList.prototype.require
    = function (imports)
{
  this.modifiers.forEach( function(element, index, array) {
  	element.require(imports);
  });
}



if (!SieveLexer)
  throw "Could not register variables extension";

SieveLexer.register(SieveSetVariable);

SieveLexer.register(SieveTestString);

// The order matters here, first the longer strings then the shorter.
// Otherwise Lower will match before lowerfirst.
SieveLexer.register(SieveLowerFirstModifier);
SieveLexer.register(SieveUpperFirstModifier);
SieveLexer.register(SieveLowerModifier);
SieveLexer.register(SieveUpperModifier);
SieveLexer.register(SieveQuoteWildcardModifier);
SieveLexer.register(SieveLengthModifier);

SieveLexer.register(SieveModifierList);
 