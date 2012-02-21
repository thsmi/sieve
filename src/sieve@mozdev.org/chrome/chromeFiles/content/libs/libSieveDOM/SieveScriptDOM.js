/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

"use strict";

function SieveRootNode(docshell)
{
  SieveBlockBody.call(this,docshell,-1);
  
  this.elms[0] = this._createByName("import");
  this.elms[1] = this._createByName("block/body");  
}

SieveRootNode.prototype.__proto__ = SieveBlockBody.prototype;

SieveRootNode.prototype.toWidget
    = function ()
{  
  return $("<div/>")
           .append(this.elms[1].widget());  
}

SieveRootNode.prototype.init
    = function (data)
{
  // requires are only valid if they are
  // before any other sieve command!
  if (this._probeByName("import",data))
    data = this.elms[0].init(data);

  // After the import section only deadcode and actions are valid    
  if (this._probeByName("block/body",data))
    data = this.elms[1].init(data);   
    
  return data;
}


function SieveDocument(lexer)
{
  this._lexer = lexer;  
  this.rootNode = new SieveRootNode(this);
}

SieveDocument.prototype.root
  = function ()
{
  return SieveBlockBody;
}

SieveDocument.prototype.widget
    = function ()
{  
  return this.rootNode.widget();  
}

// A shorthand to create children bound to this Element...
SieveDocument.prototype.createByName
    = function(name, data, parent)
{     
  return this._lexer.createByName(this, name, data)
           .parent((typeof(parent) === "undefined")?null:parent);
}
  
SieveDocument.prototype.createByClass
    = function(types, data, parent)
{    
  return this._lexer.createByClass(this, types, data)
           .parent((typeof(parent) === "undefined")?null:parent);
}
  
SieveDocument.prototype.probeByName
    = function(name, data)
{
  return this._lexer.probeByName(name, data);
}
  
SieveDocument.prototype.probeByClass
    = function(types, data)
{    
  return this._lexer.probeByClass(types,data);
}  

SieveDocument.prototype.getRequires
    = function ()
{
  var requires = {};
  
  this.rootNode.require(requires);
  
  for (var i in requires)
    alert(i);  
}
    
SieveDocument.prototype.id
  = function (id)
{
  // TODO replace find...
  return this.rootNode.find(id);    
}

SieveDocument.prototype.script
  = function (data)
{
  if (typeof(data) === "undefined")
    return this.rootNode.toScript();

  // the sieve syntax prohibits single \n and \r
  // they have to be converted to \r\n
  
  // convert all \r\n to \r ...
  data = data.replace(/\r\n/g,"\r");
  // ... now convert all \n to \r ...
  data = data.replace(/\n/g,"\r");  
  // ... finally convert all \r to \r\n
  data = data.replace(/\r/g,"\r\n");

  var r = 0;
  var n = 0;
  for (var i=0; i< data.length; i++)
  {
    if (data.charCodeAt(i) == "\r".charCodeAt(0))
      r++;
    if (data.charCodeAt(i) == "\n".charCodeAt(0))
      n++;
  }
  if (n != r)
    throw ("Something went terribly wrong. The linebreaks are mixed up...\n");
  
  data = this.rootNode.init(data);
  
  if (data.length != 0)
    throw ("Parser error!"+data);
    
  // data should be empty right here...
  return data;
}

