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
  SieveAbstractBlock.call(this,docshell,id);
  
  // Initialize Block Elements
  this.elms = [];
}

SieveBlockBody.prototype.__proto__ = SieveAbstractBlock.prototype;

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
  return (new SieveBlockUI(this));
}

if (!SieveLexer)
  throw "Could not register Block Elements";

SieveLexer.register("block/","block/body",SieveBlockBody);
SieveLexer.register("block/","block/block",SieveBlock);
