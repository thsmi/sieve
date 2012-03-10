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

SieveDropHandler.prototype.document
    = function()
{
  if (!this._owner)
    throw "Owner for this Drop Handler";
    
  return this._owner.document();
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

SieveDropHandler.prototype.onCanDrop
    = function (flavour,event)
{
  var dt = event.originalEvent.dataTransfer;
  // accept only the registered drop flavour...  
  if (!dt.mozGetDataAt(flavour,0))
    return false;
  
  switch (dt.mozGetDataAt(flavour,0).action)
  {
    case "create":
      if (!this.canCreateElement)
        return false;
        
      return this.canCreateElement(
        flavour,
        dt.mozGetDataAt(flavour,0).type,
        dt.mozGetDataAt("application/sieve",0))
    
    case "move":
      if (!this.canMoveElement)
        return false;
        
      return this.canMoveElement(
        flavour,
        dt.mozGetDataAt(flavour,0).id,
        dt.mozGetDataAt("application/sieve",0))
  }
}

SieveDropHandler.prototype.canDrop
    = function(event)
{
  for (var i=0; i<this.flavours().length; i++)
  {  
    if (!this.onCanDrop(this.flavours()[i],event))
      continue;
            
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
  this.flavours(["sieve/action","sieve/test", "sieve/operator"]);
}

SieveBlockDropHandler.prototype.__proto__ = SieveDropHandler.prototype;

SieveBlockDropHandler.prototype.canMoveElement
    = function(sivFlavour, id, script)
{
  var source = this._owner.document().id(id);
            
  if (source.html().prev().get(0) == this._owner.dropTarget.get(0))
    return false;
               
  if (source.html().next().get(0) == this._owner.dropTarget.get(0))
    return false;
                          
  return true;
      
}

SieveBlockDropHandler.prototype.moveElement
    = function(sivFlavour, id, script)
{
  var dragElm = this.document().id(id);  
  if (!dragElm)
    throw "Block Drop Handler: No Element found for "+id;
         
  var item = this._owner.parent().getSieve();  
  if (!item)
    throw "Block Drop Handler: No Element found for "+this._owner.parent().id();
   
  switch (sivFlavour)
  {
    case "sieve/test":
    case "sieve/operator":

      var source = dragElm;
      var target = item;

      // Create a new Condition...      
      var newCondition = this.document().createByName("condition");
      
      // Find the if element which owns this test...
      var conditional = source;      
      while (conditional.parent().test)
        conditional = conditional.parent();
      
      // ... remove everything between our test and the conditional...
      var oldOwner = source.remove(true,conditional);
      
      // ... in case the conditional has no more a test...
      // ... we need to transfer all block element...
      if (!conditional.test())
      {
        oldOwner = conditional.remove(true,target);
        
        newCondition.append(conditional);
        newCondition.children(1).test(source);
        newCondition.children(0).remove(true);
      }
      else
        newCondition.children(0).test(source);

      target.append(newCondition,this._owner.id());
        
      target.widget().refresh();
      if (conditional.parent())
        conditional.widget().refresh();
      source.widget().refresh();
      oldOwner.widget().refresh();
      
      return;
      
    case "sieve/action":
      // remember owner
      var oldOwner = dragElm.remove(true,item);  
      // Move Item to new owner
      item.append(dragElm,this._owner.id());
      
      // refresh old and new Owner
      item.widget().refresh();
      oldOwner.widget().refresh();
      
      return;
  }
  
  throw "Incompatible Drop";
}

SieveBlockDropHandler.prototype.canCreateElement
    = function(sivFlavour, type , script)
{
  if(sivFlavour == "sieve/operator")
    return false;
    
  return true;      
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
  this.flavours(["sieve/action","sieve/test","sieve/if","sieve/operator"]);
}

SieveTrashBoxDropHandler.prototype.__proto__ = SieveDropHandler.prototype;

SieveTrashBoxDropHandler.prototype.canMoveElement
    = function(sivFlavour, id, script)
{           
  return true;      
}

SieveTrashBoxDropHandler.prototype.moveElement
    = function(sivFlavour, id, script)
{
  
  var item = this.document().id(id);
  if(!item)
    throw "Trash Drop Handler: No Element found for "+id;
  
  item = item.remove(true);
  
  if (!item)
    throw "Trash Drop Handler: No Element found for "+id;
   
  item.widget().refresh();
    
  var that = this.document();  
  window.setTimeout(function() {that.compact(); },0)
}

//****************************************************************************//

/**
 * Implements an handler for Sieve Test actions..
 */
function SieveConditionDropHandler()
{ 
  SieveDropHandler.call(this);
  this.flavours(["sieve/test","sieve/action","sieve/operator"]);
}

SieveConditionDropHandler.prototype.__proto__ = SieveDropHandler.prototype;

SieveConditionDropHandler.prototype.canMoveElement
    = function(flavour, id, script)
{     
    
  // actions can only be added as last element...
  if (flavour == "sieve/action")
    if (this._owner.id() != -1)
      return false;  

  // if there is no source node we can skip right here...
  var source = this._owner.document().id(id);
  if (!source)
    return false;
    
  // nested test might be dropped directly in front of a test, in order to...
  // ... remove an operator. But it does not make any sense to drop the ...
  // ... source directly before or after the traget.
  if (flavour != "sieve/action")
  {
    // we have to the check if the test's parent is a conditional   
    source = source.parent();
  
    // if it's a conditional statement it's parent does not have a test method
    if (!source.parent().test)
    {          
      if (source.html().prev().prev().get(0) == this._owner.dropTarget.get(0))
        return false;
               
      if (source.html().next().get(0) == this._owner.dropTarget.get(0))
        return false;
    }
  }
    
  // ... it's safe to add any other element everywhere except as...
  // ... last element.
  if (this._owner.id() != -1)
    return true;
    
  // ... if the last element has no test, it's an else statement...
  // ... and it's not possible to add anything...      
  var target = this._owner.parent().getSieve()
  if (!target)
    return false;
      
  if (!target.children(":last").test)
    return false;
 
  return true;      
}

SieveConditionDropHandler.prototype.moveElement
    = function (flavour, id, script)
{
  var source = this.document().id(id);  
  if (!source)
    throw "Block Drop Handler: No Element found for "+id;
         
  var target = this._owner.parent().getSieve();  
  if (!target)
    throw "Block Drop Handler: No Element found for "+this._owner.parent().id();
  
  if (flavour == "sieve/action")
  {
      var oldOwner = source.remove(true,target);
      
      // we need to warp the action into an else statement      
      target.append(
        this.document().createByName("condition/else")
          .append(source));
      
      target.widget().refresh();
      oldOwner.widget().refresh();
      
      return;
  }
      
  // "sieve/test" || "sieve/operator"
    
  // Find the if element which owns this test...
  var conditional = source;      
  while (conditional.parent().test)
    conditional = conditional.parent();
    
  // ... remove everything between our test and the conditional...
  var oldOwner = source.remove(true,conditional);
      
  // in case the conditional is empty we can reuse it ...
  // ... this keep all block elements intact...      
  if (conditional.test())
  {
    // we can't reuse it, create a new conditional
    conditional = this.document().createByName("condition/if");
    conditional.test(source);
  }
  else
  {
    conditional.test(source);
    oldOwner = conditional.remove(true,target);
  }
           
  target.append(conditional,this._owner.id());

  target.widget().refresh();
  oldOwner.widget().refresh();
  conditional.widget().refresh();
     
  return;      
}

SieveConditionDropHandler.prototype.canCreateElement
    = function(flavour, type , script)
{
  if(flavour == "sieve/operator")
    return false;
  
  // actions can only be added as last element...
  if (flavour == "sieve/action")
    if (this._owner.id() != -1)
      return false;  

  // ... it's safe to add any other element everywhere except as...
  // ... last element.
  if (this._owner.id() != -1)
    return true;
    
  // ... if the last element has no test, it's an else statement...
  // ... and it's not possible to add anything...      
  var target = this._owner.parent().getSieve()
  if (!target)
    return false;
      
  if (!target.children(":last").test)
    return false;
 
  return true;
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
            "else {\r\n"+item.document().createByName(type).toScript()+"}");
            
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
  this.flavours(["sieve/operator","sieve/test"]);
}

SieveTestDropHandler.prototype.__proto__ = SieveDropHandler.prototype;

SieveTestDropHandler.prototype.canMoveElement
    = function (sivFlavour, id , script)
{
  var target = this._owner.parent().getSieve();
  if(!target)
    return false;
    
  var source = target.document().id(id)
  if(!source)
    return false;
      
  // As we nest the tests we get in troube if the test is a direct descendant 
  // of the source, or of the target.
  while (source)
  {
    if (source.id() == target.id())
      return false;
      
    source = source.parent();
  }
  
  var source = target.document().id(id)
  while (target)
  {
    if (source.id() == target.id())
      return false
      
    target = target.parent();
  }
    
  return true;
}


  
SieveTestDropHandler.prototype.moveElement
    = function (sivFlavour, id , script)
{ 
  var source = this.document().id(id);  
  if (!source)
    throw "Test Drop Handler: No Element found for "+id;
    
  // The new home for our element
  var target = this._owner.parent().getSieve();
  
  if(!target)
    throw "Element "+this._owner.parent().id()+" not found";
  
  // Find the if element which owns this test...
  var conditional = source;      
  while (conditional.parent().test)
    conditional = conditional.parent();  
    
  // Wrap test into new test
  var outer = target.parent();  
  var inner = this.document().createByName("operator/anyof")
    
  target.parent(null);
  
  // ...and bind test to the new container...
  inner.test(target);
  // ... then add it to this container ...
  outer.test(inner,target.id());
  
  // ... finally update all backrefs.
  inner.parent(outer);
  target.parent(inner);
  
  // cleanup but stop at the source's parent condition
  var oldOwner = source.remove(true,conditional);
  
  // in case the conditional is empty we should migrate all actions ...
  // ... otherwise remove cascade will swipe them.
  if (!conditional.test())
  {
    // find the new home for our actions
    var newConditional = outer;
    while (newConditional.parent().test)
      newConditional = newConditional.parent();    

    // migrate our children...      
    while (conditional.children().length)
      newConditional.append(conditional.children(0).remove())
      
    // do the remaining cleanup...
    oldOwner = oldOwner.remove(true,target);      
  }  
  
  inner.append(source);
  
  outer.widget().refresh();
  if (newConditional)
    newConditional.widget().refresh();
  oldOwner.widget().refresh();  
}

SieveTestDropHandler.prototype.canCreateElement
    = function (sivFlavour, type , script)
{     
  return true;
}

SieveTestDropHandler.prototype.createElement
    = function(sivFlavour, type , script)
{  
  // The new home for our element
  var inner = this._owner.parent().getSieve();
  
  if(!inner)
    throw "Element "+this._owner.parent().id()+" not found";
  
  var container = inner.parent();
  
  if (sivFlavour == "sieve/test")
  {
    var test = inner.document().createByName(type)
    type = "operator/anyof";
  }

  
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
  
  if (sivFlavour == "sieve/test")
    outer.append(test);

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

SieveMultaryDropHandler.prototype.canMoveElement
    = function (sivFlavour, id, script)
{
  // We have to prevent that someone drops a parent onto a child...
  //  ... this would generate a ring reference
  var target = this._owner.parent().getSieve();
  
  if (!target)
    return false;
    
  var source = target.document().id(id)
  if(!source)
    return false;
    
  while (target)
  {
    if (source.id() == target.id())
      return false;
      
    target = target.parent();
  }
  
  // It makes no sense so drop the item directly before or after the element.
  if (source.html().prev().get(0) == this._owner.dropTarget.get(0))
    return false;
               
  if (source.html().next().get(0) == this._owner.dropTarget.get(0))
    return false;  
  
  return true;
}

SieveMultaryDropHandler.prototype.moveElement
    = function (sivFlavour, id, script)
{
  var target = this._owner.parent().getSieve();
  
  if(!target)
    throw "Element "+this._owner.parent().getSieve().id()+" not found";
  
  var source = this.document().id(id);  
  if (!source)
    throw "Block Drop Handler: No Element found for "+id;  
  
    
  // Find the if element which owns this test...
  var conditional = source;      
  while (conditional.parent().test)
    conditional = conditional.parent();
    
  // ... remove everything between our test and the conditional...
  var oldOwner = source.remove(true,conditional);
      
  // in case the conditional is empty we should migrate all actions ...
  // ... otherwise remove cascade will swipe them.
  if (!conditional.test())
  {
    // find the new home for our actions
    var newConditional = target;
    while (newConditional.parent().test)
      newConditional = newConditional.parent();    

    // migrate our children...      
    while (conditional.children().length)
      newConditional.append(conditional.children(0).remove())
      
    // continue cleanup
    oldOwner = oldOwner.remove(true,target);        
  }
    
  target.append(source,this._owner.id());
  
  target.widget().refresh();
  if (newConditional)
    newConditional.widget().refresh();  
  oldOwner.widget().refresh();
  

}

SieveMultaryDropHandler.prototype.canCreateElement
    =  function(sivFlavour, type , script)
{
  if (sivFlavour != "sieve/test")
    return false;
    
  return true;      
}

SieveMultaryDropHandler.prototype.createElement
    =  function(sivFlavour, type , script)
{
  var item = this._owner.parent().getSieve();
  
  if(!item)
    throw "Element "+this._owner.parent().getSieve().id()+" not found";
  
  var elm = item.document().createByName(type);
  
  item.append(elm,this._owner.id());
  item.widget().refresh();
}

