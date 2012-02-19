/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";

function SieveBlock(id)
{
  SieveBlockBody.call(this,id);
}

SieveBlock.prototype.__proto__ = SieveBlockBody.prototype;

SieveBlock.isElement
    = function (data)
{
  return (data.charAt(0) == "{");  
}

SieveBlock.prototype.init
  = function (data)
{ 
  if (data.charAt(0) != "{") 
    throw " { expected but found:\n"+data.substr(0,50)+"..."
    
  data = data.slice(1);
  
  data = SieveBlockBody.prototype.init.call(this,data);

  if (data.charAt(0) != "}") 
    throw " } expected but found:\n"+data.substr(0,50)+"...";  

  data = data.slice(1);
  
  return data;
}

SieveBlock.prototype.toScript
  = function (data)
{
  return "{" +SieveBlockBody.prototype.toScript.call(this)+"}";
}
//****************************************************************************//
// TODO rename to SieveCommands

function SieveBlockBody(id)
{
  SieveAbstractElement.call(this,id);
  
  // Initialize Block Elements
  this.elms = [];
}

SieveBlockBody.prototype.__proto__ = SieveAbstractElement.prototype;

SieveBlockBody.isElement
    = function (data)
{
  return SieveLexer.probeByClass(["action","condition","whitespace"],data);  
}

SieveBlockBody.prototype.init
    = function (data)    
{
  while (SieveLexer.probeByClass(["action","condition","whitespace"],data))
  {
    var elm = SieveLexer.createByClass(["action","condition","whitespace"],data);    
    data = elm.init(data);
    
    this.elms.push(elm);    
  }
 
  return data;
}

SieveBlockBody.prototype.children
    = function (idx)
{
  if (typeof(idx) === "undefined")
    return this.elms;  
    
  if ((typeof(idx) === "string")  && (idx.toLowerCase() == ":last"))
    idx = this.elms.length-1;    
    
  return this.elms[idx];
}

SieveBlockBody.prototype.toScript
    = function ()
{
  var str ="";

  for (var key in this.elms)
    str += this.elms[key].toScript();
    
  return str;
}

SieveBlockBody.prototype.toWidget
    = function ()
{
  return (new SieveBlockUI(this)).getWidget();
}

SieveBlockBody.prototype.findParent
    = function (id)
{
  // is it a direct hit?
  for (var i=0; i<this.elms.length; i++)
    if (this.elms[i].id == id)
      return this;
  
  // no so we have to ask our child nodes
  var item = null;
  for (var i=0; i<this.elms.length; i++)
  {     
    item = this.elms[i].findParent(id);
    
    if (item)
      break; 
  }
  
  return item;     
}

SieveBlockBody.prototype.find
    = function (id)
{ 
  if (this.id == id)
    return this;

    
  var item = null;
  
  // crawl throug all child elements
  for (var i=0; i<this.elms.length; i++)
  {     
    item = this.elms[i].find(id);
    
    if (item)
      break;
  }
  
  return item;
}

SieveBlockBody.prototype.append
    = function (elm, siblingId)
{

  // the id matches, so we have to do the work
  if ((!siblingId) || (siblingId < 0))
  {
    this.elms[this.elms.length] = elm; 
    return this;
  }
 
  for (var i=0; i<this.elms.length; i++)
  {
    if (this.elms[i].id != siblingId)
      continue;
    
    this.elms.splice(i,0,elm);
    return this;
  }
  
  // we did not manage to add the element...
  return null;
}

SieveBlockBody.prototype.remove
    = function (childId)
{
  var elm = null;
  // Is it a direct match?
  for (var i=0; i<this.elms.length; i++)
  {
    if (this.elms[i].id != childId)
      continue;
    
    elm = this.elms[i];
    this.elms.splice(i,1);
    
    break;
  }
    
  return elm;
}

SieveBlockBody.prototype.require
    = function (imports)
{
  for (var i=0; i<this.elms.length; i++)
    this.elms[i].require(imports)
}

if (!SieveLexer)
  throw "Could not register Block Elements";

SieveLexer.register2("block/","block/body",SieveBlockBody);
SieveLexer.register2("block/","block/block",SieveBlock);
