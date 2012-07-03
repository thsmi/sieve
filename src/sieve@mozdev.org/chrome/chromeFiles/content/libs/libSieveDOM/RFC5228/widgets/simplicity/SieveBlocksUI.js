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
  this._selectedIndex = 0;
  
  // We need to refactor our elements, as sieve does not align perfectly fine
  // with our user interface, so we do not care about comments, whitespace etc.
  // and rip the script appart. On save we have to do the opposit...
    
  var actions = null;
  
  while (elms.length) 
  {
   
    if (elms[0].nodeType() == "action")
    {
      if (!actions)
        actions = [];
      
      actions.push(elms[0]); 
      
      elms[0].remove(true);
      
      continue;
    }
    
    if (elms[0].nodeType() == "condition")
    {
      if (actions)
        this.append(new SieveRichListItem(this,actions));
        
      if (elms[0].children().length > 1)
        throw " Script too complex, elsif or else not supported" 
        
      // extract all actions...
      actions = [];
      var children = elms[0].children(0).children(); 
       
      while (children.length)
      {       
        if (children[0].nodeType() == "condition")
          throw "Script to complex nested if statement not supported"
        
        if (children[0].nodeType() == "action")
          actions.push(children[0]);
          
          
        children[0].remove(true);
      }
      
      // then all tests...
      var test = elms[0].children(0).test();      
      
      this.append(new SieveRichListItem(this, actions, test));
      
      test.remove(true);
      
      actions = null;
      
      continue;
    }

    // Safe to Skip should be whitespaces and similar stuff...    
    elms[0].remove(true);    
  }
    
  if (actions) 
    this.append(new SieveRichListItem(this,actions));

  // as we ripped the elements out of the sieve script we should remove them...    
  // ... so that our document contains just our actions and conditions plus...
  // ... the root node.
  var whitelist = [];
  for (var i=0; i<this._items.length; i++)
  {
    whitelist = whitelist.concat(this._items[i]._actions)    
    if (this._items[i]._condition)
      whitelist = whitelist.concat(this._items[i]._condition)
  }
   
  if (whitelist.length)
    whitelist[0].document().compact(whitelist);
         
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
  this._items.push(item);  
  return this;
}

SieveRichList.prototype.selectedIndex
  = function (idx)
{
  if (typeof(idx) == "undefined")
    return this._selectedIndex;
    
  if (this._selectedIndex == idx)
    return this._selectedIndex;
  
  // we can move the only to the next item when the element validates
  if (!this._items[this._selectedIndex].validate())
    return this._selectedIndex;
    
  // ... disable and deselect it
  this._items[this._selectedIndex].editable(false);    
  
  this._selectedIndex = idx;
  
  // ... and move to the new element.
  this._items[idx].editable(true);
  
  return this._selectedIndex;  
}

SieveRichList.prototype.selectedItem
  = function (item)
{ 
  if (typeof(item) == "undefined")
    return this._items[this.selectedIndex()]; 
    
  var idx = this._items.indexOf(item);
  
  // in case we can not find the item, we return null...
  if (idx == -1)
    return null;
  
  // ... we do the same in case we can not select the item.
  if (idx != this.selectedIndex(idx))
    return null;
    
  return this._items[idx];  
}

SieveRichList.prototype.html
  = function ()
{
  var elm = $("<div/>");
  
  if (this.selectedItem())
    this.selectedItem().editable(true);    
  
  for (var i=0; i<this._items.length; i++)
    elm.append(this._items[i].html())
  
  elm.addClass("sivRichList");
  
  return elm;
}

// Selected element is always editable...
// Wenn switching to an other editable element then then call on editable..

/******************************************************************************/

/**
 * 
 * @param {} item
 */
function SieveRichListItem(parent, actions, condition)
{    
  this._isEditable = false;
  this._parent = parent;
  
  this._actions = actions;
  this._condition = condition;
}

/*SieveRichListItem.prototype.relax
  = function () 
{
  for (var i=0; i<this._actions.length; i++)
    this._actions.remove(true);
    
  if (this._condition) 
    for (var i=0; i<this._condition.length; i++)
      this._condition.remove(true);    
}*/

SieveRichListItem.prototype.validate
  = function ()
{
  return true;    
}

