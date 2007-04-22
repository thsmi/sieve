/*
 * This file defines the structure for all atomar sieve elements like
 *   - Strings
 *   - Numbers
 *   - Tests
 *   - Actions
 */
 

function SieveObject()
{
}

SieveObject.prototype.parse
  = function (data)
{
  return data;
}

SieveObject.prototype.toString
  = function ()
{
  return "";
}

SieveObject.prototype.toXUL
  = function ()
{
  return "";  
}

/******************************************************************************/
function isSieveSemicolon(data)
{
  if (data.charAt(0) != ";")
    return false;
  
  return true;
}

/******************************************************************************/

function isSieveBracketComment(data)
{
  if (data.charAt(0) != "/")
    return false;
    
  if (data.charAt(1) != "*")
    return false;
  
  return true;
}

function SieveBracketComment() 
{
  this.text = "";
}

SieveBracketComment.prototype.parse
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

SieveBracketComment.prototype.toString
    = function ()
{
  return "/*"+this.text+"*/";
}

SieveBracketComment.prototype.toXUL
    = function ()
{
  return ""; 
}

/******************************************************************************/

function isSieveHashComment(data, index)
{
  if (index == null)
    index = 0;
    
  if (data.charAt(index) != "#")
    return false;

  return true;
}

function SieveHashComment(id) 
{
  this.id = id;
  this.text = "";
}

SieveHashComment.prototype.parse
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

SieveHashComment.prototype.getID
    = function ()
{
  return this.id;
}

SieveHashComment.prototype.toString
    = function ()
{
  return "#"+this.text+"\r\n";
}

SieveHashComment.prototype.toXUL
    = function ()
{
  // this element is invisible in XUL
  return "";
}



/******************************************************************************/

function isSieveWhiteSpace(data, index)
{
  if (index == null)
    index = 0;
  var ch = data.charAt(index);
  
  if (ch == " ")
    return true;
  if (ch == "\t")
    return true;
  if (ch == "\r")
    return true;
  if (ch == "\n")
    return true;
    
  return false;
}

function SieveWhiteSpace(id)
{
  this.id = id;
  this.whiteSpace = "";
}

SieveWhiteSpace.prototype.parse
    = function (data)
{
  var i;
  
  for (i=0; i<data.length; i++)
  {
    var ch = data.charAt(i);
    if (ch == " ")
      continue;
    if (ch == "\t")
      continue;
    if (ch == "\r")
      continue;
    if (ch == "\n")
      continue;
    
    break;
  }

  this.whiteSpace = data.slice(0,i);
  
  return data.slice(i);  
}

SieveWhiteSpace.prototype.getID
    = function ()
{
  return this.id;
}

SieveWhiteSpace.prototype.toString
    = function ()
{
  return this.whiteSpace;
}

SieveWhiteSpace.prototype.toXUL
    = function ()
{
  // whitespaces do nothing in xul 
  return "";
}

/******************************************************************************/
/******************************************************************************/


SieveDeadCode.isDeadCode
  = function (data, index)
{
  if (index == null)
    index = 0;
  
  if (isSieveWhiteSpace(data,index))
    return true;
  if (isSieveBracketComment(data,index))
    return true;
  if (isSieveHashComment(data,index))
    return true;
  
  return false;  
}

function SieveDeadCode(id)
{
  this.id = id;
  this.elements = new Array();
}

SieveDeadCode.prototype.parse
    = function(data)
{
  while(true)
  {
    var id = this.id+"_"+this.elements.length;
    var element = null;
    
    if (isSieveWhiteSpace(data))
      element = new SieveWhiteSpace(id);
    else if (isSieveBracketComment(data))
      element = new SieveBracketComment(id);
    else if (isSieveHashComment(data))
      element = new SieveHashComment(id);
    else
      return data;
    
    data = element.parse(data);
    this.elements.push(element);
  }
}

SieveDeadCode.prototype.getID
    = function ()
{
  return this.id;
}

