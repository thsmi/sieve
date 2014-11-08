/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
"use strict";

function SieveBlockBody(docshell,id)
{
  SieveAbstractBlock.call(this,docshell,id);
  this.elms = [];  
}

SieveBlockBody.prototype = Object.create(SieveAbstractBlock.prototype);
SieveBlockBody.prototype.constructor = SieveBlockBody;

SieveBlockBody.isElement
    = function (parser)
{
  return SieveLexer.probeByClass(["action","condition","whitespace"],parser);  
}

SieveBlockBody.nodeName = function () {
  return "block/body";
}

SieveBlockBody.nodeType  = function () {
  return "block/";
}

SieveBlockBody.prototype.init
    = function (parser)    
{
  while (this._probeByClass(["action","condition","whitespace"],parser))    
    this.elms.push(
      this._createByClass(["action","condition","whitespace"],parser));
 
  return this;
}

SieveBlockBody.prototype.toScript
    = function ()
{
  var str ="";

  for (var key in this.elms)
    str += this.elms[key].toScript();
    
  return str;
}

//****************************************************************************//


function SieveBlock(docshell,id)
{
  SieveBlockBody.call(this,docshell,id);
}

SieveBlock.prototype = Object.create(SieveBlockBody.prototype);
SieveBlock.prototype.constructor = SieveBlock;

SieveBlock.isElement
    = function (parser)
{
  return parser.isChar("{");  
}

SieveBlock.nodeName = function () {
  return "block/block";
}

SieveBlock.nodeType  = function () {
  return "block/";
}

SieveBlock.prototype.init
  = function (parser)
{  
  parser.extractChar("{");
  
  SieveBlockBody.prototype.init.call(this,parser);

  parser.extractChar("}");
  
  return this; 
}

SieveBlock.prototype.toScript
  = function ()
{
  return "{" +SieveBlockBody.prototype.toScript.call(this)+"}";
}
//****************************************************************************//


function SieveRootNode(docshell)
{
  SieveBlockBody.call(this,docshell,-1);
  
  this.elms[0] = this._createByName("import");
  this.elms[1] = this._createByName("block/body");
}

SieveRootNode.prototype = Object.create(SieveBlockBody.prototype);
SieveRootNode.prototype.constructor = SieveRootNode;

SieveRootNode.isElement
     = function (token)
{
  return false;  
}

SieveRootNode.nodeName = function () {
  return "block/rootnode";
}

SieveRootNode.nodeType  = function () {
  return "block/";
}


SieveRootNode.prototype.init
    = function (parser)
{
  // requires are only valid if they are
  // before any other sieve command!
  if (this._probeByName("import",parser))
    this.elms[0].init(parser);

  // After the import section only deadcode and actions are valid    
  if (this._probeByName("block/body",parser))
    this.elms[1].init(parser);   
    
  return this;
}

SieveRootNode.prototype.toScript
    = function ()
{
  var requires = [];
  
  // Step 1: collect requires
  this.elms[1].require(requires);

  // Step 2: Add require...
  for (var item in requires)
    this.elms[0].capability(item);

  // TODO Remove unused requires...
    
  // return the script
  return SieveBlockBody.prototype.toScript.call(this);
}


if (!SieveLexer)
  throw "Could not register Block Elements";

SieveLexer.register(SieveBlockBody);
SieveLexer.register(SieveBlock);
SieveLexer.register(SieveRootNode);