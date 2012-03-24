/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

"use strict";

function SieveParser(data)
{
  this._data = data;
  this._pos = 0;
}

SieveParser.prototype.isChar
  = function (ch,offset)
{  
  if (typeof(offset) == "undefined")
    offset = 0;
    
  if (!Array.isArray(ch))
    return (this._data.charAt(this._pos+offset) == ch);
  
  var ch = [].concat(ch)
  
  for (var i=0; i<ch.length; i++)
    if (this._data.charAt(this._pos+offset) == ch[i])
      return true;
      
  return false;  
}

SieveParser.prototype.extractToken
  = function (delimiter)
{
  var offset = 0;
  
  while (this.isChar(delimiter,offset))
    offset ++;
      
  if (offset == 0)
    throw "Delimiter not found";
    
  var str = this._data.substr(this._pos,offset)
  
  this._pos += str.length;
    
  return str;   
}

SieveParser.prototype.extractChar
  = function (ch)
{
  if (typeof(ch) != "undefined")
    if (!this.isChar(ch))
      throw " "+ch+" expected but found:\n"+this.bytes(50)+"..."
    
  this._pos++;
  return this._data.charAt(this._pos-1);
}

// TODO better naming
// Skip tries to skip Char, if possible returns true if not false 
SieveParser.prototype.skipChar
  = function (ch)
{
  if (typeof(ch) != "undefined")
    if (!this.isChar(ch))
      return false;
      
  this._pos++
  return true;
}

SieveParser.prototype.startsWith
  = function (str)
{   
  return (this._data.substr(this._pos,str.length).toLowerCase() == str);
}

// TODO rename to skip
SieveParser.prototype.extract
  = function (length)
{
  if (typeof(length) == "string")
  {
    var str = length;
    
    if(!this.startsWith(str))
     throw " "+str+" expected but found:\n"+this.bytes(50)+"..."
     
    this._pos += str.length;
    
    return this;
  }
  
  if (isNaN(parseInt(length,10)))
    throw "Invalid length";
    
  this._pos += length;
 
  return this;
}

// Delimiter
SieveParser.prototype.extractUntil
  = function (token)
{    
  var idx = this._data.indexOf(token,this._pos); 
  
  if (idx == -1)
    throw "Token expected: "+token.toSource() ;
  
  var str = this._data.substring(this._pos,idx)
  
  this._pos += str.length+token.length;
    
  return str;      
}

SieveParser.prototype.isNumber
  = function (offset)
{
  if (typeof(offset) != "number")
    offset = 0;
    
  if (this._pos + offset > this._data.length)
    throw "Parser out of bounds";

  return ! isNaN(parseInt(this._data.charAt(this._pos + offset)));
}

SieveParser.prototype.extractNumber
  = function ()
{
  var i=0;
  while (this.isNumber(i))
    i++;  
  
  var number = this._data.substr(this._pos,i);
  
  this._pos += i;
    
  return number;
}

SieveParser.prototype.bytes
  = function (length)
{
  return this._data.substr(this._pos,length);
}


SieveParser.prototype.empty
  = function ()
{
 return (this._pos >= this._data.length)
}

SieveParser.prototype.rewind
  = function (offset)
{
  this._pos -= offset;
}



