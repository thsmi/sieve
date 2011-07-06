/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
/*******************************************************************************
  Manage Sieve uses for literals UTF-8 as encoding, network sockets are usualy 
  binary, and javascript is something in between. This means we have to convert
  UTF-8 into a binary and vice versa by our own...   
********************************************************************************/

  // public method for url decoding
  
  function StringFromBytes(byteArray, startIndex, endIndex)
  {
    var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                    .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8" ;
  
    byteArray = byteArray.slice(startIndex,endIndex);
    return converter.convertFromByteArray(byteArray, byteArray.length);
  }

/**
 * 
 * @param {Byte[]} data
 */
function SieveResponseParser(data)
{
  if (data == null)
    throw "Error Parsing Response...\nData is null";

  this.pos = 0;
  this.data = data;
}

SieveResponseParser.prototype.extract
    = function (size)
{
  this.pos += size;
}

SieveResponseParser.prototype.isLineBreak
    = function ()
{
  // TODO test for array out of bounds...
  if (this.data[this.pos] != 13)
    return false;
    
  if (this.data[this.pos+1] != 10)
    return false;

  return true;
}

SieveResponseParser.prototype.extractLineBreak
    = function ()
{
  if (this.isLineBreak() == false)
    throw "Linebreak expected:\r\n"+this.getData();
  
  this.pos += 2;
}

SieveResponseParser.prototype.isSpace
    = function ()
{ 
  if (this.data[this.pos] == 32)
    return true;
    
  return false;
}

SieveResponseParser.prototype.extractSpace
    = function ()
{
  if (this.isSpace() == false)
    throw "Space expected in :\r\n"+this.getData();
    
  this.pos++;
}

//     literal               = "{" number  "+}" CRLF *OCTET
SieveResponseParser.prototype.isLiteral
    = function ()
{
  if (this.data[this.pos] == 123)
    return true;

  return false;
}

// gibt einen string zur?ck, wenn keiner Existiert wird null ?bergeben
// bei syntaxfehlern filegt eine exception;
SieveResponseParser.prototype.extractLiteral
    = function ()
{
  if ( this.isLiteral() == false )
    throw "Literal Expected in :\r\n"+this.getData();
         
  // remove the "{"
  this.pos++;

  // some sieve implementations are broken, this means ....
  // ... we can get "{4+}\r\n1234" or "{4}\r\n1234"
  
  var nextBracket = this.indexOf(125);
  if (nextBracket == -1)
    throw "Error unbalanced parathesis \"{\"";
  
  // extract the size, and ignore "+"
  var size = parseInt(StringFromBytes(this.data, this.pos, nextBracket).replace(/\+/,""));
    
  this.pos = nextBracket+1;

  if ( this.isLineBreak() == false)
    throw "Linebreak Expected";        
        
  this.extractLineBreak();

  // extract the literal...  
  var literal = StringFromBytes(this.data, this.pos, this.pos+size);
  this.pos += size;

  return literal;
}

SieveResponseParser.prototype.indexOf
    = function (character)
{     
  for (var i=this.pos; i<this.data.length; i++)
  {
    if (this.data[i] == character)
      return i;
  }
  
  return -1;
}

SieveResponseParser.prototype.isQuoted
    = function ()
{ 
  if (this.data[this.pos] == 34)
    return true;

  return false;
}

SieveResponseParser.prototype.extractQuoted
    = function ()
{
  if (this.isQuoted() == false)
    throw "Quoted expected";

  // remove the Quote "
  this.pos++;
  
  // save the position of the next "
  var nextQuote = this.indexOf(34);

  if (nextQuote == -1)
    throw "Error unbalanced quotes";

  var quoted = StringFromBytes(this.data,this.pos,nextQuote);

  this.pos = nextQuote+1;

  return quoted;
}


SieveResponseParser.prototype.isString
    = function ()
{
  if ( this.isQuoted() )
    return true;
    
  if ( this.isLiteral() )
    return true;

  return false;
}

SieveResponseParser.prototype.extractString
    = function ()
{
  if ( this.isQuoted() )
    return this.extractQuoted();
  if ( this.isLiteral() )
    return this.extractLiteral();
        
  throw "Message String expected";        
}

// Tokens end with an linebreak or a Space
SieveResponseParser.prototype.extractToken
    = function ( delimiter )
{
  var index = this.indexOf(delimiter);

  if (index == -1)
    throw "Delimiter >>"+delimiter+"<< not found in :\r\n"+this.getData();        
  
  var token = StringFromBytes(this.data,this.pos,index);
  this.pos = index;
    
  return token;
}

SieveResponseParser.prototype.startsWith
    = function ( array )
{
  if (array.length == 0)
    return false;
    
  for (var i=0; i<array.length; i++) 
  {  
    var result = false;
    
    for (var ii=0; ii<array[i].length; ii++)
      if (array[i][ii] == this.data[this.pos+i])
        result = true;
    
    if (result == false)
      return false     
  }
  
  return true;
}

/*SieveResponseParser.prototype.startsWith
    = function ( string )
{
  string = new String(string);
  
  var upper = string.toUpperCase();
  var lower = string.toLowerCase();
  
  // TODO convert Strings to byte array...
  
  for (var i; i<string.length; i++)
    if ((this.data[this.pos+i] != upper[i]) && (this.data[this.pos+i] != lower[i])) 
      return false;
      
  return true;        
}*/

SieveResponseParser.prototype.getByteArray
    = function ()
{
  return this.data.slice(this.pos, this.data.length);
}

/**
 * Returns content of the response parser's buffer. 
 * 
 * @return {String} the buffers content
 */
SieveResponseParser.prototype.getData
    = function ()
{ 
  return StringFromBytes(this.data, this.pos, this.data.length);
}

SieveResponseParser.prototype.isEmpty
    = function ()
{
  if (this.data.length >= this.pos)
    return true;
    
  return false;
}
    
