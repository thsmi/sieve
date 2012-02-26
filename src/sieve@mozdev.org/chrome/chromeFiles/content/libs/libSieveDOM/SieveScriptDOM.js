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

SieveRootNode.prototype.toScript
    = function (data)
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

function SieveDocument(lexer)
{
  this._lexer = lexer;  
  this._nodes = {}
  this._rootNode = new SieveRootNode(this);
}

SieveDocument.prototype.root
  = function ()
{
  return this._rootNode;
}

SieveDocument.prototype.widget
    = function ()
{  
  return this._rootNode.widget();  
}

// A shorthand to create children bound to this Element...
SieveDocument.prototype.createByName
    = function(name, data, parent)
{     
  var item = this._lexer.createByName(this, name, data);
  
  if(typeof(parent) !== "undefined")
    item.parent(parent);

  // cache nodes...
  this._nodes[item.id()] = item;
  
  return item; 
}
  
SieveDocument.prototype.createByClass
    = function(types, data, parent)
{  
  var item = this._lexer.createByClass(this, types, data);
  
  if(typeof(parent) !== "undefined")
    item.parent(parent);
    
  // cache nodes...
  this._nodes[item.id()] = item;
  
  return item;
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

SieveDocument.prototype.id
  = function (id)
{
  return this._nodes[id];
}

SieveDocument.prototype.script
  = function (data)
{
  if (typeof(data) === "undefined")
    return this._rootNode.toScript();
  
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
  
  data = this._rootNode.init(data);
  
  if (data.length != 0)
    throw ("Parser error!"+data);
    
  // data should be empty right here...
  return data;
}

/**
 * In oder to speedup mutation elements are cached. But this cache is lazy.
 * So deleted objects will remain in memory until you call this cleanup
 * Method.
 * 
 * It checks all cached elements for a valid parent pointer. If it's missing
 * the document was obviously deleted...
 */
SieveDocument.prototype.compact
  = function ()
{
  
  var items = [];
  var cnt = 0;
  
  // scan for null nodes..
  for (var item in this._nodes)
    if (!this._nodes[item].parent())
      items.push(item);

  // ...cleanup these nodes...
  for (var i=0; i<items.length; i++)
    delete (this._nodes[items[i]]);
    
  // ... and remove all dependent nodes  
  while (items.length)
  {
    var it = items.shift();
    
    for (var item in this._nodes)
      if (this._nodes[item].parent().id() == it)
        items.push(item) 
        
    delete(this._nodes[it]);
    cnt++;
  } 
  
  return cnt;
}
