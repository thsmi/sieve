/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */


/*****************************************************************************/

// TODO rename allofAnyOf to SieveTestSection...
// ... and merge with testlist...
// ... implement logic :
//  * zero tests, one test or allof/anyof with one test...
//    ... display only this test...
//  * if it contains more than one test display display the testlist...
//     ... and let the user decide via dropdown if he wants anyof or allof
//

SieveAllOfAnyOf.isAllOfAnyOf
  = function(token)
{
  token = token.substring(0,5).toLowerCase();
  
  if (token.indexOf("allof") == 0)
    return true;
  if (token.indexOf("anyof") == 0)
    return true;

  return false;
}

function SieveAllOfAnyOf(id) 
{
  this.id = id;
  
  this.isAllOf = true;
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");  
  
  this.testList = SieveLexer.createByName("test/testlist");
}

SieveAllOfAnyOf.prototype.init
    = function (data)
{
  // Syntax :
  // <"allof"> <tests: test-list>
  
  if ("allof" == data.substring(0,5).toLowerCase())
    this.isAllOf = true;
  else if ("anyof" == data.substring(0,5).toLowerCase())
    this.isAllOf = false;
  else
    throw "allof or anyof expected but found: \n"+data.substr(0,50)+"...";
  
  data = data.slice(5);
  
  data = this.whiteSpace[0].init(data);
 
  data = this.testList.init(data);
  
  data = this.whiteSpace[1].init(data);
  
  return data;
    
}    

SieveAllOfAnyOf.prototype.onBouble
    = function (type,message)
{
  return this.testList.onBouble(type,message);  
}

SieveAllOfAnyOf.prototype.toString
    = function ()
{
  return (this.isAllOf?"allof":"anyof")
    + this.whiteSpace[0].toString()
    + this.testList.toString()
    + this.whiteSpace[1].toString();
}

SieveAllOfAnyOf.prototype.toXUL
    = function ()
{
  return (this.isAllOf?"all of":"any of")+" the following conditions match"
    + this.testList.toXUL();
}
/******************************************************************************/

SieveNot.isNot
  = function(token)
{ 
  if (token.indexOf("not") == 0)
    return true;

  return false;
}

function SieveNot() 
{
  // first line with deadcode
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");
  
  this.test = null;
}

SieveNot.prototype.init
    = function (data)
{
  // Syntax :
  // <"not"> <tests: test-list>
  
  data = data.slice("not".length);
  
  data = this.whiteSpace[0].init(data);
  
  if (SieveLexer.probeByClass(["test"],data) == false)
    throw "Test command expected but found '"+data.substr(0,50)+"...'";  
  
  this.test = SieveLexer.createByClass(["test"],data);
  data = this.test.init(data);
   
  // TODO implement to all tests an setNot
  // this.test.invertLogic(true);
    
  data = this.whiteSpace[1].init(data); 
  return data;
    
}    

SieveNot.prototype.toString
    = function ()
{
  return "not"
    + this.whiteSpace[0].toString()
    + this.test.toString()
    + this.whiteSpace[1].toString();
}

SieveNot.prototype.toXUL
    = function ()
{
  return " not "+this.test.toXUL();
}

/******************************************************************************/

//<envelope> [COMPARATOR] [ADDRESS-PART] [MATCH-TYPE] 
//  <envelope-part: string-list> <key-list: string-list>

SieveEnvelopeTest.isEnvelopeTest
  = function(token)
{ 
  if (token.indexOf("envelope") == 0)
    return true;
  
  return false;
} 
    
function SieveEnvelopeTest() 
{
  // first line with deadcode
  this.options = new Array(null,null,null);
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");
  this.whiteSpace[2] = SieveLexer.createByName("whitespace");
  this.whiteSpace[3] = SieveLexer.createByName("whitespace");
  this.whiteSpace[4] = SieveLexer.createByName("whitespace");
  this.whiteSpace[5] = SieveLexer.createByName("whitespace");
  
  this.envelopeList = SieveLexer.createByName("stringlist");
  this.keyList = SieveLexer.createByName("stringlist");
}

