/******************************************************************************/


  // Syntax :
  // <"if"> <test> <block>
  // <"elsif"> <test> <block>  
  // <"else"> <block>


// TODO:
//  * ein Element, dass die Bedingung, und den Block enthält
//  * eine "Überklasse" die die Bedingungen verwaltet, also if, else 
//    und elsif davor setzt
//  * eine Extra block klasse ist überflüssig...

function SieveCondition(id)
{
  this.id = id;
  this.element 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveObject /*placeholder for test*/,
                new SieveDeadCode(this.id+"_2"),
                new SieveBlock(this.id+"_3"),
                new SieveDeadCode(this.id+"_4"));
}

SieveCondition.prototype.parse
  = function (data)
{
  // ... remove the deadcode ...
  data = this.element[0].parse(data);
              
  if (SieveTest.isTest(data))
  {
    // ...then extract the test...
    var parser = new SieveTest(data,this.id+"_1");
    this.element[1] = parser.extract();  
    data = parser.getData();
  
    // ... eat again the deadcode ...
    data = this.element[2].parse(data);
  }
  
  if (SieveBlock.isBlock(data) == false)
    throw "{ expected...";
    
  // ... finally read the block.
  data = this.element[3].parse(data);  
  
  data = this.element[4].parse(data);
  
  return data;  
}

SieveCondition.toString
  = function ()
{
  var str = "";
  for (var i=0; i<this.element.length;i++)
  {
    str += this.element[i].toString();
  }
  return str;  
}

SieveCondition.toXUL
  = function ()
{
  return 
    + this.element[1].toXUL()
    + " then"
    + this.element[3].toXUL(); 
}




SieveIf.isIf
  = function (data)
{
  if (data.toLowerCase().indexOf("if") == 0)
    return true;
  
  return false;
}

function SieveIf(id) 
{ 
  this.id = id;
  this.elements = new Array();
}

/*
 if header :contains "from" "coyote" {
    discard;
 } elsif header :contains ["subject"] ["$$$"] {
    discard;
 } else {
    fileinto "INBOX";
 }
 */

SieveCondition2.prototype.parse
    = function (data)
{  
  var element = new SieveIf(this.id+"_0")
  data = element.parse(data);
  this.elements.push(element);
  
  while (true)
  {  
    var id = this.id+"_"+this.elements.length;
    
    if (SieveDeadCode.isDeadCode(data))
      element = new SieveDeadCode(id)
    else if (SieveElsIf.isElsIf(data))
      element = new SieveElsIf(id);
    else break;

    data = element.parse(data);
    this.elements.push(element);
  }
  
  if (SieveElse.isElse(data))
  {
    var id = this.id+"_"+this.elements.length;
    element = new SieveElse();

    data = element.parse(data);
    this.elements.push(element);    
  }
  
  return data;  
}

SieveCondition2.prototype.getID
    = function ()
{
  return this.id;
}

SieveCondition2.prototype.toString
    = function ()
{
  var str = "";
  for (var i=0; i<this.elements.length;i++)
  {
    str += this.elements[i].toString();
  }
  return str;
}

SieveCondition2.prototype.toXUL
    = function ()
{
  var xul = "";
  for (var i=0; i<this.elements.length;i++)
  {
    xul += this.elements[i].toXUL();
  }
  return xul;
}

/******************************************************************************/

SieveIf.isIf
  = function(data)
{
  if (data.toLowerCase().indexOf("if") == 0)
    return true;
  
  return false;
}

function SieveIf(id) 
{
  this.id = id;
  this.elements = new Array();
}

/*
 if header :contains "from" "coyote" {
    discard;
 } elsif header :contains ["subject"] ["$$$"] {
    discard;
 } else {
    fileinto "INBOX";
 }
 */

SieveIf.prototype.parse
    = function (data)
{
  
  // Syntax :
  // <"if"> <test> <block>
  // <"elsif"> <test> <block>  
  // <"else"> <block>

  // remove the "if"...
  data = data.slice(2);
  
  var element = new SieveCondition(this.id+"_"+this.elements.length);
  data = element.parse(data);
  this.elements.push(element);
  // now read the elsif block...
  while (data.toLowerCase().indexOf("elsif") == 0)
  {
    // remove the elsif...
    data = data.slice(5);
    var element = new SieveCondition(this.id+"_"+this.elements.length);
    data = element.parse(data);
    this.elements.push(element);        
  }
   
  if (data.toLowerCase().indexOf("else") == 0)
  {
    data = data.slice(4);
    var element = new SieveCondition(this.id+"_"+this.elements.length);
    data = element.parse(data);
    this.elements.push(element); 
  }
  
  return data;
}

