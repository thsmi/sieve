/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

function SieveIf(id)
{
  SieveElse.call(this,id);
  this.test = null;  
}

SieveIf.prototype.__proto__ = SieveElse.prototype;

SieveIf.isElement
    = function (token)
{
  return (token.substring(0,4).toLowerCase().indexOf("if") == 0)  
}

SieveIf.prototype.init
    = function (data)
{ 
  data = data.slice("if".length);
  
  this.ws[0] = SieveLexer.createByName("whitespace");
  data = this.ws[0].init(data);
    
  this.test = SieveLexer.createByClass(["test"],data);
  data = this.test.init(data);
  
  this.ws[1] = SieveLexer.createByName("whitespace");
  data = this.ws[1].init(data);
  
  this.block = SieveLexer.createByName("block/block");
  data = this.block.init(data);
  
  this.ws[2] = SieveLexer.createByName("whitespace");
  data = this.ws[2].init(data);
  
  return data;
}

SieveIf.prototype.getTest
    = function ()
{
  return this.test;
}

SieveIf.prototype.findParent
    = function(id)
{ 
  if (this.block.id == id)
    return this.block;

  if (this.test.id == id)
    return this.test;
     
  var item = this.block.findParent(id);
  
  if (item)
    return item;
    
  return this.test.findParent(id);
}

SieveIf.prototype.find
    = function(id)
{
  if (this.id == id) 
    return this;
  
  var item = this.block.find(id);
  
  if (item)
    return item;
      
  if (!this.test.find)
    throw "Find missing for"+this.test.toSource();
  return this.test.find(id);
}

SieveIf.prototype.toScript
    = function()
{
  return "if"
    + this.ws[0].toScript() 
    + this.test.toScript() 
    + this.ws[1].toScript()
    + this.block.toScript() 
    + this.ws[2].toScript();  
}

SieveIf.prototype.toWidget
    = function ()
{
  return (new SieveIfUI(this)).getWidget();  
}


//****************************************************************************//

function SieveElse(id)
{
  SieveAbstractElement.call(this,id);
  this.ws = [];
  this.block = SieveLexer.createByName("block/block");
}

SieveElse.prototype.__proto__ = SieveAbstractElement.prototype;

SieveElse.isElement
    = function (token)
{
  return (token.substring(0,4).toLowerCase().indexOf("else") == 0)  
}

SieveElse.prototype.getBlock
    = function ()
{
  return this.block;      
}

SieveElse.prototype.init
    = function (data)
{
  data = data.slice("else".length);
    
  this.ws[0] = SieveLexer.createByName("whitespace");
  data = this.ws[0].init(data);
    
  data = this.block.init(data);
  
  this.ws[1] = SieveLexer.createByName("whitespace");
  data = this.ws[1].init(data); 
  
  return data;
}

SieveElse.prototype.findParent
    = function(id)
{
  if (this.block.id == id)
    return this.block;
  
  return this.block.findParent(id);
}

SieveElse.prototype.find
    = function(id)
{
  if (this.id == id) 
    return this;
  
  return this.block.find(id);
}

SieveElse.prototype.toScript
    = function()
{
  return "else" 
    + this.ws[0].toScript() 
    + this.block.toScript() 
    + this.ws[1].toScript();  
}

SieveElse.prototype.toWidget
    = function ()
{
  return (new SieveElseUI(this)).getWidget();  
}

//****************************************************************************//

function SieveCondition(id) 
{
  SieveBlockBody.call(this,id);
  
  this.elms[0] = SieveLexer.createByName("condition/if","if false {\r\n}\r\n"); 
}

SieveCondition.prototype.__proto__ = SieveBlockBody.prototype;

SieveCondition.isElement
    = function (token)
{
  return SieveIf.isElement(token);
}

SieveCondition.prototype.init
    = function (data)
{ 
  this.elms[0] = SieveLexer.createByName("condition/if");    
  data = this.elms[0].init(data);
  
  while (data.substring(0,5).toLowerCase().indexOf("elsif") == 0)
  {
    data = data.slice("els".length);
    
    var elm = SieveLexer.createByName("condition/if");
    data = elm.init(data);
    
    this.elms.push(elm);
    
  }

  if (SieveLexer.probeByName("condition/else",data))
  {
    var elm = SieveLexer.createByName("condition/else");
    data = elm.init(data);

    this.elms.push(elm)
  }
  
  return data;
}

SieveCondition.prototype.toWidget
    = function ()
{
  return (new SieveConditionUI(this)).getWidget();  
}

SieveCondition.prototype.toScript
    = function ()
{
  var str ="";

  for (var i=0; i<this.elms.length; i++)
  {
    if ((i > 0) && (this.elms[i].getTest))
      str += "els"
      
    str += this.elms[i].toScript();
  }
    
  return str;  
}


if (!SieveLexer)
  throw "Could not register Conditional Elements";

SieveLexer.register2("condition/","condition/if", SieveIf);      
SieveLexer.register2("condition/","condition/else", SieveElse);      
SieveLexer.register2("condition","condition", SieveCondition);