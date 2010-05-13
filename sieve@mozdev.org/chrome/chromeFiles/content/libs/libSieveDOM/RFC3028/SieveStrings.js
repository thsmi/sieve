
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
      public String toString()
      public String toXUL()

    MEMBER VARIABLES: 
      private String text
      private SieveWhiteSpace whiteSpace
      private SieveHashComment hashComment

    DESCRIPTION: 
      Defines the atomar SieveMultiLineString.
      
*******************************************************************************/

// CONSTRUCTOR:
function SieveMultiLineString()
{
  this.text = "";
  this.whiteSpace = "";
  this.hashComment = null;  
}

// PUBLIC STATIC:
SieveMultiLineString.isMultiLineString
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
  //<"text:"> <hashcomment / CRLF>
  
  // remove the "text:"
  data = data.slice(5);

  // remove whitespaces if any
  var i;
  for (i=0; i<data.length; i++)
  {
    var ch = data.charAt(i);
    if (ch == " ")
      continue;
    if (ch == "\t")
      continue;
    
    break;
  }

  this.whiteSpace = data.slice(0,i);
    
  if (SieveLexer.probeByName("whitespace/hashcomment",data))
  {
    this.hashComment = SieveLexer.createByName("whitespace/hashcomment");    
    data = this.hashComment.init(data);
  }
  
  var end = data.indexOf("\r\n.\r\n");

  if (end == -1)
    throw "Syntaxerror: Multiline String not closed, \".\\r\\n missing" ;
  
  this.text = data.slice(0,end+2);
       
  data = data.slice(end+5);
  
  //remove the \r\n
  return data;
}

SieveMultiLineString.prototype.getValue
    = function ()
{
  return this.text;
} 


SieveMultiLineString.prototype.toString
    = function ()
{
  return "text:"
    +this.whiteSpace
    +((this.hashComment == null)?"\r\n":this.hashComment.toString())
    +this.text
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
      public String toString()
      public String toXUL()

    MEMBER VARIABLES: 
      private String text;

    DESCRIPTION: 
      Defines the atomar String which in encapsulated in Quotes (")
      
*******************************************************************************/


// CONSTRUCTOR:
function SieveQuotedString()
{
  this.text = "";
}

// PUBLIC STATIC:
SieveQuotedString.isQuotedString
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
  this.text = value;
} 

SieveQuotedString.prototype.toString
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
      public String toString()
      public String toXUL()

    MEMBER VARIABLES: 
      private Array[] elements;
      private boolean compact;

    DESCRIPTION: 
      A Stringlist is an Array of Quotedstring
      
*******************************************************************************/


// CONSTRUCTOR:
function SieveStringList(size)
{  
  this.elements = new Array();
  
  // if the list contains only one entry...
  // ... use the comact syntac, this means ...
  // ... don't use the "[...]" to encapsulate the string
  this.compact = true;
}

// PUBLIC STATIC:
SieveStringList.isStringList
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
  
  if (SieveLexer.probeByName("string/quoted",data))
  {
    this.compact = true;
    
    this.elements[0] = SieveLexer.createByName("string/quoted");
    return this.elements[0].init(data);
  }
  
  this.compact = false;
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
        
    var element = new Array("","","");

    if (SieveLexer.probeByName("whitespace",data))
    {
      element[0] = SieveLexer.createByName("whitespace",data);      
      data = element[0].init(data);
    }
      
    if (SieveLexer.probeByName("string/quoted",data) == false)  
      throw "Quoted String expected but found: \n"+data.substr(0,50)+"...";
    
    element[1] = SieveLexer.createByName("string/quoted");
    data = element[1].init(data);
         
      
    if (SieveLexer.probeByName("whitespace",data))
    {
      element[2] = SieveLexer.createByName("whitespace",data); 
      data = element[2].init(data);
    }
    
    this.elements.push(element);
  }
  
}
SieveStringList.prototype.toString
    = function ()
{
  if (this.compact)
    return this.elements[0].toString();
    
  var result = "[";
  var separator = "";
  
  for (var i = 0;i<this.elements.length; i++)
  {
    result = result
             + separator
             + this.elements[i][0].toString()
             + this.elements[i][1].toString()
             + this.elements[i][2].toString();
             
    separator = ",";
  }
  result += "]";
  
  return result;    
}

SieveStringList.prototype.toXUL
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
      public String toString()
      public String toXUL()

    MEMBER VARIABLES: 
      private String string;

    DESCRIPTION: 
      Defines the SieveString primitive by combinig the two atomar Stringtypes
      SieveQuotedString and SieveMultiLineString.
      
*******************************************************************************/


// CONSTRUCTOR: 
function SieveString()
{
  this.string = null;
}

// PUBLIC STATIC:
SieveString.isString
  = function(data)
{
  return SieveLexer.probeByClass(["string/"],data);
}
// PUBLIC:
SieveString.prototype.init
    = function (data)    
{
  this.string = SieveLexer.createByClass(["string/"],data);
  
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
   
SieveString.prototype.toString
    = function ()
{
  return this.string.toString();
}


if (!SieveLexer)
  throw "Could not register Strings Elements";

with (SieveLexer)
{
  register("stringlist","stringlist",
      function(token) {return SieveStringList.isStringList(token)}, 
      function(id) {return new SieveStringList(id)}); 
  
  register("string","string",
      function(token) {return SieveString.isString(token)}, 
      function(id) {return new SieveString(id)});

  register("string/","string/quoted",
      function(token) {return SieveQuotedString.isQuotedString(token)}, 
      function(id) {return new SieveQuotedString(id)});

  register("string/","string/multiline",
      function(token) {return SieveMultiLineString.isMultiLineString(token)}, 
      function(id) {return new SieveMultiLineString(id)});     
}