SieveEnvelopeTest.prototype.init
    = function (data)
{
  data = data.slice("envelope".length);
  data = this.whiteSpace[0].init(data);
  
  for (var i=0; i< 3; i++)
  {
    if (isSieveAddressPart(data))
      this.options[i] = new SieveAddressPart();
    else if (isSieveComparator(data))
      this.options[i] = new SieveComparator();
    else if (isSieveMatchType(data))
      this.options[i] = new SieveMatchType();
    else
      break;
    
    data = this.options[i].init(data);
    data = this.whiteSpace[i+1].init(data);
  }
  
  data = this.envelopeList.init(data);
  
  data = this.whiteSpace[4].init(data);
  
  data = this.keyList.init(data);
    
  data = this.whiteSpace[5].init(data);
  
  return data;
}    

SieveEnvelopeTest.prototype.toString
    = function ()
{
  return "envelope"
    + this.whiteSpace[0].toString()
    + ((this.options[0] != null)?this.options[0].toString():"")
    + ((this.options[0] != null)?this.whiteSpace[1].toString():"")
    + ((this.options[1] != null)?this.options[1].toString():"")
    + ((this.options[1] != null)?this.whiteSpace[2].toString():"")
    + ((this.options[2] != null)?this.options[2].toString():"")
    + ((this.options[2] != null)?this.whiteSpace[3].toString():"")
    + this.envelopeList.toString()
    + this.whiteSpace[4].toString()
    + this.keyList.toString()
    + this.whiteSpace[5].toString();
}

SieveEnvelopeTest.prototype.toXUL
    = function ()
{
  return "envelope - to be implented";
}

/******************************************************************************/


//address [ADDRESS-PART] [COMPARATOR] [MATCH-TYPE]
//             <header-list: string-list> <key-list: string-list>

             
/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
function SieveAddress(id)
{
  this.id = id;  
  this.options = new Array(null,null,null);
  
  this.whiteSpace = []
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");
  this.whiteSpace[2] = SieveLexer.createByName("whitespace");
  this.whiteSpace[3] = SieveLexer.createByName("whitespace");
  this.whiteSpace[4] = SieveLexer.createByName("whitespace");
  this.whiteSpace[5] = SieveLexer.createByName("whitespace");
                
  this.headerList = SieveLexer.createByName("stringlist");
  this.keyList = SieveLexer.createByName("stringlist");
}

SieveAddress.prototype.init
    = function (data)
{
  data = data.slice("address".length);
  data = this.whiteSpace[0].init(data);
  
  for (var i=0; i< 3; i++)
  {
    if (isSieveAddressPart(data))
      this.options[i] = new SieveAddressPart(this.id+"_"+i);
    else if (isSieveComparator(data))
      this.options[i] = new SieveComparator(this.id+"_"+i);
    else if (isSieveMatchType(data))
      this.options[i] = new SieveMatchType(this.id+"_"+i);
    else
      break;
    
    data = this.options[i].init(data);
    data = this.whiteSpace[i+1].init(data);
  }
  
  data = this.headerList.init(data);
  
  data = this.whiteSpace[4].init(data);
  
  data = this.keyList.init(data);
    
  data = this.whiteSpace[5].init(data);
  
  return data;
}    

SieveAddress.prototype.toString
    = function ()
{
  return "address"
    + this.whiteSpace[0].toString()
    + ((this.options[0] != null)?this.options[0].toString():"")
    + ((this.options[0] != null)?this.whiteSpace[1].toString():"")
    + ((this.options[1] != null)?this.options[1].toString():"")
    + ((this.options[1] != null)?this.whiteSpace[2].toString():"")
    + ((this.options[2] != null)?this.options[2].toString():"")
    + ((this.options[2] != null)?this.whiteSpace[3].toString():"")
    + this.headerList.toString()
    + this.whiteSpace[4].toString()
    + this.keyList.toString()
    + this.whiteSpace[5].toString();
}

