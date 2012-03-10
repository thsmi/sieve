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
  
  this.ws[2] = this._createByName("whitespace","\r\n");  
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
  
  
  data = this.ws[2].init(data);
    
  this._test = this._createByClass(["test","operator"],data);
  data = this._test.init(data);
  
  data = this.ws[0].init(data);
  
  data = SieveBlock.prototype.init.call(this,data);
  
  data = this.ws[1].init(data);
  
  return data;
}

SieveIf.prototype.removeChild
    = function (childId,cascade,stop)
{    
  var elm = SieveBlock.prototype.removeChild.call(this,childId);  
  if (cascade && elm)
    return this;
    
  if (elm)
    return elm;
  
  if (this.test().id() != childId)
    throw "Unknown ChildId";
    
  if (!cascade)
    throw "Use cascade to delete conditions";  
  
  this.test().parent(null);
  this._test = null;
  
  if ((!stop) || (stop.id() != this.id()))
    return this.remove(cascade,stop);
    
  return this;
}

SieveIf.prototype.test
    = function (item)
{
  if (typeof(item) === "undefined")
   return this._test;
     
  if (item.parent())
    throw "test already bound to "+item.parent().id();
     
  // Release old test...
  if(this._test)
    this._test.parent(null);
    
  // ... and bind new test to this node
  this._test = item.parent(this);
  
  return this;
}

SieveIf.prototype.empty 
  = function ()
{
  return (!this._test) ? true : false;    
}


SieveIf.prototype.require
    = function (imports)
{
  SieveElse.prototype.require.call(this,imports);
  this._test.require(imports);
}

SieveIf.prototype.toScript
    = function()
{
  return "if"
    + this.ws[2].toScript() 
    + this._test.toScript() 
    + this.ws[0].toScript()
    + SieveBlock.prototype.toScript.call(this) 
    + this.ws[1].toScript();  
}

SieveIf.prototype.toWidget
    = function ()
{
  return (new SieveIfUI(this));  
}


//****************************************************************************//

function SieveElse(docshell,id)
{
  SieveBlock.call(this,docshell,id);
  this.ws = [];
  this.ws[0] = this._createByName("whitespace","\r\n");
  this.ws[1] = this._createByName("whitespace","\r\n");
}

SieveElse.prototype.__proto__ = SieveBlock.prototype;

SieveElse.isElement
    = function (token)
{
  return (token.substring(0,4).toLowerCase().indexOf("else") == 0)  
}

SieveElse.prototype.init
    = function (data)
{
  data = data.slice("else".length);
    

  data = this.ws[0].init(data);
   
  data = SieveBlock.prototype.init.call(this,data);
  
  data = this.ws[1].init(data); 
  
  return data;
}

SieveElse.prototype.toScript
    = function()
{
  return "else" 
    + this.ws[0].toScript() 
    + SieveBlock.prototype.toScript.call(this) 
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
    = function (childId,cascade,stop)
{
  // should we remove the whole node
  if (typeof (childId) === "undefined")
     throw "Child ID Missing";
  
  if (stop && (stop.id() == this.id()))
    cascade = false;
    
  var elm = SieveBlockBody.prototype.removeChild.call(this,childId,cascade,stop);
  
  //  ... if we endup after delete with just an else, merge it into parent...   
  if ((this.children().length) && (!this.children(0).test))
  {
    // we copy all of our else statements into our parent...
    while (this.children(0).children().length)
      this.parent().append(this.children(0).children(0), this.id());
        
    return this.children(0).remove(cascade,stop);
  }
  

  // If SieveBlockBody cascaded through our parent, it should be null...
  // ... and we are done
  
  // 4. the condition might now be empty
  if (this.parent() && (!this.children().length))
    return this.remove(cascade,stop);

  if (this.parent() && cascade)
    return this;
    

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