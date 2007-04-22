/******************************************************************************/

function isSieveIf(data)
{
  if (data.toLowerCase().indexOf("if") == 0)
    return true;
  
  return false;
}

function SieveIf(id) 
{
  this.id = id;
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

SieveIf.prototype.parse
    = function (data)
{
  // Syntax :
  // <"if"> <test> <block>
  
  // remove the "if"...
  data = data.slice(2);

  // ... remove the deadcode ...
  data = this.whiteSpace[0].parse(data);
              
  // ...then extract the test...
  var parser = new SieveTestParser(data,this.id+"_1");
  this.test = parser.extract();  
  data = parser.getData();
  
  // ... eat again the deadcode ...
  data = this.whiteSpace[1].parse(data);
    
  // ... finally read the block.
  data = this.block.parse(data);
   
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
  return "if"
    + this.whiteSpace[0].toString()
    + this.test.toString()
    + this.whiteSpace[1].toString()
    + this.block.toString();
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

function isSieveElsIf(data)
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
  var parser = new SieveTestParser(data,this.id+"_1");
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


function isSieveElse(data)
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