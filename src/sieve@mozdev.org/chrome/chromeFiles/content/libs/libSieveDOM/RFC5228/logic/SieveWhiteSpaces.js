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
  = function (data)
{
  return ((data.charAt(0) == "\r") && (data.charAt(1) == "\n"))
}

SieveLineBreak.prototype.init
    = function (data)
{
  if (data.charAt(0) != "\r")
    throw "Linebreak expected \\r";
    
  if (data.charAt(1) != "\n")
    throw "Linebreak expected \\n";
      
  return data.slice(2);  
}

SieveLineBreak.prototype.toScript
    = function ()
{
  return "\r\n";
}

/******************************************************************************/


SieveDeadCode.isElement
  = function (data, index)
{
  var ch = data.charAt(0);
  
  if ((ch == " ") || (ch == "\t")) 
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
    = function (data)
{
  var i;
  
  for (i=0; i<data.length; i++)
  {
    var ch = data.charAt(i);
    
    if (ch == "\t")
      continue;
      
    if (ch == " ")
      continue;
      
    break;   
  }

  this.whiteSpace = data.slice(0,i);
  
  return data.slice(i);  
}

SieveDeadCode.prototype.toScript
    = function ()
{
  return this.whiteSpace;
}

/******************************************************************************/

SieveBracketComment.isElement
    = function (data)
{
  if (data.charAt(0) != "/")
    return false;
    
  if (data.charAt(1) != "*")
    return false;
  
  return true;
}

function SieveBracketComment(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  this.text = "";
}

SieveBracketComment.prototype.__proto__ = SieveAbstractElement.prototype;

SieveBracketComment.prototype.init
    = function (data)
{
  if (data.indexOf("/*") != 0)
    throw "/* expected";
    
  // remove the "/*"
  data = data.slice(2);

  var end = data.indexOf("*/"); 
  if (end == -1)
    throw "*/ expected";
    
    
  this.text = data.slice(0,end);
  
  // remove the "*/"    
  return data = data.slice(end+2);
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
    = function (data)
{
  return (data.charAt(0) == "#");
}

SieveHashComment.prototype.init
    = function (data)
{  
  // is this a valid HashComment...
  if (data.charAt(0) != "#")
    throw "# expected";
  
  // ... then remove the Hash # ...
  data = data.slice(1);
    
  // ... and find the end of the comment
  var end = data.indexOf("\r\n");
  if (end == -1)
    end = data.length;
  
  this.text = data.slice(0,end);
  
  //remove the \r\n
  return data = data.slice(end+2);
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
    = function (data)
{
  return SieveLexer.probeByClass(["whitespace/"],data); 
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
    = function (data,crlf)
{ 
  var isCrlf = false;
  this.elements = [];
  
  // After the import section only deadcode and actions are valid
  while (this._probeByClass(["whitespace/"],data))
  {
    // Check for CRLF...
    if (crlf && this._probeByName("whitespace/linebreak",data))
      isCrlf = true;
      
    var elm = this._createByClass(["whitespace/"],data);
      
    data = elm.init(data);
    
    this.elements.push(elm);
    
    // break if we found a CRLF
    if (isCrlf)
      break;
  }

  return data
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
    = function (data,index)
{
  return true;
}

SieveSemicolon.prototype.init
    = function (data)
{
  // Syntax :
  // [whitespace] <";"> [whitespace]
  if (this._probeByName("whitespace",data))
    data = this.whiteSpace[0].init(data,true);

  if (data.charAt(0) != ";")
    throw "Semicolon expected but found: \n"+data.substr(0,50)+"...";  
  
  data = data.slice(1);

  //if (this._probeByName("whitespace",data))
  data = this.whiteSpace[1].init(data,true);  
      
  return data;
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