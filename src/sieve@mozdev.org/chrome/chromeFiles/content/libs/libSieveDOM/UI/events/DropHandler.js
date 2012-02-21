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
  
  switch (dt.mozGetDataAt(flavour,3))
  {
    case "create" :
      if (!this.createElement)
        return true;
        
      this.createElement(
        flavour,dt.mozGetDataAt(flavour,1),
        dt.mozGetDataAt("application/sieve",2));
      return false;

    case "move" :
      if (!this.moveElement)
        return true;
      
      this.moveElement(
        flavour,dt.mozGetDataAt(flavour,1),
        dt.mozGetDataAt("application/sieve",2));
      return false;
  }

  return true;  
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
            
    if (event.dataTransfer.mozGetDataAt(sivFlavour,3) == "create")
      return true;
            
    if (event.dataTransfer.mozGetDataAt(sivFlavour,3) != "move")
      return false; 

    // in case the element is dragged onto the droptarget directly behind or ...
    // ... in front we can just skip the request.    
    var elm = event.dataTransfer.mozGetDataAt(sivFlavour,0);
    
    
    if ((elm.nextSibling) && (elm.nextSibling === this._owner.dropTarget.get(0)))
      return false;
    
    if ((elm.previousSibling) && (elm.previousSibling === this._owner.dropTarget.get(0)))
      return false;
          
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
            
  if (event.originalEvent.dataTransfer.mozGetDataAt(flavour,3) != "move")
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
            
    if (event.dataTransfer.mozGetDataAt(sivFlavour,3) == "create")
    {
      // We can not add any element after an else, so we have to filter that out...      
      switch (sivFlavour)
      {
        case "sieve/action":
           // ... actions can only added as last element
           if (this._owner.id() != -1)
             return false;
           break;
           
        case "sieve/test":
           // ... for tests everything before the last elemen is ok
           if (this._owner.id() != -1)
             return true;
           break;
           
        default :
          alert("default");
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
    
    // TODO implement MOVE
    return false
    
    if (event.dataTransfer.mozGetDataAt(sivFlavour,3) != "move")
      return false; 

    // in case the element is dragged onto the droptarget directly behind or ...
    // ... in front we can just skip the request.    
    var elm = event.dataTransfer.mozGetDataAt(sivFlavour,0);
    
    
    if ((elm.nextSibling) && (elm.nextSibling === this._owner.dropTarget.get(0)))
      return false;
    
    if ((elm.previousSibling) && (elm.previousSibling === this._owner.dropTarget.get(0)))
      return false;
          
  // ... or onto a parent into his child block          
/*  for (var node = this.dropTarget; node; node = node.parentNode)
    if (node.isSameNode(event.dataTransfer.mozGetDataAt(sivFlavour,0)))
      return false;*/
          
  return true;
}


SieveConditionDropHandler.prototype.moveElement
    = function (sivFlavour, id, script)
{
  
  var dragElm = dom.find(id);
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
    .before(dragElm.widget());          
}

SieveConditionDropHandler.prototype.createElement
    =  function(sivFlavour, type , script)
{     
  // The new home for our element
  var item = dom.find(this._owner.parent());
  
  if(!item)
    throw "Element "+this._owner.parent().id()+" not found";
        
  // TODO Should be moved to can drop, call can drop here...

 /* if ((this._owner.id() == -1) && (!item.children(":last").getTest))
    return null;
  
  if ((sivFlavour == "sieve/action") && (this._owner.id() != -1))
    return null;*/
    
  if (sivFlavour == "sieve/test")
  {
    var elm = SieveLexer.createByName("condition/if",
            "if "+SieveLexer.createByName(type).toScript()+"{\r\n}\r\n");
            
    item.append(elm,this._owner.id());

    //Step 1 insert new  droptarget
    this._owner.dropTarget
      .before(
        (new SieveDropBoxUI(item,elm))
          .drop(new SieveConditionDropHandler())
          .getWidget())

    // ... now its getting a bit ugly, we can not always add an elsif ...
    // ... so we need two strategies. One is to...
    if (this._owner.getSieve()  && this._owner.getSieve().test)
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
    
    elm = SieveLexer.createByName("condition/else",
            "else {\r\n"+SieveLexer.createByName(type).toScript()+"\r\n}");
            
    item.append(elm);
    
    this._owner.dropTarget
      .before(
        (new SieveDropBoxUI(this._owner.parent,elm))
          .drop(new SieveBlockDropHandler())
          .getWidget())
      .before($("<div>").text("# ELSE"))          
      .before(elm.widget());      
  }
  else 
   throw "Incompatible drop";

  // TODO HTML!
     
  /*item.append(elm,this._owner.id());
  
  this._owner.dropTarget
    .before(
      (new SieveDropBoxUI(this._owner.parent,elm))
        .drop(new SieveConditionDropHandler())
        .getWidget())
    .before(elm.widget());*/  
}

//****************************************************************************//

// SieveTestDropHandler -> convert test to any of
