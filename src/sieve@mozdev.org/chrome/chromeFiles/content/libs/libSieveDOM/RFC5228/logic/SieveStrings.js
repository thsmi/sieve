/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";
 
// TODO create an abstract class for get and set string...
// TODO descide on update message weather it is a Multiline oder Quoted...
  
 

// CONSTRUCTOR:
function SieveMultiLineString(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id); 
  
  this.text = "";
  
  this.whiteSpace = this._createByName("whitespace");
  this.hashComment = null;
}

SieveMultiLineString.prototype.__proto__ = SieveAbstractElement.prototype;

// PUBLIC STATIC:
SieveMultiLineString.isElement
    = function (parser)
{
  return parser.startsWith("text:");
}

// PUBLIC:
SieveMultiLineString.prototype.init
    = function (parser)    
{
  //<"text:"> *(SP / HTAB) (hash-comment / CRLF)
/*  if (this._probeByName("string/multiline",parser) == false)
    throw "Multi-line String expected but found: \n"+parser.substr(0,50)+"...";*/ 
  
  // remove the "text:"
  parser.extract("text:");
  
  this.whiteSpace.init(parser,true);
    
  if (this._probeByName("whitespace/hashcomment",parser))
    this.hashComment = this._createByName("whitespace/hashcomment",parser);
     
  // we include the previously extracted linebreak. this makes life way easier...
  //  and allows us to match agains the unique "\r\n.\r\n" Pattern instead of
  // ... just ".\r\n"
  parser.rewind(2);
  
  this.text = parser.extractUntil("\r\n.\r\n");
    
  // dump the first linebreak and remove dot stuffing
  this.text = this.text.substr(2).replace(/^\.\./mg,".")
      
  return this;
}

SieveMultiLineString.prototype.getValue
    = function ()
{
  return this.text;
} 

SieveMultiLineString.prototype.setValue
    = function (value)
{
  this.text = value;
} 

SieveMultiLineString.prototype.toScript
    = function ()
{
  var text = this.text;
  
  if (text != "")
    text += "\r\n";
    
  // Dot stuffing...
  text = text.replace(/^\./mg,"..")
  
  return "text:"
    +this.whiteSpace.toScript()
    +((this.hashComment == null)?"":this.hashComment.toScript())
    +text
    +".\r\n";
}

/*******************************************************************************
    CLASSNAME: 
      SieveQuotedString implements SieveObject
    
    CONSTUCTOR:
      public SieveQuotedString()

    PUBLIC FUNCTIONS:      
      public static boolean isQuotedString(String data)
      public boolean parse(String data) throws Exception
      public String getValue()
      public String toScript()
      public String toXUL()

    MEMBER VARIABLES: 
      private String text;

    DESCRIPTION: 
      Defines the atomar String which in encapsulated in Quotes (")
      
*******************************************************************************/


// CONSTRUCTOR:
function SieveQuotedString(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id); 
  this.text = "";
}

SieveQuotedString.prototype.__proto__ = SieveAbstractElement.prototype;

// PUBLIC STATIC:
SieveQuotedString.isElement
    = function (parser)
{
  return parser.isChar("\"");
}

// PUBLIC:
SieveQuotedString.prototype.init
   = function (parser)    
{
  this.text = "";
  
  parser.extractChar("\"");
  
  if (parser.skipChar("\""))
  {
    this.text = "";
    return this;
  }
  
  // we should not be tricked by escaped quotes
  
  /*
   * " blubber "
   * " blub \" er" -> ignore
   * " blubber \\"  -> blubber \ -> skip
   * " blubber \\\""  -> blubber \" ->ignore
   * " blubber \\\\"
   * 
   *  "\\"
   */ 
  
  while(true)
  {
    this.text += parser.extractUntil("\"");
    
    // Skip if the quote is not escaped
    if (this.text.charAt(this.text.length-1) != "\\")
      break;
    
    // well it is obviously escaped, so we have to check if the escape 
    // character is escaped
    if (this.text.length >= 2)
      if (this.text.charAt(this.text.length-2) == "\\")
        break;
    
    // add the quote, it was escaped...
    this.text += "\"";
  }
   
  // Only double quotes and backslashes are escaped...
  // ... so we convert \" into "
  this.text = this.text.replace('\\"','"',"g")  
  // ... and convert \\ to \
  this.text = this.text.replace("\\\\","\\","g");
   
  // ... We should finally ignore an other backslash patterns...
  // ... but as they are illegal anyway, we assume a perfect world. 
      
  return this; 
}

