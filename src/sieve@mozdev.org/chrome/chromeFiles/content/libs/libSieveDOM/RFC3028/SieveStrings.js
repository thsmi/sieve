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
  
 
/*******************************************************************************
    CLASSNAME: 
      SieveMultiLineString implements SieveObject
    
    CONSTUCTOR:
      public SieveMultiLineString()

    PUBLIC FUNCTIONS:
      public static boolean isMultiLineString(String data)
      public boolean parse(String data) throws Exception
      public String getValue()
      public String toScript()
      public String toXUL()

    MEMBER VARIABLES: 
      private String text
      private SieveWhiteSpace whiteSpace
      private SieveHashComment hashComment

    DESCRIPTION: 
      Defines the atomar SieveMultiLineString.
      
*******************************************************************************/

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
    = function (data)
{
  var token = data.substr(0,5).toLowerCase();
  if (token == "text:")
    return true;
  
  return false;
}

// PUBLIC:
SieveMultiLineString.prototype.init
    = function (data)    
{
  //<"text:"> *(SP / HTAB) (hash-comment / CRLF)
  if (this._probeByName("string/multiline",data) == false)
    throw "Multi-line String expected but found: \n"+data.substr(0,50)+"..."; 
  
  // remove the "text:"
  data = data.slice(5);
  
  data = this.whiteSpace.init(data,true);
    
  if (this._probeByName("whitespace/hashcomment",data))
  {
    this.hashComment = this._createByName("whitespace/hashcomment");
    data = this.hashComment.init(data);
  }
     
  while (true)
  { 
    var crlf = data.indexOf("\r\n")
    
    if (crlf == -1)
      throw "Syntaxerror: Multiline String not closed, \".\\r\\n missing" ;
      
    // Split at linebreaks
    var line = data.slice(0,crlf);
    data = data.slice(crlf+2);
    
    if (line == ".")
      break;
     
    this.text += (this.text != "" ? "\r\n" : "" ) + line;
  }
  
  //remove the \r\n
  return data;
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
  return "text:"
    +this.whiteSpace.toScript()
    +((this.hashComment == null)?"":this.hashComment.toScript())
    +this.text+(this.text != "" ? "\r\n" : "" )
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
    = function (data)
{
  if (data.charAt(0) == "\"")
    return true;
      
  return false;
}

// PUBLIC:
SieveQuotedString.prototype.init
   = function (data)    
{
  
   // remove the "
   data = data.slice(1);
   
   // TODO: Handle escaped characters...
   
   var size = data.indexOf("\"");

   this.text = data.slice(0,size);
      
   return data = data.slice(size+1); 
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
  return "\""+this.text+"\"";
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
   = function (data)
{
  // the [ is not necessary if the list contains only one enty!
  if (data.charAt(0) == "[")
    return true;
    
  if (SieveLexer.probeByName("string/quoted",data))
    return true;  

  return false;
}

// PUBLIC:
SieveStringList.prototype.init
    = function (data)
{
  this.elements = [];
  
  if (this._probeByName("string/quoted",data))
  {
    this.compact = true;
    var item = [];
    item[1] = this._createByName("string/quoted");
    
    this.elements[0] = item;
    
    return this.elements[0][1].init(data);
  }
  
  this.compact = false;
  
  if (data.charAt(0) !== "[")
    throw " [ expected but found:\n"+data.substr(0,50);
  // remove the [
  data = data.slice(1);
    
  while (true)
  {
    if (data.charAt(0) == "]")
      return data.slice(1);
      
    if (data.charAt(0) == ",")
    {      
      data = data.slice(1);
      continue;
    }
        
    var element = [];

    if (this._probeByName("whitespace",data))
    {
      element[0] = this._createByName("whitespace",data);      
      data = element[0].init(data);
    }
      
    if (this._probeByName("string/quoted",data) == false)  
      throw "Quoted String expected but found: \n"+data.substr(0,50)+"...";
    
    element[1] = this._createByName("string/quoted");
    data = element[1].init(data);
         
      
    if (this._probeByName("whitespace",data))
    {
      element[2] = this._createByName("whitespace",data); 
      data = element[2].init(data);
    }
    
    this.elements.push(element);
  }
  
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
  = function(data)
{
  return SieveLexer.probeByClass(["string/"],data);
}
// PUBLIC:
SieveString.prototype.init
    = function (data)    
{
  this.string = this._createByClass(["string/"],data);
  
  if (this.string == null)
    throw "Syntaxerror: String expected"
  
  return this.string.init(data);
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
    = function (data)
{    
  var token = data.substr(0,9).toLowerCase();
  if (token.indexOf(":is") == 0)
    return true;
  if (token.indexOf(":matches") == 0)
    return true;
  if (token.indexOf(":contains") == 0)
    return true;
  
  return false;
}

SieveMatchType.prototype.init
    = function (data)
{
  var token = data.substr(0,9).toLowerCase();
  if (token.indexOf(":is") == 0)
    this.type = "is";
  else if (token.indexOf(":matches") == 0)
    this.type = "matches";
  else if (token.indexOf(":contains") == 0)
    this.type = "contains"
  else 
    throw "Syntaxerror, unknown match type";
  
  if (this.type == "is")
    this.optional = false;
  
  return data.slice(this.type.length+1);
}

SieveMatchType.prototype.isOptional
    = function (value)
{
  if (typeof(value) === "undefined")
    return ((this.optional) && (this.type == "is"))
    
  this.optional = value; 
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
    = function (data,index)
{   
  var token = data.substr(0,11).toLowerCase();
  if (token.indexOf(":localpart") == 0)
    return true;
  if (token.indexOf(":domain") == 0)
    return true;
  if (token.indexOf(":all") == 0)
    return true;
  
  return false;
}


SieveAddressPart.prototype.init
    = function (data)
{
  var token = data.substr(0,11).toLowerCase();
  if (token.indexOf(":localpart") == 0)
    this.type = "localpart";
  else if (token.indexOf(":domain") == 0)
    this.type = "domain";
  else if (token.indexOf(":all") == 0)
    this.type = "all"
  else 
    throw "Syntaxerror, unknown address part";
    
  if (this.type == "all")
    this.optional = false;
  
  return data.slice(this.type.length+1);
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
    = function(data)
{   
  return (data.substr(0,11).toLowerCase() == ":comparator")
}

SieveComparator.prototype.init
    = function (data)
{
  // Syntax :
  // <":comparator"> <comparator-name: string>
  
  data = data.slice(":comparator".length);
  
  data = this.whiteSpace.init(data);
  
  data = this._comparator.init(data);
  
  this.optional = false;
  
  return data;
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

SieveLexer.register2("stringlist","stringlist",SieveStringList); 
SieveLexer.register2("string","string", SieveString);
SieveLexer.register2("string/","string/quoted",SieveQuotedString);
SieveLexer.register2("string/","string/multiline",SieveMultiLineString);
SieveLexer.register2("comparison","match-type",SieveMatchType)
SieveLexer.register2("comparison","comparator",SieveComparator)
SieveLexer.register2("comparison","address-part",SieveAddressPart)