SieveAddress.prototype.toXUL
    = function ()
{
  return "address - to be implemented";
}

/******************************************************************************/

SieveBoolean.isBoolean
 = function(data)
{
  data = data.substr(0,5).toLowerCase();
  if (data.indexOf("true") == 0)
    return true;
  if (data.indexOf("false") == 0)
    return true;
  
  return false;
}

function SieveBoolean(id) 
{
  // first line with deadcode
  this.id = id;
  this.whiteSpace = SieveLexer.createByName("whitespace");  
  
  this.value = false;
}

SieveBoolean.prototype.init
    = function (data)
{
  var token = data.substr(0,5).toLowerCase();
  
  if (token.indexOf("true") == 0)
  {
    this.value = true
    data = data.slice("true".length);
  }
  
  if (token.indexOf("false") == 0)
  {
    this.value = false;
    data = data.slice("false".length);
  }
  
  data = this.whiteSpace.init(data);
    
  return data;
    
}    

SieveBoolean.prototype.toString
    = function ()
{
  if (this.value)
    return "true"+this.whiteSpace.toString();

  return "false"+this.whiteSpace.toString();    
}

SieveBoolean.prototype.toXUL
    = function ()
{
  if (this.value)
    return  " true ";

  return " false ";
}

/******************************************************************************/
SieveSizeTest.isSizeTest
  = function(token)
{ 
  
  if (token.substr(0,4).toLowerCase().indexOf("size") == 0)
    return true;
  
  return false
}
    
function SieveSizeTest(id) 
{
  this.id = id;
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");  
  this.whiteSpace[2] = SieveLexer.createByName("whitespace");  
  
  this.over = false;
  this.size = new SieveNumber();
}

SieveSizeTest.prototype.init
    = function (data)
{
  // Syntax :
  // <"size"> <":over" / ":under"> <limit: number>
  
  data = data.slice("size".length);
  
  data = this.whiteSpace[0].init(data);
  
  var token = data.substr(0,6).toLowerCase();
  if (token.indexOf(":over") == 0)
  {
    data=data.slice(":over".length)
    this.over = true;
  }
  else if (token.indexOf(":under") == 0)
  {
    data=data.slice(":under".length)    
    this.over = false;
  }
  else 
    throw "Syntaxerror, :under or :over expected";
    
  data = this.whiteSpace[1].init(data);
  data = this.size.init(data);
  data = this.whiteSpace[2].init(data);
  
  return data;
}    

SieveSizeTest.prototype.toString
    = function ()
{
  return "size"
    + this.whiteSpace[0].toString()
    + ((this.over)?":over":":under")
    + this.whiteSpace[1].toString()
    + this.size.toString()
    + this.whiteSpace[2].toString();
}

SieveSizeTest.prototype.onValidate
    = function ()
{
  if (this.domOver.selectedItem.value == ":over")
    this.isOver = true;
  else if (this.domOver.selectedItem.value == ":under")
    this.isOver = false;
  else
    return false;
    
  this.size.setValue(this.domInput.value,this.domUnit.selectedItem.value)
  
  this.domDescription.setAttribute("value",
      "message is "+(this.isOver?"larger":"smaller")+" than "+this.size.toString());
  
  return true;      
}

