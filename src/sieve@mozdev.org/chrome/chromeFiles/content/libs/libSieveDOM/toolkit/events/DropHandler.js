/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

 "use strict";

//****************************************************************************//

function SieveDropHandler()
{
}

SieveDropHandler.prototype._flavours = [];
SieveDropHandler.prototype._owner = null;

SieveDropHandler.prototype.flavours
    = function (flavours,append)
{
  if (typeof(flavours) === "undefined")
    return this._flavours;
    
  if (append)
   this._flavours.concat(flavours);
  else
    this._flavours = [].concat(flavours);
  
  return this;
}

SieveDropHandler.prototype.bind
    = function (owner)
{
  this._owner = owner;
}

SieveDropHandler.prototype.onDrop
    = function(flavour,event)
{
  var dt = event.originalEvent.dataTransfer;
  
  switch (dt.mozGetDataAt(flavour,0).action)
  {
    case "create" :
      if (!this.createElement)
        return false;
        
      this.createElement(
        flavour,
        dt.mozGetDataAt(flavour,0).type,
        dt.mozGetDataAt("application/sieve",0));
        
      event.preventDefault();
      event.stopPropagation();
      return true;

    case "move" :
      if (!this.moveElement)
        return false;

      this.moveElement(
        flavour,
        dt.mozGetDataAt(flavour,0).id,
        dt.mozGetDataAt("application/sieve",0));

      event.preventDefault();
      event.stopPropagation();        
      return true;
      
    default:
      throw "Invalid action..."+ dt.mozGetDataAt(flavour,0).action;
  }

  return false;  
}

SieveDropHandler.prototype.onCanDrop
    = function(flavour,event)
{
  return true;
}

SieveDropHandler.prototype.drop
    = function(event)
{ 
  for (var i=0; i<this.flavours().length; i++)
  {
    if ( !this.onCanDrop(this.flavours()[i],event) )
      continue;
      
    return this.onDrop(this.flavours()[i],event);    
  }
  
  return true;
}

SieveDropHandler.prototype.canDrop
    = function(event)
{
  for (var i=0; i<this.flavours().length; i++)
    if (this.onCanDrop(this.flavours()[i],event))
    {
       event.preventDefault();
       event.stopPropagation(); 
       return true;
    }
      
  return false;      
}

//****************************************************************************//

function SieveBlockDropHandler()
{ 
  SieveDropHandler.call(this);
  this.flavours(["sieve/action","sieve/test"]);
}

SieveBlockDropHandler.prototype.__proto__ = SieveDropHandler.prototype;

SieveBlockDropHandler.prototype.onCanDrop
    = function(sivFlavour, event)
{ 
    event = event.originalEvent;
    
    // accept only the registered drop flavour...
    if ( ! event.dataTransfer.mozGetDataAt(sivFlavour,0))
      return false;     
            
    if (event.dataTransfer.mozGetDataAt(sivFlavour,0).action == "create")
      return true;
            
    if (event.dataTransfer.mozGetDataAt(sivFlavour,0).action != "move")
      return false; 

    var id = event.dataTransfer.mozGetDataAt(sivFlavour,0).id;
    
    var elm = this._owner.document().id(id);
            
    if (elm.html().prev().get(0) == this._owner.dropTarget.get(0))
      return false;
               
    if (elm.html().next().get(0) == this._owner.dropTarget.get(0))
      return false;
               
    // in case the element is dragged onto the droptarget directly behind or ...
    // ... in front we can just skip the request.    
 /*   var elm = event.dataTransfer.mozGetDataAt(sivFlavour,0).html;
    
    
    if ((elm.nextSibling) && (elm.nextSibling === this._owner.dropTarget.get(0)))
      return false;
    
    if ((elm.previousSibling) && (elm.previousSibling === this._owner.dropTarget.get(0)))
      return false;*/
          
  // ... or onto a parent into his child block          
/*  for (var node = this.dropTarget; node; node = node.parentNode)
    if (node.isSameNode(event.dataTransfer.mozGetDataAt(sivFlavour,0)))
      return false;*/
          
  return true;
}

 
SieveBlockDropHandler.prototype.moveElement
    = function(sivFlavour, id, script)
{

  var dragElm = this._owner.parent().getSieve().id(id);  
  if (!dragElm)
    throw "Block Drop Handler: No Element found for "+id;
         
  var item = this._owner.parent().getSieve();  
  if (!item)
    throw "Block Drop Handler: No Element found for "+this._owner.parent().id();
  
  switch (sivFlavour)
  {
    case "sieve/test":
      // 1. We need to figure out the corresponding condition...
      var oldCond = dragElm.parent().parent();
      var oldOwner = oldCond.parent();
    
      // 2. create a new home for our test
      var newCond = dragElm.document().createByName("condition");    
      newCond.append(dragElm.parent());
      newCond.children(0).remove();
      
      // 4. finally insert our new condition 
      item.append(newCond,this._owner.id());    
      item.widget().refresh();      
    
      oldCond.widget().refresh();
      oldOwner.widget().refresh();       
    
      return;
      
    case "sieve/action":
      // remember owner
      var oldOwner = dragElm.parent();  
      // Move Item to new owner
      item.append(dragElm,this._owner.id());
      
      // refresh old and new Owner
      item.widget().refresh();
      oldOwner.widget().refresh();
      
      // TODO Check if move would result in am empty else, if so drop it automagically
      // if !oldOwner.parent().parent().test 
      //   &&   !oldOwner.parent().parent().block().children().length();
      //   oldOwner.parent().parent().parent().remove();
      //   refresh oldOwner parent      
      
      return;
  }
  
  throw "Incompatible Drop";
}

