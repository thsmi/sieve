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
 
 "use strict";
 
 /**
  * Implements a parser for RFC5173 body tests
  *  
  *  "body" [COMPARATOR] [MATCH-TYPE] [BODY-TRANSFORM]
                <key-list: string-list>
  *  
  * @param {} docshell
  * @param {} id
  */
  
function SieveBody(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  
  this.whiteSpace = [];
  this.whiteSpace[0] = this._createByName("whitespace"," ");
  this.whiteSpace[1] = this._createByName("whitespace"," ");
  this.whiteSpace[2] = this._createByName("whitespace"," ");
  this.whiteSpace[3] = this._createByName("whitespace"," ");
  this.whiteSpace[4] = this._createByName("whitespace"," ");
  this.whiteSpace[5] = this._createByName("whitespace"," ");
 
  // Optional parameters
  this.matchType = this._createByName("match-type");
  this.comparator = this._createByName("comparator")
  this.bodyTransform = this._createByName("body-transform");
  
  // Mandatory parameters
  this.keyList = this._createByName("stringlist", '"Example"');
}

SieveBody.prototype = Object.create(SieveAbstractElement.prototype);
SieveBody.prototype.constructor = SieveBody;

SieveBody.isElement
  = function(parser, lexer)
{ 
  return parser.startsWith("body");
}

SieveBody.isCapable
    = function (capabilities)
{
  return (capabilities["body"] == true);      
}

SieveBody.nodeName = function () {
  return "test/body";
}

SieveBody.nodeType  = function () {
  return "test";
}

SieveBody.prototype.require
    = function (imports)
{
  this.matchType.require(imports);
  imports["body"] = true;
}

SieveBody.prototype.init
    = function (parser)
{
  parser.extract("body");
  this.whiteSpace[0].init(parser);
  
  while (true)
  {
  	if (this.comparator.isOptional() && this._probeByName("comparator",parser))
    {
      this.comparator.init(parser);
      this.whiteSpace[1].init(parser);
      
      continue;
    }
    
    if (this.matchType.isOptional() && this._probeByName("match-type",parser))
    {
      this.matchType.init(parser);      
      this.whiteSpace[3].init(parser);
      
      continue;
    }
    
    if (this.bodyTransform.isOptional() && this._probeByName("body-transform",parser))
    {
      this.bodyTransform.init(parser)
      this.whiteSpace[2].init(parser);
      
      continue;
    }
    
    // no more optional elements...
    break;    
  }   
  
  this.keyList.init(parser);
    
  this.whiteSpace[4].init(parser);
  
  return this;
}    

SieveBody.prototype.require
    = function (requires)
{
  requires["body"] = true;
}

SieveBody.prototype.toScript
    = function ()
{
  return "body"
    + this.whiteSpace[0].toScript()
    + this.bodyTransform.toScript()
    + (!this.bodyTransform.isOptional() ? this.whiteSpace[1].toScript() : "" )
    + this.comparator.toScript()
    + (!this.comparator.isOptional() ? this.whiteSpace[2].toScript() : "" )
    + this.matchType.toScript()
    + (!this.matchType.isOptional() ? this.whiteSpace[3].toScript(): "" )
    + this.keyList.toScript()
    + this.whiteSpace[4].toScript();
}

//-------------------------------------------------------------------------//

function SieveRawTransform(docshell, id) {
  SieveAbstractElement.call(this, docshell, id);    
}

SieveRawTransform.prototype = Object.create(SieveAbstractElement.prototype);
SieveRawTransform.prototype.constructor = SieveRawTransform;

SieveRawTransform.nodeName = function () {
  return "body-transform/raw";
}

SieveRawTransform.nodeType  = function () {
  return "body-transform/";
}

SieveRawTransform.isElement
    = function (parser, lexer)
{    
  if (parser.startsWith(":raw"))
    return true;
  
  return false;
}

SieveRawTransform.prototype.init
    = function (parser)
{  
  parser.extract(":raw");    
  return this;
}

SieveRawTransform.prototype.toScript
    = function ()
{    
  return ":raw";
}


//*******************************************************************//