SieveSizeTest.prototype.toElement
    = function ()
{
  // create read only box...
  var roBox = document.createElement("hbox");
  
  this.domDescription = roBox.appendChild(document.createElement("description"));
  this.domDescription.setAttribute("value",
      "message is "+(this.isOver?"larger":"smaller")+" than "+this.size.toString());
          
  // create edit box...
  var rwBox = document.createElement("vbox").appendChild(document.createElement("hbox"));
  rwBox.setAttribute("align","baseline");
  rwBox.appendChild(document.createElement("description"))
     .setAttribute("value","Message is");

     
  this.domOver = document.createElement("menulist");
  this.domOver.appendChild(document.createElement("menupopup"));
  
  var item = document.createElement("menuitem");  
  item.setAttribute("label","bigger");
  item.setAttribute("value",":over");
  if (this.isOver)
    item.setAttribute("selected","true");
  this.domOver.firstChild.appendChild(item);

  var item = document.createElement("menuitem");
  item.setAttribute("label","smaler");
  item.setAttribute("value",":under");
  if (!this.isOver)
    item.setAttribute("selected","true");
  this.domOver.firstChild.appendChild(item);
  
  rwBox.appendChild(this.domOver);
  
  
  this.domInput = rwBox.appendChild(document.createElement("textbox"));
  this.domInput.setAttribute("value",""+this.size.getValue().number);
  
  this.domUnit = document.createElement("menulist");
  this.domUnit.appendChild(document.createElement("menupopup"));
  
  
  var item = document.createElement("menuitem");  
  item.setAttribute("label","Kilobytes");
  item.setAttribute("value","K");
  if (this.size.getValue().unit == "K")
    item.setAttribute("selected","true");
  this.domUnit.firstChild.appendChild(item);

  var item = document.createElement("menuitem");
  item.setAttribute("label","Megabytes");
  item.setAttribute("value","M");
  if (this.size.getValue().unit == "M")
    item.setAttribute("selected","true");
  this.domUnit.firstChild.appendChild(item);

  var item = document.createElement("menuitem");
  item.setAttribute("label","Gigabytes");
  item.setAttribute("value","G");
  if (this.size.getValue().unit == "G")
    item.setAttribute("selected","true");
  this.domUnit.firstChild.appendChild(item);  
  
  rwBox.appendChild(this.domUnit);
  
  return createEditableTestBox(this.id,roBox,rwBox.parentNode,this);
}

/******************************************************************************/

SieveExists.isExists
  = function(token)
{ 
  if (token.indexOf("exists") == 0)
    return true;
  
  return false;
}
    
function SieveExists(id)
{
  this.id = id;
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");
  
  this.headerNames = SieveLexer.createByName("stringlist");
}

SieveExists.prototype.init
    = function (data)
{
  // Syntax :
  // <"exists"> <header-names: string-list>
  
  data = data.slice("exists".length);
  
  data = this.whiteSpace[0].init(data);
  
  data = this.headerNames.init(data);
    
  data = this.whiteSpace[1].init(data);
  
  return data;
    
}    

SieveExists.prototype.toString
    = function ()
{
  return "exists"
    + this.whiteSpace[0].toString()
    + this.headerNames.toString()
    + this.whiteSpace[1].toString();
}

SieveExists.prototype.toXUL
    = function ()
{
  return " one of the following mailheader exists<html:br/>"
    + this.headerNames.toXUL();
}

/******************************************************************************/

/******************************************************************************/
    
function SieveHeader(id) 
{
  this.id = id;
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");  
  this.whiteSpace[2] = SieveLexer.createByName("whitespace");
  this.whiteSpace[3] = SieveLexer.createByName("whitespace");
  this.whiteSpace[4] = SieveLexer.createByName("whitespace");
  
  this.options = new Array(null,null);
  this.headerNames = new SieveStringList(this.id+"_5");
  this.keyList = new SieveStringList(this.id+"_6");
}

SieveHeader.prototype.init
    = function (data)
{
  // Syntax :
  // <"header"> [COMPARATOR] [MATCH-TYPE] <header-names: string-list> <key-list: string-list>         
  
  data = data.slice("header".length);
  
  data = this.whiteSpace[0].init(data);
  
  if (isSieveComparator(data))
  {
    var element = new SieveComparator();
    data = element.init(data);
    this.options[0] = element;
    
    data = this.whiteSpace[1].init(data)
    
    if (isSieveMatchType(data))
    {
      element = new SieveMatchType(this.id+"_8");
      data = element.init(data);
      this.options[1] = element;
    }
  }  
  else if (isSieveMatchType(data))
  {
    var element = new SieveMatchType(this.id+"_7");
    data = element.init(data);
    this.options[0] = element;
    
    data = this.whiteSpace[1].init(data)

    if (isSieveComparator(data))
    {
      element = new SieveComparator(this.id+"_8");
      data = element.init(data);
      this.options[1] = element;
    }
  }
  data = this.whiteSpace[2].init(data);  
  data = this.headerNames.init(data);
  
  data = this.whiteSpace[3].init(data);
  
  data = this.keyList.init(data);
  
  data = this.whiteSpace[4].init(data);
  
  return data;    
}

