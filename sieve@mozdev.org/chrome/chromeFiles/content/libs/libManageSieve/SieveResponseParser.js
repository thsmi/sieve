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
  function UTF8Decode(utftext) 
  {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;

    while ( i < utftext.length ) 
    {
      c = utftext.charCodeAt(i);

      if (c < 128) 
      {
        string += String.fromCharCode(c);
        i++;
      }
      else if((c > 191) && (c < 224)) 
      {
        c2 = utftext.charCodeAt(i+1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      }
      else
      {
        c2 = utftext.charCodeAt(i+1);
        c3 = utftext.charCodeAt(i+2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }

    }

    return string;
  } 

function SieveResponseParser(data)
{
  if (data == null)
    throw "Error Parsing Response...\nData is null";
  
  this.data = data;
}

SieveResponseParser.prototype.extract
    = function (size)
{
    this.data = this.data.slice(size);
}

SieveResponseParser.prototype.isLineBreak
    = function ()
{
    if (this.data.indexOf("\r\n") != 0)
        return false;

    return true;
}

SieveResponseParser.prototype.extractLineBreak
    = function ()
{
    if (this.isLineBreak() == false)
        throw "Linebreak expected";
        
    this.data = this.data.slice(2);
}

SieveResponseParser.prototype.isSpace
    = function ()
{
    if (this.data.charAt(0) == " ")
        return true;

    return false;
}

SieveResponseParser.prototype.extractSpace
    = function ()
{
    if (this.isSpace() == false)
        throw "Space expected";
    
    this.data = this.data.slice(1);
}

//     literal               = "{" number  "+}" CRLF *OCTET
SieveResponseParser.prototype.isLiteral
    = function ()
{
    if (this.data.charAt(0) == "{")
        return true;

    return false;
}

// gibt einen string zur?ck, wenn keiner Existiert wird null ?bergeben
// bei syntaxfehlern filegt eine exception;
SieveResponseParser.prototype.extractLiteral
    = function ()
{
    if ( this.isLiteral() == false )
        throw "Literal Expected";
    
    // remove the "{"
    this.data = this.data.slice(1);

    // some sieveserves don't care about the Documentation
    // this means instead of "{4+}\r\n1234" we can get "{4}\r\n1234"
    var nextBracket = this.data.indexOf("}");
    if (nextBracket == -1)
        throw "Error unbalanced parathesis \"{\"";

    // extract the size, and ignore "+"
    var size = parseInt(this.data.slice(0,nextBracket).replace(/\+/,""));
    this.data = this.data.slice(nextBracket+1);

    if ( this.isLineBreak() == false)
        throw "Linebreak Expected";        
        
    this.extractLineBreak();

    // extract the Size...
    
    var literal = UTF8Decode(this.data.slice(0,size));
    this.data = this.data.slice(size);

    return literal;
}

SieveResponseParser.prototype.isQuoted
    = function ()
{
    if (this.data.charAt(0) == "\"")
        return true;

    return false;
}

SieveResponseParser.prototype.extractQuoted
    = function ()
{
    if (this.isQuoted() == false)
        throw "Quoted expected";

    // remove the Quote "
    this.data = this.data.slice(1);

    // save the position of the next "
    var nextQuote = this.data.indexOf("\"");

    if (nextQuote == -1)
        throw "Error unbalanced quotes";

	  var quoted = UTF8Decode(this.data.slice(0,nextQuote));

    this.data = this.data.slice(nextQuote+1);

    return quoted;
}


SieveResponseParser.prototype.isString
    = function ()
{
    if ( this.isQuoted() )
        return true;
    else if ( this.isLiteral() )
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
    var size = this.data.indexOf(delimiter)
    if (size == -1)
        throw "Delimiter not found";        
    
    var token = this.data.slice(0,size);
    this.data = this.data.slice(size);
    
    return token;
}

SieveResponseParser.prototype.startsWith
    = function ( string )
{
    var tmp = this.data.slice(0,string.length).toUpperCase();    

    if (tmp.indexOf(string.toUpperCase()) == 0)
        return true;
    
    return false;
}

SieveResponseParser.prototype.getData
    = function ()
{
    return this.data;
}    
    