SieveQuotedString.prototype.getValue
    = function ()
{
  return this.text;
}

SieveQuotedString.prototype.setValue
    = function (value)
{
  if (value.search(/(\r\n|\n|\r)/gm) != -1)
    throw "Quoted string support only single line strings";

  this.text = value;
} 

SieveQuotedString.prototype.toScript
    = function ()
{
  return "\""+this.text.replace("\\","\\\\","g").replace('"','\\"',"g")+"\"";
}

/*******************************************************************************
    CLASSNAME: 
      SieveStringList implements SieveObject
    
    CONSTUCTOR:
      public SieveStringList()

    PUBLIC FUNCTIONS:      
      public static boolean isStringList(String data)
      public boolean parse(String data) throws Exception
      public String toScript()
      public String toXUL()

    MEMBER VARIABLES: 
      private Array[] elements;
      private boolean compact;

    DESCRIPTION: 
      A Stringlist is an Array of Quotedstring
      
*******************************************************************************/


// CONSTRUCTOR:
function SieveStringList(docshell,id)
{  
  SieveAbstractElement.call(this,docshell,id); 
  
  this.elements = [];
  
  // if the list contains only one entry...
  // ... use the comact syntac, this means ...
  // ... don't use the "[...]" to encapsulate the string
  this.compact = true;
}

SieveStringList.prototype.__proto__ = SieveAbstractElement.prototype;

// PUBLIC STATIC:
SieveStringList.isElement
   = function (parser)
{
  // the [ is not necessary if the list contains only one enty!
  if (parser.isChar("["))
    return true;
    
  if (SieveLexer.probeByName("string/quoted",parser))
    return true;  

  return false;
}

// PUBLIC:
SieveStringList.prototype.init
    = function (parser)
{ 
  this.elements = [];
  
  if (this._probeByName("string/quoted",parser))
  {
    this.compact = true;
    var item = [];
    item[1] = this._createByName("string/quoted",parser);    
    this.elements[0] = item;
    
    return this;
  }
  
  this.compact = false;
  
  parser.extractChar("[");
    
  while ( ! parser.isChar("]"))
  { 
     if (this.elements.length)
      parser.extractChar(",");
        
    var element = [];

    if (this._probeByName("whitespace",parser))
      element[0] = this._createByName("whitespace",parser);
    
    if (this._probeByName("string/quoted",parser) == false)  
      throw "Quoted String expected but found: \n"+parser.bytes(50)+"...";
    
    element[1] = this._createByName("string/quoted",parser);
      
    if (this._probeByName("whitespace",parser))
      element[2] = this._createByName("whitespace",parser);
      
    this.elements.push(element);
  }
  
  parser.extractChar("]");
  return this;  
}

SieveStringList.prototype.contains
    = function (str,matchCase)
{  
  var item = "";
  
  if (typeof(matchCase) === "undefined")
    str = str.toLowerCase();
  
  for (var i=0; i<this.elements.length; i++)
  {
    if (typeof(matchCase) === "undefined")
      item = this.elements[i][1].getValue().toLowerCase();
    else 
      item = this.elements[i][1].getValue();
      
    if (item == str)
      return true
  }
  
  return false;
}

SieveStringList.prototype.item
    = function (idx,value)
{
  if (typeof(value) !== "undefined")
    this.elements[idx][1].setValue(value);
    
  return this.elements[idx][1].getValue();
}

SieveStringList.prototype.size
    = function ()
{  
  return this.elements.length;
}

SieveStringList.prototype.append
    = function(str)
{
  var elm = [null,"",null]
  elm[1] = this._createByName("string/quoted",'""');
  elm[1].setValue(str);
  
  this.elements.push(elm);
}

SieveStringList.prototype.clear
    = function()
{
  this.elements = [];
}

