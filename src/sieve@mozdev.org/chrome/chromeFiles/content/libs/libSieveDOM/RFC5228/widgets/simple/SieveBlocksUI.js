/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

"use strict";

function SieveRichList(elms)
{
  this._items = [];
  for (var i=0; i<elms.length;i++)
    this.append(elms[i])  
}

SieveRichList.prototype.item
  = function (pos)
{
  if (typeof(pos) == "undefined")
    return (this._items[this._items.length-1])
    
  return this._items[pos];
}

SieveRichList.prototype.append
  = function (item)
{  
  var type = item.nodeType();
  
  // ignore whitespaces
  if (type == "whitespace")
    return this;

  if (type == "condition")
  {
    this._items.push(new SieveRichListItem(item));  
    return this;
  }
  
  // TODO ensure that adjacent actions are grouped together
  if (type == "action")
  {
    this._items.push(new SieveRichListItem(item)); 
    return this;
  }
  
  throw "Unexpected type: "+type;
}

SieveRichList.prototype.html
  = function ()
{
  var elm = $("<div/>");
      
  for (var i=0; i<this._items.length; i++)
    elm.append(this._items[i].html())  
     
  return elm;
}

function SieveRichListItem(item)
{  
  this._condition = null;
  
  if (item.nodeName() == "condition")
    this._condition = item;
    
  if (item.nodeType() == "action")
    this._condition = item.document().createByName("condition","if false { "+item.toScript()+" }");
    
  
  if (this._condition == null)
    throw "Incompatible element";
     
  if (this._condition.children().length != 1)
    throw "Script too complex use advanced mode";
}

SieveRichListItem.prototype.append
  = function (item)
{
  if (item.nodeType() != "action")
    throw "Incompatible element";
    
  this._condition.children(0).append(item);      
}

SieveRichListItem.prototype.htmlConditions
    = function ()
{ 
  var item = this._condition.children(0).test();
  
  if (item.nodeName() == "test/boolean")
    if (item.value == false)
      item = null;
  
  if (item == null)
  {
    return $("<div/>")
        .append($("<div/>").text("All Messages"));    
  }
  
  if (item.nodeType() == "test")
  {
    return $("<div/>")
      .append($("<div/>").text("any of the following"))
      .append($("<div/>").text(item.toScript()));
  }
  
  var elm = $("<div/>");
 
  if (item.nodeName() == "operator/anyof")
  {
    if (item.isAllOf)
      elm.append($("<div/>").text("all of the following"));
    else 
      elm.append($("<div/>").text("any of the following"));
 
    for (var i=0; i<item.tests.length; i++)
    {
      if (item.tests[i][1].nodeType() != "test")
        throw "Script to compex, nested Tests...";
      
      if (item.tests[i][1].widget())
        elm.append(item.tests[i][1].widget().html());
      else
        elm.append($("<div/>").text(item.tests[i][1].toScript()));
    }
    
    return elm;
  }
  
  throw "Script too complext, unsupported operator"+item.nodeType();
}


SieveRichListItem.prototype.htmlActions
  = function  ()
{
  var item = this._condition.children(0)
  
  var elm = $("<div/>")
    .append($("<div/>").text("Peform these Actions"))
  
  if (!item.children())
    throw "No Block statement";
    
  for (var i=0; i<item.children().length; i++)
  {
    if (item.children(i).nodeType() == "whitespace")
      continue;
      
    if (item.children(i).nodeType() == "action")
    {
      elm.append($("<div/>").text(item.children(i).toScript()))
      continue;
    }
    
    throw "Script to complex [Ax12], test expected"+item.children(i).nodeType();
  }

  return elm;  
}  


SieveRichListItem.prototype.html
  = function (item)
{
  var elm = $("<div/>")  
      .append($("<div/>").text("[+] Matches"))

  elm.append(this.htmlConditions())      
  elm.append(this.htmlActions())
  
  return elm;     
}


function SieveRootNodeUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);  
  this.richlist = new SieveRichList(elm.children(1).children());
}

SieveRootNodeUI.prototype.__proto__ = SieveAbstractBoxUI.prototype;


SieveRootNodeUI.prototype.createHtml
    = function (parent)
{
  var elm = $(document.createElement("div"))
              .addClass("sivBlock");
  
  var item = null;
  var blockElms = this.getSieve();  
     
  return parent.append(this.richlist.html());
}


if (!SieveDesigner)
  throw "Could not register Block Widgets";

SieveDesigner.register(SieveRootNode, SieveRootNodeUI);
