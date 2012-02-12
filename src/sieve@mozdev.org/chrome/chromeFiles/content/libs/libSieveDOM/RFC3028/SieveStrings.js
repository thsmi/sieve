
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
function SieveMultiLineString()
{
  this.text = "";
  
  this.whiteSpace = SieveLexer.createByName("whitespace");
  this.hashComment = null;
}

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
  if (SieveLexer.probeByName("string/multiline",data) == false)
    throw "Multi-line String expected but found: \n"+data.substr(0,50)+"..."; 
  
  // remove the "text:"
  data = data.slice(5);
  
  data = this.whiteSpace.init(data,true);
    
  if (SieveLexer.probeByName("whitespace/hashcomment",data))
  {
    this.hashComment = SieveLexer.createByName("whitespace/hashcomment");
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
function SieveQuotedString()
{
  this.text = "";
}

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
function SieveStringList(id)
{  
  SieveAbstractElement.call(this,id); 
  
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
  
  if (SieveLexer.probeByName("string/quoted",data))
  {
    this.compact = true;
    var item = ["","",""];
    item[1] = SieveLexer.createByName("string/quoted");
    
    this.elements[0] = item;
    
    return this.elements[0][1].init(data);
  }
  
  this.compact = false;
  
  if (data.charAt(0) !== "[")
    throw " [ expceted ";
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
  var elm = ["","",""]
  elm[1] = SieveLexer.createByName("string/quoted",'""');
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
    
  if (this.compact && this.elements <= 1)
    return this.elements[0][1].toScript();
    
  var result = "[";
  var separator = "";
  
  for (var i = 0;i<this.elements.length; i++)
  {      
    result = result
             + separator
             + this.elements[i][0].toString()
             + this.elements[i][1].toScript()
             + this.elements[i][2].toString();
             
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
function SieveString()
{
  this.string = SieveLexer.createByName("string/quoted");
}

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
   
SieveString.prototype.toScript
    = function ()
{
  return this.string.toScript();
}


if (!SieveLexer)
  throw "Could not register Strings Elements";

SieveLexer.register2("stringlist","stringlist",SieveStringList); 
SieveLexer.register2("string","string", SieveString);
SieveLexer.register2("string/","string/quoted",SieveQuotedString);
SieveLexer.register2("string/","string/multiline",SieveMultiLineString);