SieveBlockDropHandler.prototype.createElement
    = function(sivFlavour, type , script)
{  
   
  var item = this._owner.parent().getSieve();
  
  if(!item)
    throw "Element "+this._owner.parent().getSieve().id()+" not found";
  
  var elm = null;
  
  
  if (sivFlavour == "sieve/test")  
    elm = item.document().createByName("condition",
            "if "+item.document().createByName(type).toScript()+"{\r\n}\r\n");
  else
    elm = item.document().createByName(type);
  
  item.append(elm,this._owner.id());
  item.widget().refresh();
}

//****************************************************************************//

function SieveTrashBoxDropHandler()
{
  SieveDropHandler.call(this);
  this.flavours(["sieve/action","sieve/test","sieve/if"]);
}

SieveTrashBoxDropHandler.prototype.__proto__ = SieveDropHandler.prototype;

SieveTrashBoxDropHandler.prototype.onCanDrop
    = function (flavour, event)
{
  // accept only the registered drop flavour...
  if ( ! event.originalEvent.dataTransfer.mozGetDataAt(flavour,0))
    return false;
            
  if (event.originalEvent.dataTransfer.mozGetDataAt(flavour,0).action != "move")
    return false;
            
  return true;      
}

SieveTrashBoxDropHandler.prototype.moveElement
    = function(sivFlavour, id, script)
{
  
  var item = this._owner.document().id(id);
  if(!item)
    throw "Trash Drop Handler: No Element found for "+id;
  
  item = item.remove(true);
  
  if (!item)
    throw "Trash Drop Handler: No Element found for "+id;
   
  item.widget().refresh();
    
  var that = this._owner.document();  
  window.setTimeout(function() {that.compact(); },0)
}

//****************************************************************************//

/**
 * Implements an handler for Sieve Test actions..
 */
function SieveConditionDropHandler()
{ 
  SieveDropHandler.call(this);
  this.flavours(["sieve/test","sieve/action"]);
}

SieveConditionDropHandler.prototype.__proto__ = SieveDropHandler.prototype;

SieveConditionDropHandler.prototype.onCanDrop
    = function(sivFlavour, event)
{ 
    event = event.originalEvent;
    
    // accept only the registered drop flavour...
    if ( ! event.dataTransfer.mozGetDataAt(sivFlavour,0))
      return false;
            
    var action = event.dataTransfer.mozGetDataAt(sivFlavour,0).action;
    var id = event.dataTransfer.mozGetDataAt(sivFlavour,0).id;
    
    // We can not add any element after an else, so we have to filter that out...      
    switch (sivFlavour)
    {
      case "sieve/action":
        // ... actions can only added as last element
        if (this._owner.id() != -1)
          return false;
             
        break;
           
      case "sieve/test":
        if (action == "move")
        {
          // this is a test, so we have to retrieve the conditonal
          var elm = this._owner.document().id(id).parent();
            
          if (elm.html().prev().prev().get(0) == this._owner.dropTarget.get(0))
            return false;
               
          if (elm.html().next().get(0) == this._owner.dropTarget.get(0))
            return false;
         }
 
         // ... for tests everything before the last element is ok
         if (this._owner.id() != -1)
           return true;
             
        break;
           
      default :
        // nothing Compatible was dropped to return false
        return false;
    }
      
    // ... ok, with the last element we have to do some extra work... 
    var item = this._owner.parent().getSieve();
    if (!item)
      return false;

    // ... if the last element has no test, then it has to be an else...         
    if (!item.children(":last").test)
      return false;
      
    // ... if not we are safe to add elements to it
    return true;
}