/**
 * :content" <content-types: string-list>
 * 
 * @param {} docshell
 * @param {} id
 */
function SieveContentTransform(docshell, id) {
	
  SieveAbstractElement.call(this,docshell, id);
  
  this.whiteSpace = this._createByName("whitespace"," ");
  this.contentTypes = this._createByName("stringlist");
}

SieveContentTransform.prototype = Object.create(SieveAbstractElement.prototype);
SieveContentTransform.prototype.constructor = SieveContentTransform;

SieveContentTransform.nodeName = function () {
  return "body-transform/content";
}

SieveContentTransform.nodeType  = function () {
  return "body-transform/";
}

SieveContentTransform.isElement
    = function (parser, lexer)
{    
  if (parser.startsWith(":content"))
    return true;
  
  return false;
}

SieveContentTransform.prototype.init
    = function (parser)
{   
  parser.extract(":content");   
  
  this.whiteSpace.init(parser);
  
  this.contentTypes.init(parser);
  
  return this;
}

SieveContentTransform.prototype.toScript
    = function ()
{    
  return ":content"
           + this.whiteSpace.toScript()
           + this.contentTypes.toScript();
}

//*******************************************************************//

function SieveTextTransform(docshell, id) {
  SieveAbstractElement.call(this, docshell, id);
}

SieveTextTransform.prototype = Object.create(SieveAbstractElement.prototype);
SieveTextTransform.prototype.constructor = SieveTextTransform;

SieveTextTransform.nodeName = function () {
  return "body-transform/text";
}

SieveTextTransform.nodeType  = function () {
  return "body-transform/";
}

SieveTextTransform.isElement
    = function (parser, lexer)
{    

  if (parser.startsWith(":text"))
    return true;
  
  return false;
}


SieveTextTransform.prototype.init
    = function (parser)
{   
  parser.extract(":text");    
  return this;
}

SieveTextTransform.prototype.toScript
    = function ()
{    
  return ":text";
}


//*******************************************************************//

function SieveBodyTransform(docshell, id) {
    // call super constructor.
    SieveAbstractElement.call(this, docshell, id);
    
    // the default matchtype is by definition a :is
    this.type = this._createByName("body-transform/text",":text");
    this.optional = true;
}

SieveBodyTransform.prototype = Object.create(SieveAbstractElement.prototype);
SieveBodyTransform.prototype.constructor = SieveBodyTransform;

SieveBodyTransform.nodeName = function () {
  return "body-transform";
}

SieveBodyTransform.nodeType  = function () {
  return "body-tansform";
}

SieveBodyTransform.isElement
    = function (parser, lexer)
{
  return lexer.probeByClass(["body-transform/"], parser);
}

SieveBodyTransform.prototype.require
    = function (imports)
{
  this.type.require(imports);
}

SieveBodyTransform.prototype.init
    = function (parser)    
{
  this.type = this._createByClass(["body-transform/"],parser);

  if (this.type instanceof SieveTextTransform)
    this.optional = false;  
  
  return this;
}

SieveBodyTransform.prototype.isOptional
    = function (value)
{
  if (typeof(value) === "undefined")
    return ((this.optional) && (this.type instanceof SieveTextTransform))
    
  this.optional = !!value; 
  
  return this;
}

SieveBodyTransform.prototype.bodyTransform
    = function (value)
{
  if(typeof(value) === "undefined")
    return this.type.toScript();
    
  //value = value.toLowerCase();
  
  if (!this._probeByClass(["body-transform/"],value)) 
    throw "Unkonwn Body transform >>"+value+"<<";
    
  this.type = this._createByClass(["body-transform/"],value);        
  
  return this;
}


SieveBodyTransform.prototype.toScript
    = function ()
{
  if (this.isOptional())
    return "";
    
  return this.type.toScript();
}

/******************************************************************************/

if (!SieveLexer)
  throw "Could not register Body Extension";


SieveLexer.register(SieveContentTransform);
SieveLexer.register(SieveRawTransform);
SieveLexer.register(SieveTextTransform);


SieveLexer.register(SieveBodyTransform);      

SieveLexer.register(SieveBody);