SieveRichListItem.prototype.htmlConditional
   = function (html,type,tests)
{
  var elm = $("<div/>");
  
  if (html)
    elm = html;
    
  if (!this.editable())
  {    
    if (type == 2)
      elm.append($("<div/>").text("Match any of the following"))
    else if (type == 1)
      elm.append($("<div/>").text("Match all of the following"));
    else
      elm.append($("<div/>").text("Match all Messages"));
      
   // test [0,test,0]
   // test [[0,test,0],[0,test,0],[0,test,0]]
    if (tests && tests.length)
    {
      for (var i=0; i<tests.length; i++)
      {
        if (tests[i][1].nodeType() != "test")
          throw "Script to compex, nested Tests...";
          
        elm.append($("<div/>").text(tests[i][1].toScript()));
      }
    }
      
    return elm;
  }
      
 // If editable: 
   elm.append($("<div/>").text("Match"))
      .append($("<div/>")
        .append($("<input type='radio'/>"))
        .append($("<span/>").text("all of the following")) 
        .append($("<input type='radio'/>"))
        .append($("<span/>").text("any of the following"))
        .append($("<input type='radio'/>"))
        .append($("<span/>").text("all Messages")));

    if (tests && tests.length)
    {
      for (var i=0; i<tests.length; i++)
      {
        if (tests[i][1].nodeType() != "test")
          throw "Script to compex, nested Tests...";
      
        if (tests[i][1].widget())
          elm.append(tests[i][1].widget().html(true));
        else
          elm.append($("<div/>").text(tests[i][1].toScript()));
      }
    }
     
   
   var elm2 = $("<select/>");
   
   elm2.append($("<option/>").text("..."))
   
   for (var key in SieveLexer.types["test"])
     if (key != "test/boolean")
       if (SieveLexer.types["test"][key].onCapable(SieveLexer.capabilities()))
         elm2.append($("<option/>").text(key));        
      
   return elm.append($("<div/>").append(elm2));
}

SieveRichListItem.prototype.htmlConditions
    = function ()
{ 
  var elm = $("<div/>").addClass("sivCondition")
  
  var item = this._condition;
  
  if (!item)
    return this.htmlConditional(elm,0)      
  
  if (item.nodeType() == "test")
    return this.htmlConditional(elm,1,[[null,item,null]]);
 
  if (item.nodeName() == "operator/anyof")
  {
    if (item.isAllOf)
      return this.htmlConditional(elm,1,item.tests);
    
    return this.htmlConditional(elm,2,item.tests);
  }
  
  throw "Script too complext, unsupported operator"+item.nodeType();
}


SieveRichListItem.prototype.htmlActions
  = function  ()
{
  
  var elm = $("<div/>")
    .append($("<div/>").text("Peform these Actions"))
    .addClass("sivAction");
  
  var actions = this._actions;
    
  for (var i=0; i<this._actions.length; i++)
  {
    if (actions[i].nodeType() == "whitespace")
      continue;
      
    if (actions[i].nodeType() == "action")
    {      
      elm.append($("<div/>").text(actions[i].toScript()))
      continue;
    }
    
    throw "Script to complex [Ax12], test expected"+actions[i].nodeType();
  }
  
  if (this.editable())
  {
    var elm2 = $("<select/>");
    
    elm2.append($("<option/>").text("..."))
    
    for (var key in SieveLexer.types["action"])
      if (key != "test/boolean")
        if (SieveLexer.types["action"][key].onCapable(SieveLexer.capabilities()))
          elm2.append($("<option/>").text(key));
          
    elm.append($("<div/>").append(elm2))     
  }         
  
  return elm;  
}  

SieveRichListItem.prototype.editable
    = function (isEditable)
{
  if (typeof(isEditable) == "undefined")
    return this._isEditable;

  if (this._isEditable ==  isEditable)
    return this;
    
  this._isEditable = isEditable;
    
  // update the inner HTML
  this.reflowInner();
}

SieveRichListItem.prototype.reflowInner
  = function ()
{
  // we can skip if the element is not bound to a DOM
  if (!this._html)
    return;
    
  // remove old content
  this._html.children().remove();
  
  this._html
    .append(this.htmlConditions())
    .append(this.htmlActions());
  
  var that = this;
  
  if (this.editable())
  {
    this._html.attr("sivEditable","true")
    return;
  }
    
  this._html.removeAttr("sivEditable")
  
  this._html.click(function(e) 
  { 
    if (that._parent.selectedItem(that) == null)
      return false;
        
    $(this).unbind('click'); 
    e.preventDefault(); 
    return true; 
  } );
}


SieveRichListItem.prototype.html
  = function ()
{
  if (this._html)
    return this._html;
    
  this._html =  $("<div/>");
  
  this.reflowInner();      
  
  this._html.addClass("sivRichListItem");
  
  return this._html;
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