SieveIf.prototype.getID
    = function ()
{
  return this.id;
}

SieveIf.prototype.toString
    = function ()
{  
  if (this.elements[1].length == 0)
    return "";
  
  var str = "if" + this.element[1].toString();
  
  for (var i=1; i<this.element.length;i++)
  {
    if this.element[i]
    str += this.element[i].toString();
  }
  return str;     
}

SieveIf.prototype.toXUL
    = function ()
{
  return "if "
    + this.test.toXUL()
    + " then "
    + this.block.toXUL();  
}

/******************************************************************************/

SieveElsIf.isElsIf
  = function(data)
{
  if (data.toLowerCase().indexOf("elsif") == 0)
    return true;
  
  return false;
}

function SieveElsIf(id) 
{
  this.id = id
  this.test = null;
  this.block = new SieveBlock(this.id+"_3");
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));
}

/*
 if header :contains "from" "coyote" {
    discard;
 } elsif header :contains ["subject"] ["$$$"] {
    discard;
 } else {
    fileinto "INBOX";
 }
 */

SieveElsIf.prototype.parse
    = function (data)
{
  // Syntax:
  // <"elsif"> <test> <block>
  
  // remove the elsif...
  data = data.slice(5);

  // ... remove the deadcode ...
  data = this.whiteSpace[0].parse(data);
              
  // ...then extract the test...
  var parser = new SieveTest(data,this.id+"_1");
  this.test = parser.extract();  
  data = parser.getData();
  
  // ... eat again the deadcode ...
  data = this.whiteSpace[1].parse(data);
    
  // ... finally read the block.
  data = this.block.parse(data);
   
  return data;
}

SieveElsIf.prototype.getID
    = function ()
{
  return this.id; 
}

SieveElsIf.prototype.toString
    = function ()
{
  return "elsif"
    + this.whiteSpace[0].toString()
    + this.test.toString()
    + this.whiteSpace[1].toString()
    + this.block.toString();
}

SieveElsIf.prototype.toXUL
    = function ()
{
  return "else if"
    + this.test.toXUL()
    + " then"
    + this.block.toXUL();   
}

/******************************************************************************/


SieveElse.isElse
 = function (data)
{
  if (data.toLowerCase().indexOf("else") == 0)
    return true;
  
  return false;
}

function SieveElse(id) 
{
  this.id = id;
  this.block = new SieveBlock(this.id+"_1");
  this.whiteSpace = new SieveDeadCode(this.id+"_0");

}

/*
 if header :contains "from" "coyote" {
    discard;
 } elsif header :contains ["subject"] ["$$$"] {
    discard;
 } else {
    fileinto "INBOX";
 }
 */

SieveElse.prototype.parse
    = function (data)
{
  // remove the else...
  data = data.slice(4);
                
  // ... eat the deadcode between the else and the block...
  data = this.whiteSpace.parse(data);
    
  // ... finally read the block.
  data = this.block.parse(data);
  
  return data;
}

SieveElse.prototype.getID
    = function ()
{
  return this.id;
}

SieveElse.prototype.toString
    = function ()
{
  return "else"
    + this.whiteSpace.toString()
    + this.block.toString();
}

SieveElse.prototype.toXUL
    = function ()
{
  return "else"
    + this.block.toXUL(); 
}

/******************************************************************************/

// A block are mandatory after an if, elsif, or else. They can't be used anywher else

SieveBlock.isBlock
  = function (data,index)
{
  if (index == null)
    index = 0;
    
  if (data.charAt(index) == "{")
    return true;
    
  return false;
}

function SieveBlock(id)
{
  this.id = id;
  this.element = new SieveElement(this.id+"_0");  
}

SieveBlock.prototype.parse
    = function (data)
{
  if (SieveBlock.isBlock(data) == false)
    throw " \"{\" expected";
    
  // remove the "/*"
  data = data.slice(1);
  
  data = this.element.parse(data);  
  
  if (data.charAt(0) != "}")
    throw " \"}\" expected";

  // remove the }
  data = data.slice(1);
  return data;
}

SieveBlock.prototype.getID
    = function ()
{
  return this.id;
}

SieveBlock.prototype.toString
    = function ()
{
  return "{"
    + this.element.toString()
    + "}";
}

SieveBlock.prototype.toXUL
    = function ()
{
  return this.element.toXUL();
}

SieveBlock.prototype.onMessage
    = function (id,message)
{
  if (this.element.getID() != id[0])
    return ;
  
  id.shift();  
  this.element.onMessage(id,data);
}

SieveBlock.prototype.onBouble  
    = function (message)
{
  this.element.onBouble(message);
}

SieveAction.register("condition","SieveCondition",SieveCondition.isCondition);