SieveHeader.prototype.toString
    = function ()
{
  return "header"
    + this.whiteSpace[0].toString()
    + ((this.options[0] != null)?this.options[0].toString():"")
    + ((this.options[0] != null)?this.whiteSpace[1].toString():"")    
    + ((this.options[1] != null)?this.options[1].toString():"")
    + this.whiteSpace[2].toString()
    + this.headerNames.toString()
    + this.whiteSpace[3].toString()
    + this.keyList.toString()
    + this.whiteSpace[4].toString()
}

SieveHeader.prototype.toXUL
    = function ()
{  
  return "any of the following messageheaders "+this.headerNames.toXUL() 
      + "[casesensitive/insensitive] [matchtype e.g. contains]"
      + " one of the following values "+ this.keyList.toXUL();
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
  this.elements = [];
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
SieveTestList.prototype.init
  = function (data)
{  
  // remove the (
  if (data.charAt(0) != "(")
    throw "Test list expected but found:\n'"+data.substr(0,50)+"'...";
    
  data = data.slice(1);
    
  while (data.charAt(0) != ")")
  {
    if (data.charAt(0) == ",")
      data= data.slice(1);
            
    var element = ["","",""];
    
    if (SieveLexer.probeByName("whitespace",data))
    {
      element[0] = SieveLexer.createByName("whitespace");
      data = element[0].init(data);
    }
    
    if (SieveLexer.probeByClass(["test"],data) == false)
      throw "Test command expected but found:\n'"+data.substr(0,50)+"'...";    
    
    element[1] =  SieveLexer.createByClass(["test"],data)
    data = element[1].init(data);
    
    
    if (SieveLexer.probeByName("whitespace",data))
    {
      element[2] = SieveLexer.createByName("whitespace");
      data = element[2].init(data);
    }
        
    this.elements.push(element);
  }
  
  data = data.slice(1);
  
  return data;
}

SieveTestList.prototype.onBouble
    = function (type,message)
{  
  // TODO Implement addElement and removeElement       
  return [];
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


if (!SieveLexer)
  throw "Could not register Conditional Elements";

with (SieveLexer)
{  
  register("test","test/address",
      function(token) {
        return (token.substr(0,7).toLowerCase().indexOf("address") == 0); }, 
      function(id) {return new SieveAddress(id)});
      
  register("test","test/allofanyof",
      function(token) {return SieveAllOfAnyOf.isAllOfAnyOf(token)}, 
      function(id) {return new SieveAllOfAnyOf(id)});
      
  register("test","test/boolean",
      function(token) {return SieveBoolean.isBoolean(token)}, 
      function(id) {return new SieveBoolean(id)});
  
  register("test","test/envelope",
      function(token) {return SieveEnvelopeTest.isEnvelopeTest(token)}, 
      function(id) {return new SieveEnvelopeTest(id)});
  register("test","test/exists",
      function(token) {return SieveExists.isExists(token)}, 
      function(id) {return new SieveExists(id)});  
  register("test","test/header",
      function(token) {
        return (token.substring(0,6).toLowerCase().indexOf("header") == 0); }, 
      function(id) {return new SieveHeader(id)});  
  register("test","test/not",
      function(token) {return SieveNot.isNot(token)}, 
      function(id) {return new SieveNot(id)});  
  register("test","test/size",
      function(token) {return SieveSizeTest.isSizeTest(token)}, 
      function(id) {return new SieveSizeTest(id)});     
      
  register("test/","test/testlist",
      function(token) {return SieveTestList.isTestList(token)}, 
      function(id) {return new SieveTestList(id)});      
}