SieveDeadCode.prototype.toString
    = function()
{
  var str = "";
  for (var i=0; i<this.elements.length; i++)
  {
    str += this.elements[i].toString();
  }
  return str;
}
    
SieveDeadCode.prototype.toXUL
    = function()
{
  return "";
}

SieveDeadCode.prototype.onMessage
    = function (id,message)
{
  // do nothing, because deadcode can't receive messages
}

SieveDeadCode.prototype.onBouble  
    = function (message)
{
  // do nothing, because deadcode can't receive messages
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
  if (SieveQuotedString.isQuotedString(data))
    return true;
  if (SieveMultiLineString.isMultiLineString(data))
    return true;
    
  return false;
}
// PUBLIC:
SieveString.prototype.parse
    = function (data)    
{
  if (SieveQuotedString.isQuotedString(data))
    this.string = new SieveQuotedString();
  else if (SieveMultiLineString.isMultiLineString(data))
    this.string = new SieveMultiLineString();
  else
    throw "Syntaxerror: String expected";
    
  return this.string.parse(data);    
}

SieveString.prototype.getValue
    = function ()
{
  return this.string.getValue();
} 
   
SieveString.prototype.toString
    = function ()
{
  return this.string.toString();
}

SieveString.prototype.toXUL
    = function ()
{
  // TODO a single ' crashes in html -> convert it into &...; syntax
  return "<html:input type='text' value='"+this.string.getValue()+"' />";  
}

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
SieveMultiLineString.prototype.parse
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
  
  if (isSieveHashComment(data))
  {
    this.hashComment = new SieveHashComment();
    data = this.hashComment.parse(data);
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

SieveMultiLineString.prototype.toXUL
    = function ()
{
  return "MultilineString - to be implemented";
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
SieveQuotedString.prototype.parse
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

SieveQuotedString.prototype.toString
    = function ()
{
  return "\""+this.text+"\"";
}

SieveQuotedString.prototype.toXUL
    = function ()
{
  return "QuotedString - to be implemented";
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
  if (SieveQuotedString.isQuotedString(data))
    return true;  

  return false;
}

// PUBLIC:
SieveStringList.prototype.parse
    = function (data)
{
  if (SieveQuotedString.isQuotedString(data))
  {
    this.compact = true;
    
    this.elements[0] = new SieveQuotedString();
    return this.elements[0].parse(data);
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
        
    if (SieveDeadCode.isDeadCode(data))
    {
      element[0] = new SieveDeadCode();
      data = element[0].parse(data);
    }
      
    if (SieveQuotedString.isQuotedString(data) == false)
      throw "Quoted String expected";
    
    element[1] = new SieveQuotedString();
    data = element[1].parse(data);
         
      
    if (SieveDeadCode.isDeadCode(data))
    {
      element[2] = new SieveDeadCode();
      data = element[0].parse(data);
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
      SieveTestList implements SieveObject
    
    CONSTUCTOR:
      public SieveTestList()

    PUBLIC FUNCTIONS:      
      public static boolean isTestList(String data)
      public boolean parse(String data) throws Exception
      public String toString()
      public String toXUL()

    MEMBER VARIABLES: 
      private Array[] elements;

    DESCRIPTION: 
      A Testlist is an array of SieveTests. 
                   
      Syntax : 
        test-list = (" test *("," test) ")"
        
      Example :
        anyof (not exists ["From", "Date"],
             header :contains "from" "fool@example.edu")
      
*******************************************************************************/


// CONSTRUCTOR:
function SieveTestList(size)
{  
  this.elements = new Array();
}

// PUBLIC STATIC:
SieveTestList.isTestList
  = function (data)
{
  if (data.charAt(0) == "(")
    return true;
    
  return false;
}

// PUBLIC:
SieveTestList.prototype.parse
  = function (data)
{  
  // remove the (
  data = data.slice(1);
		
  while (true)
  {
    if (data.charAt(0) == ")")
      return data.slice(1);
      
    if (data.charAt(0) == ",")
    {      
      data = data.slice(1);
      continue;
    }
            
    var element = new Array("","","");
    
    if (SieveDeadCode.isDeadCode(data))
    {
      element[0] = new SieveDeadCode();
      data = element[0].parse(data);
    }
    
    if (SieveTest.isTest(data) == false)
    {
      alert(data);
      throw "Test expression expected";
    } 

    
    var parser = new SieveTest(data);
    element[1] = parser.extract();
    data = parser.getData();
    
    if (SieveDeadCode.isDeadCode(data))
    {
      element[2] = new SieveDeadCode();
      data = element[2].parse(data);
    }
        
    this.elements.push(element);
  }
  
}

SieveTestList.prototype.toString
    = function ()
{          
  var result = "(";
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
  result += ")";
  
  return result;   
}

SieveTestList.prototype.toXUL
    = function ()
{
  var result = "";
  for (var i = 0; i<this.elements.length; i++)
  {    
    result += this.elements[i][1].toXUL();
    result += "<html:br />";
  }
  return result;
}

/*******************************************************************************
    CLASSNAME: 
      SieveTestParser implements SieveParser
    
    CONSTUCTOR:
      public SieveTestParser(String data)

    PUBLIC FUNCTIONS:      
      public static boolean isTest(String data, int index)
      public static void registerTest(String id, String classname)
      public Object extract() throws Exception
      public String getData()

    MEMBER VARIABLES: 
      private String data;

    DESCRIPTION: 
      This Wrapper class converts a Sting into a SieveTest Object. The function
      isTest() probes wether a String contains a SieveTest Object or not. This
      Object can be extracted by calling the extract(). After calling extract,
      you can retrive the data String via getData(). This will return the String
      passed to the constructor minus the extracted Object(s).
      
      !!! All SieveTest have to register via registerTest() !!!
                   
      
*******************************************************************************/


// CONSTRUCTOR:
function SieveTest(data)
{
  this.data = data;
}

// PRIVATE STATIC:
SieveTest.tests = new Object(); //contains all registered Tests

// PUBLIC STATIC:
SieveTest.isTest
  = function(data, index)
{  
  if (index == null)
    index = 0;
    
  var token = data.substr(index,10).toLowerCase();
  
  for (var key in SieveTest.tests)
  {
    if (SieveTest.tests[key].onProbe(token))
      return true;
  }

  return false;
}

SieveTest.register
  = function(id,classname,onProbe)
{ 
  if (onProbe == null)
    throw "Error, Probefunction in "+id+" missing";
    
  SieveTest.tests[id] = new Object();
  SieveTest.tests[id].classname = classname;
  SieveTest.tests[id].onProbe = onProbe;
}

// PUBLIC:
SieveTest.prototype.extract
    = function ()
{
  var element = null;
  var token = this.data.substr(0,10).toLowerCase();
  
  for (var key in SieveTest.tests)
  {        
    if (SieveTest.tests[key].onProbe(token) != true)
      continue;
    
    element = eval("new "+SieveTest.tests[key].classname+"()");
    break;
  }
  
  if (element == null)
    throw " :... - Sieve Test expected";
     
  this.data = element.parse(this.data);
  
  return element;
}    

SieveTest.prototype.getData
   = function()
{
  return this.data; 
} 

/******************************************************************************/

// DEFINE A STATIC VARIABLE WITH ALL POSSIBLE ACTION PARSERS
SieveAction.actions = new Object();

// STATIC FUNCTIONS WHERE NEW PARSERS CAN REGISTER...
SieveAction.register
  = function(id,classname,onProbe)
{
  if (onProbe == null)
    throw "Error, Probefunction in "+id+" missing";
      
  SieveAction.actions[id] = new Object();
  SieveAction.actions[id].classname = classname;
  SieveAction.actions[id].onProbe = onProbe;  
}

SieveAction.isAction
  = function(data, index)
{  
  if (index == null)
    index = 0;
    
  var token = data.substr(index,10).toLowerCase();
  
  for (var key in SieveAction.actions)
  {          
    if (SieveAction.actions[key].onProbe(token))
      return true;      
  }

  return false;  
}

function SieveAction(data,id)
{
  this.data = data;
  this.id = id;
}


SieveAction.prototype.extract
    = function()
{
  var element = null;
  // in order to speed up the comparison ...
  // ... we extract the first 10 characters...
  // ... and compare only that token.  
  var token = this.data.substr(0,10).toLowerCase()

  for (var key in SieveAction.actions)
  {        
    // the != true is important. Void is not equal to false with == false
    // onProbe with a missing return would be considered as true.
    if (SieveAction.actions[key].onProbe(token) != true)
      continue;
    
    element = eval("new "+SieveAction.actions[key].classname+"('"+this.id+"_0')");
  }
  
/*  if (token.indexOf("discard") == 0)
    element = new SieveDiscard(this.id+"_0"); 
  else if (token.indexOf("require") == 0)
    element = new SieveRequire(this.id+"_0");
  else if (token.indexOf("keep") == 0)
    element = new SieveKeep(this.id+"_0");
  else if (token.indexOf("stop") == 0)
    element = new SieveStop(this.id+"_0");
  else if (token.indexOf("redirect") == 0)    
    element = new SieveRedirect(this.id+"_0");
  else if (token.indexOf("fileinto") == 0)
    element = new SieveFileInto(this.id+"_0");
  else if (token.indexOf("reject") == 0)
    element = new SieveReject(this.id+"_0");
  else if (token.indexOf("setflag") == 0)
    element = new SieveSetFlag(this.id+"_0");
  else if (token.indexOf("addflag") == 0)
    element = new SieveAddFlag(this.id+"_0");
  else if (token.indexOf("removeflag") == 0)
    element = new SieveRemoveFlag(this.id+"_0");*/

  if (element == null)
    throw "Syntax error, Sieve Action Statement expected";
        
  this.data = element.parse(this.data);    

  return element;
}

SieveAction.prototype.getData
    = function()
{
  return this.data;
}

/******************************************************************************/

function SieveNumber(id)
{
  this.id = id
  this.number = "1";
  this.unit = null;
}

SieveNumber.isNumber
  = function (data,index)
{
  if (index == null)
    index = 0;
    
  if (isNaN(data.charAt(index)))
    return false;
  
  return true;
}

SieveNumber.prototype.parse
    = function(data)
{
  var i
  
  for (i=0; i<data.length; i++)
  {
    if (SieveNumber.isNumber(data,i))
      continue;
    
    break;
  }

  this.number = data.slice(0,i);  
  data = data.slice(i); 
  
  var ch = data.charAt(0).toUpperCase();

  if ((ch == 'K') ||  (ch == 'M') || (ch == 'G'))
  {
    this.unit = data.slice(0,1);
    data = data.slice(1);
  }
  
  return data;
}

SieveNumber.prototype.getID
    = function ()
{
  return this.id;
}

SieveNumber.prototype.toString
    = function ()
{
  return this.number
    +((this.unit==null)?"":this.unit);
}

SieveNumber.prototype.toXUL
    = function ()
{
  return "<html:div class='SieveNumber'>"
    + "  <html:input type='text' value='"+this.number+"' />"
    + "  <html:select>"
    + "    <html:option "+((this.unit.toUpperCase()=="K")?"selected='true'":"")+">"
    + "      Kilobytes"
    + "    </html:option>"
    + "    <html:option "+((this.unit.toUpperCase()=="M")?"selected='true'":"")+">"
    + "      Megabytes"
    + "    </html:option>"
    + "    <html:option "+((this.unit.toUpperCase()=="G")?"selected='true'":"")+">"
    + "      Gigabytes" 
    + "    </html:option>"
    + "  </html:select>"
    + "</html:div>";
}

/******************************************************************************/