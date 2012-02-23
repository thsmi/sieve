/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";

function SieveBlock(docshell,id)
{
  SieveBlockBody.call(this,docshell,id);
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

function SieveBlockBody(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  
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
  while (this._probeByClass(["action","condition","whitespace"],data))
  {
    var elm = this._createByClass(["action","condition","whitespace"],data);    
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

/**
 * Appends an Element to this Element. Inf the element is alread existant, it will be moved
 * 
 * @param {} elm
 *   the element that should be appened
 * @param @optional {int} siblingId
 *   defines the sibling after which the new element should be inserted. 
 *   In case no matching sibling is found, it will be appended at the end.
 * @return {}
 */
SieveBlockBody.prototype.append
    = function (elm, siblingId)
{
  // we have to do this fist as there is a good chance the the index
  // might change after deleting...
  if(elm.parent())
    elm.remove();
  
  var idx = this.elms.length;
  
  if ((typeof(siblingId) !== "undefined") && (siblingId >= 0)) 
    for (var idx = 0; idx<this.elms.length; idx++)
      if (this.elms[idx].id() == siblingId)
        break;

  this.elms.splice(idx,0,elm);
  elm.parent(this);
    
  return this;
}

// TODO Merge with "remove" when its working as it should
/**
 * Removes the node including all child elements.
 * 
 * To remove just a child node pass it's id as an argument
 * 
 *  @param @optional {int} childId
 *  the child id which should be removed.
 *    
 * @return {}
 */
SieveBlockBody.prototype.removeChild
    = function (childId)
{
  // should we remove the whole node
  if (typeof (childId) === "undefined")
     throw "Child ID Missing";
    //return SieveAbstractElement.prototype.remove.call(this);
  
  // ... or just a child item
  var elm = null;
  // Is it a direct match?
  for (var i=0; i<this.elms.length; i++)
  {
    if (this.elms[i].id() != childId)
      continue;
    
    elm = this.elms[i];
    elm.parent(null);
    
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

SieveLexer.register("block/","block/body",SieveBlockBody);
SieveLexer.register("block/","block/block",SieveBlock);