SieveStringList.prototype.remove
    = function(str)
{
  for (var i =0; i<this.elements.length; i++)
  {
    if (this.elements[i][1].getValue() != str)
      continue;
      
    this.elements.splice(i,1);
  }  
}


SieveStringList.prototype.toScript
    = function ()
{
  if (this.elements == 0)
    return '""'; 
    
  if (this.compact && this.elements.length <= 1)
    return this.elements[0][1].toScript();
    
  var result = "[";
  var separator = "";
  
  for (var i = 0;i<this.elements.length; i++)
  {      
    result = result + separator
             + ((this.elements[i][0] != null)? this.elements[i][0].toScript() : "")
             + this.elements[i][1].toScript()
             + ((this.elements[i][2] != null)? this.elements[i][2].toScript() : "");
             
    separator = ",";
  }
  result += "]";
  
  return result;
}

SieveStringList.prototype.toWidget
    = function ()
{
  if (this.compact)
    return this.elements[0].getValue();
   
  var result = "";   
  for (var i = 0;i<this.elements.length; i++)
  {
    result += this.elements[i][1].getValue()+" | ";
  }
  
  return result; 
}


/*******************************************************************************
    CLASSNAME: 
      SieveString implements SieveObject
    
    CONSTUCTOR:
      public SieveString()

    PUBLIC FUNCTIONS:      
      public static boolean isString(String data)
      public boolean parse(String data) throws Exception
      public String getValue()
      public String toScript()
      public String toXUL()

    MEMBER VARIABLES: 
      private String string;

    DESCRIPTION: 
      Defines the SieveString primitive by combinig the two atomar Stringtypes
      SieveQuotedString and SieveMultiLineString.
      
*******************************************************************************/


// CONSTRUCTOR: 
function SieveString(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id); 
  this.string = this._createByName("string/quoted");
}

SieveString.prototype.__proto__ = SieveAbstractElement.prototype;

// PUBLIC STATIC:
SieveString.isElement
  = function(parser)
{
  return SieveLexer.probeByClass(["string/"],parser);
}
// PUBLIC:
SieveString.prototype.init
    = function (parser)    
{
  this.string = this._createByClass(["string/"],parser);

  return this;
}

SieveString.prototype.getValue
    = function ()
{
  return this.string.getValue();
}

SieveString.prototype.setValue
    = function (value)
{
  //TODO: convert from/to multiline and singleline
  return this.string.setValue(value);
} 
   
SieveString.prototype.toScript
    = function ()
{
  return this.string.toScript();
}

//***************************************************************************//

//Matchtypes

/**
 * Matchtypes are used to compare Strings
 * @param {} id
 */
function SieveMatchType(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id); 
  this.type = "is";
  this.optional = true;
}

SieveMatchType.prototype.__proto__ = SieveAbstractElement.prototype;

SieveMatchType.isElement
    = function (parser)
{    
  if (parser.startsWith(":is"))
    return true;
  if (parser.startsWith(":matches"))
    return true;
  if (parser.startsWith(":contains"))
    return true;
  
  return false;
}

SieveMatchType.prototype.init
    = function (parser)
{  
  if (parser.startsWith(":is"))
    this.type = "is";
  else if (parser.startsWith(":matches"))
    this.type = "matches";
  else if (parser.startsWith(":contains"))
    this.type = "contains"
  else 
    throw "Syntaxerror, unknown match type";
  
  parser.extract(this.type.length+1);
    
  if (this.type == "is")
    this.optional = false;
  
  return this;
}

SieveMatchType.prototype.isOptional
    = function (value)
{
  if (typeof(value) === "undefined")
    return ((this.optional) && (this.type == "is"))
    
  this.optional = value; 
  
  return this;
}

SieveMatchType.prototype.matchType
    = function (value)
{
  if(typeof(value) === "undefined")
    return this.type
    
  value = value.toLowerCase();
  
  if ((value == "is") || (value == "matches") || (value == "contains"))
    this.type = value;
  else  
    throw "Unkonwn Match type >>"+value+"<<"; 
  
  return this;
}

SieveMatchType.prototype.toScript
    = function ()
{
  if (this.isOptional())
    return "";
    
  return ":"+this.type;
}



