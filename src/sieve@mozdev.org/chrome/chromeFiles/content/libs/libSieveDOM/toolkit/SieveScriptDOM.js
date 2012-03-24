/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

"use strict";

function SieveDocument(lexer)
{
  this._lexer = lexer;  
  this._nodes = {}
    
  // we cannot use this.createNode(). It would add a node without a parent...
  // ... to this._nodes. All nodes without a vaild parent and their...
  // ... descendants are removed when this.compact() is called. So that we... 
  // ... would endup with an empty tree.
  this._rootNode = this._lexer.createByName(this,"block/rootnode");  
}

/**
 * Returns the root node for this document
 * @return {}
 */
SieveDocument.prototype.root
  = function ()
{
  return this._rootNode;
}

SieveDocument.prototype.html
    = function ()
{  
  // TODO fix me should be get HTML
  return this._rootNode.widget();
  //return this._rootNode.html();  
}

// A shorthand to create children bound to this Element...
SieveDocument.prototype.createByName
    = function(name, parser, parent)
{     
  if (typeof(parser) == "string")
    parser = new SieveParser(parser); 
    
  var item = this._lexer.createByName(this, name, parser);
  
  if(typeof(parent) !== "undefined")
    item.parent(parent);

  // cache nodes...
  this._nodes[item.id()] = item;
  
  return item; 
}
  
SieveDocument.prototype.createByClass
    = function(types, parser, parent)
{  
  if (typeof(parser) == "string")
    parser = new SieveParser(parser);  
  
  var item = this._lexer.createByClass(this, types, parser);
  
  if(typeof(parent) !== "undefined")
    item.parent(parent);
    
  // cache nodes...
  this._nodes[item.id()] = item;
  
  return item;
}
  
SieveDocument.prototype.probeByName
    = function(name, parser)
{
  if (typeof(parser) == "string")
    parser = new SieveParser(parser); 
    
  return this._lexer.probeByName(name, parser);
}
  
SieveDocument.prototype.probeByClass
    = function(types, parser)
{
  if (typeof(parser) == "string")
    parser = new SieveParser(parser);  
  
  return this._lexer.probeByClass(types,parser);
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
  
  var parser = new SieveParser(data);
  
  this._rootNode.init(parser);
  
  if (!parser.empty())
    throw ("Parser error at: "+parser.bytes());
    
  // data should be empty right here...
  return parser.bytes();
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

if (!SieveLexer)
  throw "Could not register Conditional Elements";