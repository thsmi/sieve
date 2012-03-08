/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";

function SieveIf(docshell,id)
{
  SieveElse.call(this,docshell,id);
  this._test = null;  
}

SieveIf.prototype.__proto__ = SieveElse.prototype;

SieveIf.isElement
    = function (token)
{
  return (token.substring(0,2).toLowerCase().indexOf("if") == 0)  
}

SieveIf.prototype.init
    = function (data)
{ 
  data = data.slice("if".length);
  
  this.ws[0] = this._createByName("whitespace");
  data = this.ws[0].init(data);
    
  this._test = this._createByClass(["test","operator"],data);
  data = this._test.init(data);
  
  this.ws[1] = this._createByName("whitespace");
  data = this.ws[1].init(data);
  
  this.block = this._createByName("block/block");
  data = this.block.init(data);
  
  this.ws[2] = this._createByName("whitespace");
  data = this.ws[2].init(data);
  
  return data;
}

SieveIf.prototype.test
    = function (item)
{
  if (typeof(item) === "undefined")
   return this._test;
  
   if (item.parent())
     throw "test already bound to "+item.parent().id();
     
  // Release old test...
  this._test.parent(null);
    
  // ... and bind new test to this node
  this._test = item.parent(this);
  
  return this;
}


SieveIf.prototype.require
    = function (imports)
{
  this.block.require(imports);
  this._test.require(imports);
}

SieveIf.prototype.toScript
    = function()
{
  return "if"
    + this.ws[0].toScript() 
    + this._test.toScript() 
    + this.ws[1].toScript()
    + this.block.toScript() 
    + this.ws[2].toScript();  
}

SieveIf.prototype.toWidget
    = function ()
{
  return (new SieveIfUI(this));  
}


//****************************************************************************//

function SieveElse(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  this.ws = [];
  this.block = this._createByName("block/block");
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
    
  this.ws[0] = this._createByName("whitespace");
  data = this.ws[0].init(data);
    
  data = this.block.init(data);
  
  this.ws[1] = this._createByName("whitespace");
  data = this.ws[1].init(data); 
  
  return data;
}

SieveElse.prototype.require
    = function (imports)
{
  this.block.require(imports);
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
  return (new SieveElseUI(this));  
}

//****************************************************************************//

function SieveCondition(docshell,id) 
{
  SieveBlockBody.call(this,docshell,id);
  
  this.elms[0] = this._createByName("condition/if","if false {\r\n}\r\n"); 
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
  this.elms[0] = this._createByName("condition/if");    
  data = this.elms[0].init(data);
  
  while (data.substring(0,5).toLowerCase().indexOf("elsif") == 0)
  {
    data = data.slice("els".length);
    
    var elm = this._createByName("condition/if");
    data = elm.init(data);
    
    this.elms.push(elm);
    
  }

  if (this._probeByName("condition/else",data))
  {
    var elm = this._createByName("condition/else");
    data = elm.init(data);

    this.elms.push(elm)
  }
  
  return data;
}

SieveCondition.prototype.removeChild
    = function (childId)
{
  // should we remove the whole node
  if (typeof (childId) === "undefined")
     throw "Child ID Missing";
  
  var elm = SieveBlockBody.prototype.removeChild.call(this,childId);
  
  //  ... if we endup after delete with just an else, merge it into parent...   
  if ((this.children().length) && (!this.children(0).test))
  {
    // we copy all of our else statements into our parent...
    while (this.children(0).getBlock().children().length)
      this.parent().append(this.children(0).getBlock().children(0), this.id());
        
    this.children(0).remove();
  }
  
  // 4. the condition might now be empty
  if (this.parent() && (!this.children().length))
    this.remove();
    
  return elm;
}

SieveCondition.prototype.toWidget
    = function ()
{
  return (new SieveConditionUI(this));  
}

SieveCondition.prototype.toScript
    = function ()
{
  var str ="";

  for (var i=0; i<this.elms.length; i++)
  {
    if ((i > 0) && (this.elms[i].test))
      str += "els"
      
    str += this.elms[i].toScript();
  }
    
  return str;  
}


if (!SieveLexer)
  throw "Could not register Conditional Elements";

SieveLexer.register("condition/","condition/if", SieveIf);      
SieveLexer.register("condition/","condition/else", SieveElse);      
SieveLexer.register("condition","condition", SieveCondition);