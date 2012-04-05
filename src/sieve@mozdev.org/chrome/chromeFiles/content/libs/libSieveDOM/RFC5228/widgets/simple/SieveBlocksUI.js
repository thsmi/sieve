/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

"use strict";

function SieveRichList()
{
  
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
  
  if (type == "whitespace")
    return this;
    
  if ((type == "action") && (!this.item().condition())) 
  {
    this.item().append(item);
    return this;
  }
    
  this._items.push(new SieveListItem(item));  
  return this;
}

SieveRichList.prototype.html
  = function ()
{
     
}


function SieveRichListItem(item)
{
  this.append(item)  
}

SieveRichListItem.prototype.append
  = function (item)
{
  if (item.nodeType() == "action")
   this._actions.push(item);
  else
    
   
}

SieveRichListItem.prototype.appendCondition
  = function (item)
{
  this._condition = item;
}

SieveRichListItem.prototype.html
  = function (item)
{
  var elm = $("<div/>")  
      .append($("<div/>").text("[+] Matches"))
      
  if (item.nodeType() == "action")
  {
    elm.append(this.createConditionList(null));
    elm.append(this.createActionList(item));
    
    return elm;
  }
  
  if (item.nodeName() != "condition")  
    throw "Script too complex 2"+item.nodeType();
     
  if (item.children().length != 1)
    throw "Script too complex use advanced mode";
    
  elm.append(this.createConditionList(item.children(0).test()))
  elm.append(this.createActionList(item.children(0)))
  
  return elm;     
}


function SieveRootNodeUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
}

SieveRootNodeUI.prototype.__proto__ = SieveAbstractBoxUI.prototype;


SieveRootNodeUI.prototype.createHtml
    = function (parent)
{
  var elm = $(document.createElement("div"))
              .addClass("sivBlock");
  
  var item = null;
  var blockElms = this.getSieve().children(1).children();

  var richlist = new SieveRichList();
  
  
  // actions
  // condition
  // actions
  // actions
  for (var i=0; i<blockElms.length;i++)
    richlist.append(blockElms[i])
     
  return parent.append(richlist.html());
}

SieveRootNodeUI.prototype.createElm
  = function  (item)
{
  var elm = $("<div/>")  
      .append($("<div/>").text("[+] Matches"))
      
  if (item.nodeType() == "action")
  {
    elm.append(this.createConditionList(null));
    elm.append(this.createActionList(item));
    
    return elm;
  }
  
  if (item.nodeName() != "condition")  
    throw "Script too complex 2"+item.nodeType();
     
  if (item.children().length != 1)
    throw "Script too complex use advanced mode";
    
  elm.append(this.createConditionList(item.children(0).test()))
  elm.append(this.createActionList(item.children(0)))
  
  return elm;
}

SieveRootNodeUI.prototype.createActionList
  = function  (item)
{
  var elm = $("<div/>")
    .append($("<div/>").text("Peform these Actions"))
  
  if (item.nodeType() == "action")
    return elm.append(item.toScript());
  
  if (item.nodeName() != "condition/if")
    throw "Script to complex [Ax11] "+item.nodeName();
    
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

SieveRootNodeUI.prototype.createConditionList
    = function (item)
{  
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




if (!SieveDesigner)
  throw "Could not register Block Widgets";

SieveDesigner.register(SieveRootNode, SieveRootNodeUI);