SieveConditionDropHandler.prototype.moveElement
    = function (sivFlavour, id, script)
{
  var dragElm = this._owner.parent().getSieve().id(id);  
  if (!dragElm)
    throw "Block Drop Handler: No Element found for "+id;
         
  var item = this._owner.parent().getSieve();  
  if (!item)
    throw "Block Drop Handler: No Element found for "+this._owner.parent().id();
    
  switch(sivFlavour)
  {
    case "sieve/test":
      var oldCond = dragElm.parent().parent();
      var oldOwner = oldCond.parent();
      
      // Move element
      item.append(dragElm.parent(),this._owner.id());
      
      // Check if element is empty      
      item.widget().refresh();
      oldOwner.widget().refresh();
      oldCond.widget().refresh();      

      return;
      
    case "sieve/action":
      
      var oldOwner = dragElm.parent();
      
      // we need to warp the action into an else statement
      var newItem = item.document().createByName("condition/else","else {\r\n}\r\n");
      newItem.append(dragElm);
      
      item.append(newItem);
      
      item.widget().refresh();
      oldOwner.widget().refresh();
      
      return;
  }
  throw "implement me move Element for"+sivFlavour;
}

SieveConditionDropHandler.prototype.createElement
    =  function(sivFlavour, type , script)
{     
  // The new home for our element
  var item = this._owner.parent().getSieve();
  
  if(!item)
    throw "Element "+this._owner.parent().id()+" not found";
    
  if (sivFlavour == "sieve/test")
  {
    var elm = item.document().createByName("condition/if",
            "if "+item.document().createByName(type).toScript()+"{\r\n}\r\n");
            
    item.append(elm,this._owner.id());

    item.widget().refresh();
    
  }
  else if (sivFlavour == "sieve/action")
  {
    elm = item.document().createByName("condition/else",
            "else {\r\n"+item.document().createByName(type).toScript()+"\r\n}");
            
    item
      .append(elm)
      .widget().refresh();
  }
  else 
   throw "Incompatible drop";
}

//****************************************************************************//

function SieveTestDropHandler()
{ 
  SieveDropHandler.call(this);
  this.flavours(["sieve/operator"]);
}

SieveTestDropHandler.prototype.__proto__ = SieveDropHandler.prototype;

SieveTestDropHandler.prototype.onCanDrop
    = function(sivFlavour, event)
{ 
  
    event = event.originalEvent;
    
    // accept only the registered drop flavour...
    if ( ! event.dataTransfer.mozGetDataAt(sivFlavour,0))
      return false;   
 
    if (sivFlavour != "sieve/operator")    
      return false;
      
    return true;
}


SieveTestDropHandler.prototype.createElement
    =  function(sivFlavour, type , script)
{
  if (sivFlavour != "sieve/operator")
    throw "invalid flavour "+sivFlavour;
   
  // The new home for our element
  var inner = this._owner.parent().getSieve();
  
  if(!inner)
    throw "Element "+this._owner.parent().id()+" not found";
  
  var container = inner.parent();

  
  var outer = inner.document().createByName(type)
  // share the same source...
  if (outer.parent())
    throw "wrap already bound to "+outer.parent().id();
    
  inner.parent(null);
  
  // ...and bind test to the new container...
  outer.test(inner);
  // ... then add it to this container ...
  container.test(outer,inner.id());
  
  // ... finally update all backrefs.
  outer.parent(container);
  inner.parent(outer);
  
  //newOwner.wrap(item.document().createByName(type))
  //item.widget().refresh();
  
  container.widget().refresh();
}

//****************************************************************************//

// used in multary operators
function SieveMultaryDropHandler()
{ 
  SieveDropHandler.call(this);
  this.flavours(["sieve/operator","sieve/test"]);
}

SieveMultaryDropHandler.prototype.__proto__ = SieveDropHandler.prototype;

SieveMultaryDropHandler.prototype.onCanDrop
    = function(sivFlavour, event)
{ 
  
    event = event.originalEvent;
    
    // accept only the registered drop flavour...
    if ( ! event.dataTransfer.mozGetDataAt(sivFlavour,0))
      return false;   
 
    var action = event.dataTransfer.mozGetDataAt(sivFlavour,0).action;
    
    if ((action == "create") && (sivFlavour != "sieve/test"))    
      return false;
      
    // TODO Fixme: 
    if (action == "move")
      return false;
      
    return true;
}


SieveMultaryDropHandler.prototype.moveElement
    = function (sivFlavour, id, script)
{
  throw "implement me move Element for"+sivFlavour;
}

SieveMultaryDropHandler.prototype.createElement
    =  function(sivFlavour, type , script)
{
  throw "implement me create Element for"+sivFlavour;
}

