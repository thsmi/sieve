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

SieveLineBreak.prototype.__proto__ = SieveAbstractElement.prototype;

SieveLineBreak.isElement
  = function (parser)
{
  return parser.startsWith("\r\n");
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


SieveDeadCode.isElement
  = function (parser)
{  
  if (parser.isChar([" ","\t"])) 
    return true;    
    
  return false;
}

function SieveDeadCode(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  this.whiteSpace = "";
}

SieveDeadCode.prototype.__proto__ = SieveAbstractElement.prototype;

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

SieveBracketComment.isElement
    = function (parser)
{
  return parser.startsWith("/*");
}

function SieveBracketComment(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  this.text = "";
}

SieveBracketComment.prototype.__proto__ = SieveAbstractElement.prototype;

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

SieveHashComment.prototype.__proto__ = SieveAbstractElement.prototype;

SieveHashComment.isElement
    = function (parser)
{
  return parser.isChar("#");
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

SieveWhiteSpace.prototype.__proto__ = SieveAbstractElement.prototype;

SieveWhiteSpace.isElement
    = function (parser)
{
  return SieveLexer.probeByClass(["whitespace/"],parser); 
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

SieveSemicolon.prototype.__proto__ = SieveAbstractElement.prototype;

SieveSemicolon.isElement
    = function (parser)
{
  return true;
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

SieveLexer.register("whitespace/","whitespace/linebreak",SieveLineBreak);
SieveLexer.register("whitespace/","whitespace/deadcode",SieveDeadCode);
SieveLexer.register("whitespace/","whitespace/bracketcomment",SieveBracketComment);  
SieveLexer.register("whitespace/","whitespace/hashcomment",SieveHashComment);

SieveLexer.register("whitespace","whitespace",SieveWhiteSpace);

SieveLexer.register("atom/","atom/semicolon",SieveSemicolon);