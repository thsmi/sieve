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
        
      //event.preventDefault();
      //event.stopPropagation();
      return true;

    case "move" :
      if (!this.moveElement)
        return false;

      this.moveElement(
        flavour,
        dt.mozGetDataAt(flavour,0).id,
        dt.mozGetDataAt("application/sieve",0));

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
       return true;
      
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
            
    if (elm.widget().prev().get(0) == this._owner.dropTarget.get(0))
      return false;
               
    if (elm.widget().next().get(0) == this._owner.dropTarget.get(0))
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
  
  // We need to wrap test into a condition...
  if (sivFlavour == "sieve/test")
  {     
    // TODO Sieve Test behaviour is currently strange...
    // It should work as follows:
    // dragging a test should move the whole statement (test+block)
    // and create a new conditional statement
    //
    // empty conditional statements shall be deleted.
    // contitional statement with only an else block, shall add all elements 
    // to the parent block and delete the else...
   
    var parentElm = dragElm.parent();
    // we have to release the old test tests...
    parentElm.test(parentElm.document().createByName("test/boolean","false"));   
    
    
    // new Element
    var elm = parentElm.document().createByName("condition");
    elm.children(0).test(dragElm); 

    // Update UI
    dragElm.widget().before(parentElm.test().widget());    

    dragElm = elm;
  }

  //... lets update the sieve dom and move the node to his new position...
  item.append(dragElm,this._owner.id());

  // ... remove droptarget infront of the last object's last position ...  
  if(sivFlavour == "sieve/action")
    $("#sivElm"+id)
      .prev()
        .remove();
      
  // ... and add a new one directly before it's new positon ...
  this._owner.dropTarget
    .before(
      (new SieveDropBoxUI(this._owner.parent(),dragElm))
        .drop(new SieveBlockDropHandler())
        .getWidget())
    .before(dragElm.widget());          
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
  
  this._owner.dropTarget
    .before(
      (new SieveDropBoxUI(this._owner.parent(),elm))
        .drop(new SieveBlockDropHandler())
        .getWidget())
    .before(elm.widget())
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
    
  if (!item.remove())
    throw "Trash Drop Handler: No Element found for "+id; 
  
  // delete node and the corresponding dropbox...
  $("#sivElm"+id)
    .prev()
      .remove()
      .end()
    .remove();
   
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
            
          if (elm.widget().prev().prev().get(0) == this._owner.dropTarget.get(0))
            return false;
               
          if (elm.widget().next().get(0) == this._owner.dropTarget.get(0))
            return false;
         }
 
         // ... for tests everything before the last element is ok
         if (this._owner.id() == -1)
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
  throw "implement me";
/*  var dragElm = this._owner.parent().getSieve().id(id);  
  if(!dragElm)
    throw "No Element found for "+id;
           
  if (!drag.remove())
    throw "No Element found for "+id; 
  
  var item = this._owner.parent().getSieve();
  
  if (!item)
    throw "No Element found for "+this._owner.parent().id();
  
  //... lets update the sieve dom and move the node to his new position...
  item.append(dragElm,this._owner.id());

  // ... remove droptarget infront of the last object's last position ...
  $("#sivElm"+id)
    .prev()
      .remove();
  
  // ... and add a new one directly before it's new positon ...
  this._owner.dropTarget
    .before(
      (new SieveDropBoxUI(this._owner.parent(),dragElm))
        .drop(new SieveConditionDropHandler())
        .getWidget())
    .before(dragElm.widget());*/
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

    //Step 1 insert new  droptarget
    this._owner.dropTarget
      .before(
        (new SieveDropBoxUI(this._owner.parent(),elm))
          .drop(new SieveConditionDropHandler())
          .getWidget())

    
    // ... now its getting a bit ugly, we can not always add an elsif ...
    // ... so we need two strategies. One is to...
    if ((this._owner.id() >= 0) && (this._owner.getSieve().test))
      // ... reuse the existing if or elsif,
      this._owner.dropTarget
        .before(this._owner.dropTarget.next())
        .after($("<div>").text("#ELSE IF "));
    else 
      // ... the otherone append new elsif
      this._owner.dropTarget
        .before($("<div>").text("#ELSE IF "))   
        
    // Finally we can insert our Element.        
    this._owner.dropTarget
        .before(elm.widget())
  }
  else if (sivFlavour == "sieve/action")
  {
    elm = item.document().createByName("condition/else",
            "else {\r\n"+item.document().createByName(type).toScript()+"\r\n}");
            
    item.append(elm);
    
    this._owner.dropTarget
      .before(
        (new SieveDropBoxUI(this._owner.parent(),elm))
          .drop(new SieveBlockDropHandler())
          .getWidget())
      .before($("<div>").text("# ELSE"))          
      .before(elm.widget());      
  }
  else 
   throw "Incompatible drop";
}

//****************************************************************************//

// SieveTestDropHandler -> convert test to any of