/**
 * Addresses are one of the most frequent things represented as strings.
 * These are structured, and allows comparison against the local-
 * part or the domain of an address 
 * 
 *             email@example.com 
 *          [local Part]@[Domain Part]
 *   
 * ist example.com der domain-part, email der local-part.
 */
//":localpart" / ":domain" / ":all"


function SieveAddressPart(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id); 
  this.type = "all";
  this.optional = true;
}

SieveAddressPart.prototype.__proto__ = SieveAbstractElement.prototype;

SieveAddressPart.isElement
    = function (parser)
{   
  if (parser.startsWith(":localpart"))
    return true;
  if (parser.startsWith(":domain"))
    return true;
  if (parser.startsWith(":all"))
    return true;
  
  return false;
}


SieveAddressPart.prototype.init
    = function (parser)
{
  if (parser.startsWith(":localpart"))
    this.type = "localpart";
  else if (parser.startsWith(":domain"))
    this.type = "domain";
  else if (parser.startsWith(":all"))
    this.type = "all"
  else 
    throw "Syntaxerror, unknown address part";
    
  parser.extract(this.type.length+1);
  
  if (this.type == "all")
    this.optional = false;
  
  return this; 
}

SieveAddressPart.prototype.isOptional
    = function (value)
{
  if (typeof(value) === "undefined")
    return ((this.optional) && (this.type == "all"))
    
  this.optional = value; 
}

SieveAddressPart.prototype.addressPart
    = function (value)
{
  if(typeof(value) === "undefined")
    return this.type
    
  value = value.toLowerCase();
  
  if ((value == "all") || (value == "domain") || (value == "localpart"))
    this.type = value;
  else  
    throw "Unkonwn Match type >>"+value+"<<"; 
  
  return this;
}

SieveAddressPart.prototype.toScript
    = function ()
{
  if (this.isOptional())
    return "";
    
  return ":"+this.type;
}


  // Comparators define the charset. All Sieve implementation have to support
  //  which" is case sensitive and "i;ascii-codemap" which is case
  // insensitive.

/**
 * Comparators sepcify the charset which should be used for string comparison
 * By default two matchtypes are supported. 
 * 
 * "i;octet" compares strings based on UTF-8 octetts
 * 
 * "i;ascii-codemap" converts strings before comparison to ASCII 
 */

function SieveComparator(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id); 
  this.whiteSpace = this._createByName("whitespace"," ");
  this._comparator = this._createByName("string/quoted","\"i;ascii-casemap\"");
  this.optional = true;
}

SieveComparator.prototype.__proto__ = SieveAbstractElement.prototype;

SieveComparator.isElement
    = function(parser)
{   
  return (parser.startsWith(":comparator"))
}

SieveComparator.prototype.init
    = function (parser)
{
  // Syntax :
  // <":comparator"> <comparator-name: string>
  parser.extract(":comparator");
  
  this.whiteSpace.init(parser);
  
  this._comparator.init(parser);
  
  this.optional = false;
  
  return this;
}

SieveComparator.prototype.isOptional
    = function (value)
{
  if (typeof(value) === "undefined")
    return ((this.optional) && (this._comparator.getValue() == "i;ascii-casemap"))
    
  this.optional = value; 
}

SieveComparator.prototype.comparator
    = function (value)
{
  if(typeof(value) === "undefined")
    return this._comparator.getValue();
    
  this._comparator.setValue(value);
  
  return this;
}

SieveComparator.prototype.toScript
    = function ()
{
  if (this.isOptional())
    return "";
      
  return ":comparator"
    +this.whiteSpace.toScript()
    +this._comparator.toScript();
}

if (!SieveLexer)
  throw "Could not register Strings Elements";

SieveLexer.register("stringlist","stringlist",SieveStringList); 
SieveLexer.register("string","string", SieveString);
SieveLexer.register("string/","string/quoted",SieveQuotedString);
SieveLexer.register("string/","string/multiline",SieveMultiLineString);
SieveLexer.register("comparison","match-type",SieveMatchType);
SieveLexer.register("comparison","comparator",SieveComparator);
SieveLexer.register("comparison","address-part",SieveAddressPart);