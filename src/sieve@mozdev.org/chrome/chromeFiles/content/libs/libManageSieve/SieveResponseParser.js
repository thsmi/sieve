/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 

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
    throw "Space expected in: "+this.getData();
    
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

// gibt einen string zurück, wenn keiner Existiert wird null übergeben
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
  var size = parseInt(this.getData(this.pos, nextBracket).replace(/\+/,""),10);
    
  this.pos = nextBracket+1;

  if ( this.isLineBreak() == false)
    throw "Linebreak Expected";        
        
  this.extractLineBreak();

  // extract the literal...  
  var literal = this.getData(this.pos, this.pos+size);
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

  var quoted = this.getData(this.pos,nextQuote);

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

/**
 * Extracts a token form a response. The token is beeing delimited by any 
 * separator. The extracted token does not include the separator. 
 * 
 * @param {byte[]} separators
 *   an array containing possible token separators. The first match always wins.
 * @return {String}
 *   the extracted token.
 */
SieveResponseParser.prototype.extractToken
    = function ( separators )
{
  // Search for the separators, the one with the lowest index which is not... 
  // ... equal to -1 wins. The -2 indecates not initalized...
  var index = -1;
  
  for (var i=0; i<separators.length;i++)
  {   
    var idx = this.indexOf(separators[i],this.pos);
    
    if (idx == -1)
      continue;
      
    if (index == -1)
      index = idx;
    else
      index = Math.min(index,idx);
  }

  if (index == -1)
    throw "Delimiter >>"+separators+"<< not found in: "+this.getData();        
  
  var token = this.getData(this.pos,index);
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
 * Returns a copy of the response parser's buffer as an UTF-8 encoded string. 
 * 
 * Manage Sieve encodes literals in UTF-8 while network sockets are usualy 
 * binary. So we can't use java scripts build in string functions as they expect 
 * pure unicode.  
 * 
 * @param {int} startIndex
 *   Optional zero-based index at which to begin.
 * @param {int} endIndex
 *   Optional Zero-based index at which to end.
 * @return {String} the copy buffers content
 */
SieveResponseParser.prototype.getData
    = function (startIndex, endIndex)
{
  if (arguments.length < 2)
    endIndex = this.data.length;
    
  if (arguments.length < 1)
    startIndex = this.pos;
    
  var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                    .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
  converter.charset = "UTF-8" ;
  
  var byteArray = this.data.slice(startIndex,endIndex);
  
  return converter.convertFromByteArray(byteArray, byteArray.length);
}


SieveResponseParser.prototype.isEmpty
    = function ()
{
  if (this.data.length >= this.pos)
    return true;
    
  return false;
}