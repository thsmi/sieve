/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

 "use strict";
 
// TODO HashComment seperated by linebreaks are equivalent to bracket Comments...

function SieveLineBreak(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
}

SieveLineBreak.prototype = Object.create(SieveAbstractElement.prototype);
SieveLineBreak.prototype.constructor = SieveLineBreak;

SieveLineBreak.isElement
  = function (parser, lexer)
{
  return parser.startsWith("\r\n");
}

SieveLineBreak.nodeName = function () {
  return "whitespace/linebreak";
}

SieveLineBreak.nodeType  = function () {
  return "whitespace/";
}

SieveLineBreak.prototype.init
    = function (parser)
{
  parser.extract("\r\n");      
  return this;  
}

SieveLineBreak.prototype.toScript
    = function ()
{
  return "\r\n";
}

/******************************************************************************/


function SieveDeadCode(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  this.whiteSpace = "";
}

SieveDeadCode.isElement = function (parser, lexer) {  
  return (parser.isChar([" ","\t"])) 
}

SieveDeadCode.nodeName = function () {
  return "whitespace/deadcode";
}

SieveDeadCode.nodeType  = function () {
  return "whitespace/";
}

SieveDeadCode.prototype = Object.create(SieveAbstractElement.prototype);
SieveDeadCode.prototype.constructor = SieveDeadCode;

SieveDeadCode.prototype.init
    = function (parser)
{
  this.whiteSpace = parser.extractToken([" ","\t"]);
  
  return this;
}

SieveDeadCode.prototype.toScript
    = function ()
{
  return this.whiteSpace;
}

/******************************************************************************/

function SieveBracketComment(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  this.text = "";
}

SieveBracketComment.isElement = function (parser, lexer) {
  return parser.startsWith("/*");
}

SieveBracketComment.nodeName = function () {
  return "whitespace/bracketcomment";
}

SieveBracketComment.nodeType  = function () {
  return "whitespace/";
}

SieveBracketComment.prototype = Object.create(SieveAbstractElement.prototype);
SieveBracketComment.prototype.constructor = SieveBracketComment;

SieveBracketComment.prototype.init
    = function (parser)
{  
  parser.extract("/*")

  this.text = parser.extractUntil("*/");
  
  return this;
}

SieveBracketComment.prototype.toScript
    = function ()
{
  return "/*"+this.text+"*/";
}

/******************************************************************************/

function SieveHashComment(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  this.text = "";
}

SieveHashComment.prototype = Object.create(SieveAbstractElement.prototype);
SieveHashComment.prototype.constructor = SieveHashComment;

SieveHashComment.isElement
    = function (parser, lexer)
{
  return parser.isChar("#");
}

SieveHashComment.nodeName = function () {
  return "whitespace/hashcomment";
}

SieveHashComment.nodeType  = function () {
  return "whitespace/";
}

SieveHashComment.prototype.init
    = function (parser)
{  
  parser.extract("#");
        
  // ... and find the end of the comment
  this.text = parser.extractUntil("\r\n");

  return this;
}

SieveHashComment.prototype.toScript
    = function ()
{
  return "#"+this.text+"\r\n";
}

/******************************************************************************/

function SieveWhiteSpace(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  this.elements = [];
}

SieveWhiteSpace.prototype = Object.create(SieveAbstractElement.prototype);
SieveWhiteSpace.prototype.constructor = SieveWhiteSpace;

SieveWhiteSpace.isElement
    = function (parser, lexer)
{
  return lexer.probeByClass(["whitespace/"],parser); 
}

SieveWhiteSpace.nodeName = function () {
  return "whitespace";
}

SieveWhiteSpace.nodeType  = function () {
  return "whitespace";
}


/**
 * Parses a String for whitespace characters. It stops as soon as
 * it finds the first non whitespace. This means this method extracts   
 * zero or more whitespace characters
 * 
 * 
 * @param {} data
 * @param {boolean} crlf 
 *   if true linebreaks (\r\n) are not considerd as valid whitespace characters
 * @return {}
 */

SieveWhiteSpace.prototype.init
    = function (parser,crlf)
{ 
  var isCrlf = false;
  this.elements = [];
  
  // After the import section only deadcode and actions are valid
  while (this._probeByClass(["whitespace/"],parser))
  {
    // Check for CRLF...
    if (crlf && this._probeByName("whitespace/linebreak",parser))
      isCrlf = true;
    
    this.elements.push(this._createByClass(["whitespace/"],parser));
    
    // break if we found a CRLF
    if (isCrlf)
      break;
  }

  return this
}

SieveWhiteSpace.prototype.toScript
    = function ()
{
  var result = "";
  for (var key in this.elements)
    result += this.elements[key].toScript();
    
  return result;
}

/******************************************************************************/

function SieveSemicolon(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  
  this.whiteSpace = [];
  this.whiteSpace[0] = this._createByName("whitespace");
  this.whiteSpace[1] = this._createByName("whitespace","\r\n");
}

SieveSemicolon.prototype = Object.create(SieveAbstractElement.prototype);
SieveSemicolon.prototype.constructor = SieveSemicolon;

SieveSemicolon.isElement
    = function (parser, lexer)
{
  return true;
}

SieveSemicolon.nodeName = function () {
  return "atom/semicolon";
}

SieveSemicolon.nodeType  = function () {
  return "atom/";
}

SieveSemicolon.prototype.init
    = function (parser)
{
  // Syntax :
  // [whitespace] <";"> [whitespace]
  if (this._probeByName("whitespace",parser))
    this.whiteSpace[0].init(parser,true);

  parser.extractChar(";");

  this.whiteSpace[1].init(parser,true);  
      
  return this;
}

SieveSemicolon.prototype.toScript
    = function ()
{
  return this.whiteSpace[0].toScript()+ ";" + this.whiteSpace[1].toScript();
}

/******************************************************************************/

if (!SieveLexer)
  throw "Could not register DeadCode Elements";

SieveLexer.register(SieveLineBreak);
SieveLexer.register(SieveDeadCode);
SieveLexer.register(SieveBracketComment);  
SieveLexer.register(SieveHashComment);

SieveLexer.register(SieveWhiteSpace);

SieveLexer.register(SieveSemicolon);