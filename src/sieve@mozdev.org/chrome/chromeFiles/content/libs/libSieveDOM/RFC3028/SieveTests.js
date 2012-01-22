/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */



/******************************************************************************/



/******************************************************************************/

//<envelope> [COMPARATOR] [ADDRESS-PART] [MATCH-TYPE] 
//  <envelope-part: string-list> <key-list: string-list>


    
function SieveEnvelopeTest(id) 
{
  // first line with deadcode
  this.id = id;
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

SieveEnvelopeTest.isElement
  = function(token)
{ 
  return (token.indexOf("envelope") == 0);
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

SieveEnvelopeTest.prototype.toScript
    = function ()
{
  return "envelope"
    + this.whiteSpace[0].toScript()
    + ((this.options[0] != null)?this.options[0].toScript():"")
    + ((this.options[0] != null)?this.whiteSpace[1].toScript():"")
    + ((this.options[1] != null)?this.options[1].toScript():"")
    + ((this.options[1] != null)?this.whiteSpace[2].toScript():"")
    + ((this.options[2] != null)?this.options[2].toScript():"")
    + ((this.options[2] != null)?this.whiteSpace[3].toScript():"")
    + this.envelopeList.toScript()
    + this.whiteSpace[4].toScript()
    + this.keyList.toScript()
    + this.whiteSpace[5].toScript();
}

SieveEnvelopeTest.prototype.toWidget
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

SieveAddress.prototype.toScript
    = function ()
{
  return "address"
    + this.whiteSpace[0].toScript()
    + ((this.options[0] != null)?this.options[0].toScript():"")
    + ((this.options[0] != null)?this.whiteSpace[1].toScript():"")
    + ((this.options[1] != null)?this.options[1].toScript():"")
    + ((this.options[1] != null)?this.whiteSpace[2].toScript():"")
    + ((this.options[2] != null)?this.options[2].toScript():"")
    + ((this.options[2] != null)?this.whiteSpace[3].toScript():"")
    + this.headerList.toScript()
    + this.whiteSpace[4].toScript()
    + this.keyList.toScript()
    + this.whiteSpace[5].toScript();
}

/*SieveAddress.prototype.toWidget
    = function ()
{
  return "address - to be implemented";
}*/

/******************************************************************************/

function SieveBoolean(id) 
{
  // first line with deadcode
  this.id = id;
  this.whiteSpace = SieveLexer.createByName("whitespace");  
  
  this.value = false;
}

SieveBoolean.isElement
 = function(data)
{
  data = data.substr(0,5).toLowerCase();
  if (data.indexOf("true") == 0)
    return true;
  if (data.indexOf("false") == 0)
    return true;
  
  return false;
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

SieveBoolean.prototype.toScript
    = function ()
{
  if (this.value)
    return "true"+this.whiteSpace.toScript();

  return "false"+this.whiteSpace.toScript();    
}

SieveBoolean.prototype.toWidget
    = function ()
{
  if (this.value)
    return  " true ";

  return " false ";
}

/******************************************************************************/    
function SieveSizeTest(id) 
{
  SieveAbstractElement.call(this,id); 
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");  
  this.whiteSpace[2] = SieveLexer.createByName("whitespace");  
  
  this.over = false;
  this.size = SieveLexer.createByName("atom/number");
}

SieveSizeTest.prototype.__proto__ = SieveAbstractElement.prototype;

SieveSizeTest.isElement
  = function(token)
{ 
  return (token.substr(0,4).toLowerCase().indexOf("size") == 0);
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
    this.isOver(true);
  }
  else if (token.indexOf(":under") == 0)
  {
    data=data.slice(":under".length)
    this.isOver(false);
  }
  else 
    throw "Syntaxerror, :under or :over expected";
    
  data = this.whiteSpace[1].init(data);
  data = this.size.init(data);
  data = this.whiteSpace[2].init(data);
  
  return data;
}    

/**
 * Gets and Sets the over operator
 * @param @optional {BOOL} value
 * @return {}
 */
SieveSizeTest.prototype.isOver
    = function (value)
{
  if (typeof(value) === "undefined")
    return this.over;
   
  if (typeof(value) === "string")
    value = ((""+value).toLowerCase() == "true")?  true: false;
    
  return this;
}

SieveSizeTest.prototype.getSize
    = function ()
{
  return this.size;  
} 

SieveSizeTest.prototype.toScript
    = function ()
{
  return "size"
    + this.whiteSpace[0].toScript()
    + ((this.isOver())?":over":":under")
    + this.whiteSpace[1].toScript()
    + this.getSize().toScript()
    + this.whiteSpace[2].toScript();
}

SieveSizeTest.prototype.toWidget
    = function ()
{
  // TODO REMOVE THE GET(0)...
  return (new SieveSizeTestUI(this)).getWidget().get(0);      
}

/******************************************************************************/
  
function SieveExists(id)
{
  this.id = id;
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");
  
  this.headerNames = SieveLexer.createByName("stringlist");
}

SieveExists.isElement
  = function(token)
{ 
  return (token.indexOf("exists") == 0);
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

SieveExists.prototype.toScript
    = function ()
{
  return "exists"
    + this.whiteSpace[0].toScript()
    + this.headerNames.toScript()
    + this.whiteSpace[1].toScript();
}

/*SieveExists.prototype.toWidget
    = function ()
{
  return " one of the following mailheader exists<html:br/>"
    + this.headerNames.toWidget();
}*/

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

SieveHeader.prototype.toScript
    = function ()
{
  return "header"
    + this.whiteSpace[0].toScript()
    + ((this.options[0] != null)?this.options[0].toScript():"")
    + ((this.options[0] != null)?this.whiteSpace[1].toScript():"")    
    + ((this.options[1] != null)?this.options[1].toScript():"")
    + this.whiteSpace[2].toScript()
    + this.headerNames.toScript()
    + this.whiteSpace[3].toScript()
    + this.keyList.toScript()
    + this.whiteSpace[4].toScript()
}

SieveHeader.prototype.toWidget
    = function ()
{  
  var elm = document.createElement("div");
  elm.setAttribute("value",
      "any of the following messageheaders "+this.headerNames.toWidget() 
      + "[casesensitive/insensitive] [matchtype e.g. contains]"
      + " one of the following values "+ this.keyList.toWidget());
      
   return elm;
}

if (!SieveLexer)
  throw "Could not register Conditional Elements";

SieveLexer.register("test","test/address",
      function(token) {
        return (token.substr(0,7).toLowerCase().indexOf("address") == 0); }, 
      function(id) {return new SieveAddress(id)});
      
SieveLexer.register2("test","test/boolean",SieveBoolean);
  
SieveLexer.register2("test","test/envelope",SieveEnvelopeTest);
SieveLexer.register2("test","test/exists",SieveExists);  
SieveLexer.register("test","test/header",
      function(token) {
        return (token.substring(0,6).toLowerCase().indexOf("header") == 0); }, 
      function(id) {return new SieveHeader(id)});  
SieveLexer.register2("test","test/size",SieveSizeTest);     
