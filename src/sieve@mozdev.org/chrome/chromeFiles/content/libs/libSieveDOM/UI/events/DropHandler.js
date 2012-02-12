/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

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
  this.owner = owner;
}

SieveDropHandler.prototype.onDrop
    = function(flavour,event)
{
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
    
    
    if ((elm.nextSibling) && (elm.nextSibling === this.owner.dropTarget.get(0)))
      return false;
    
    if ((elm.previousSibling) && (elm.previousSibling === this.owner.dropTarget.get(0)))
      return false;
          
  // ... or onto a parent into his child block          
/*  for (var node = this.dropTarget; node; node = node.parentNode)
    if (node.isSameNode(event.dataTransfer.mozGetDataAt(sivFlavour,0)))
      return false;*/
          
  return true;
}


SieveBlockDropHandler.prototype.onDrop
    = function (flavour, event)
{
  switch (event.originalEvent.dataTransfer.mozGetDataAt(flavour,3))
  {
    case "create" :
      this.createElement(flavour,event);
      return false;

    case "move" :
      this.moveElement(flavour,event);
      return false;
  }

  return true;  
}

SieveBlockDropHandler.prototype.moveElement
    = function(sivFlavour,event)
{
  event = event.originalEvent;
     
  var dragElm = dom.findParent(event.dataTransfer.mozGetDataAt(sivFlavour,2));
  if(!dragElm)
    throw "Block Drop Handler: No Element found for "+event.dataTransfer.mozGetDataAt(sivFlavour,2);
  
  dragElm = dragElm.remove(event.dataTransfer.mozGetDataAt(sivFlavour,2));
           
  if (!dragElm)
    throw "Block Drop Handler: No Element found for "+event.dataTransfer.mozGetDataAt(sivFlavour,2); 
  
  var item = dom.find(this.owner.parentId);
  
  if (!item)
    throw "Block Drop Handler: No Element found for "+this.owner.parentId;
  
  //... lets update the sieve dom and move the node to his new position...
  item.append(dragElm,this.owner.getId());

  // ... remove droptarget infront of the last object's last position ...
  $(event.dataTransfer.mozGetDataAt(sivFlavour,0))
    .prev()
      .remove();
  
  // ... and add a new one directly before it's new positon ...
  this.owner.dropTarget
    .before(
      (new SieveDropBoxUI(this.owner.parentId,dragElm))
        .drop(new SieveBlockDropHandler())
        .getWidget())
    .before(event.dataTransfer.mozGetDataAt(sivFlavour,0));          
}

SieveBlockDropHandler.prototype.createElement
    = function(sivFlavour,event)
{  
  event = event.originalEvent;
  
  var type = event.dataTransfer.mozGetDataAt(sivFlavour,1);
    
  var item = dom.find(this.owner.parentId);
  
  if(!item)
    throw "Element "+this.owner.parentId+" not found";
  
  var elm = null;
  
  if (sivFlavour == "sieve/test")
    elm = SieveLexer.createByName("condition",
            "if "+SieveLexer.createByName(type).toScript()+"{\r\n}\r\n");
  else
    elm = SieveLexer.createByName(type);
  
  item.append(elm,this.owner.getId());
  

  
  this.owner.dropTarget
    .before(
      (new SieveDropBoxUI(this.owner.parentId,elm))
        .drop(new SieveBlockDropHandler())
        .getWidget())
    .before(elm.toWidget());  
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

SieveTrashBoxDropHandler.prototype.onDrop
    = function (flavour, event)
{
  if (event.originalEvent.dataTransfer.mozGetDataAt(flavour,3) != "move")
    return true;
    
  event = event.originalEvent;
  
  var item = dom.findParent(event.dataTransfer.mozGetDataAt(flavour,2));
  if(!item)
    throw "Trash Drop Handler: No Element found for "+event.dataTransfer.mozGetDataAt(flavour,2);
    
  var item = item.remove(event.dataTransfer.mozGetDataAt(flavour,2));
           
  if (!item)
    throw "Trash Drop Handler: No Element found for "+event.dataTransfer.mozGetDataAt(flavour,2); 
  
  // delete node and the corresponding dropbox...
  $(event.dataTransfer.mozGetDataAt(flavour,0))
    .prev()
      .remove()
      .end()
    .remove();
    
  return false
}

//****************************************************************************//

//****************************************************************************//

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
           if (this.owner.getId() != -1)
             return false;
           break;
           
        case "sieve/test":
           // ... for tests everything before the last elemen is ok
           if (this.owner.getId() != -1)
             return true;
           break;
           
        default :
          alert("default");
          // nothing Compatible was dropped to return false
          return false;
      }
      
      // ... ok, with the last element we have to do some extra work... 
       var item = dom.find(this.owner.parentId) 
      
       if (!item)
         return false;

      // ... if the last element has no test, then it has to be an else...         
      if (!item.children(":last").getTest)
         return false;
      
      // ... if not we are safe to add elements to it
      return true;
    }
            
    if (event.dataTransfer.mozGetDataAt(sivFlavour,3) != "move")
      return false; 

    // in case the element is dragged onto the droptarget directly behind or ...
    // ... in front we can just skip the request.    
    var elm = event.dataTransfer.mozGetDataAt(sivFlavour,0);
    
    
    if ((elm.nextSibling) && (elm.nextSibling === this.owner.dropTarget.get(0)))
      return false;
    
    if ((elm.previousSibling) && (elm.previousSibling === this.owner.dropTarget.get(0)))
      return false;
          
  // ... or onto a parent into his child block          
/*  for (var node = this.dropTarget; node; node = node.parentNode)
    if (node.isSameNode(event.dataTransfer.mozGetDataAt(sivFlavour,0)))
      return false;*/
          
  return true;
}


SieveConditionDropHandler.prototype.onDrop
    = function (flavour, event)
{
  switch (event.originalEvent.dataTransfer.mozGetDataAt(flavour,3))
  {
    case "create" :
      this.createElement(flavour,event);
      return false;

    case "move" :
      this.moveElement(flavour,event);
      return false;
  }

  return true;  
}

SieveConditionDropHandler.prototype.moveElement
    = function(sivFlavour,event)
{
  event = event.originalEvent;
     
  var dragElm = dom.findParent(event.dataTransfer.mozGetDataAt(sivFlavour,2));
  if(!dragElm)
    throw "No Element found for "+event.dataTransfer.mozGetDataAt(sivFlavour,2);
  
  dragElm = dragElm.remove(event.dataTransfer.mozGetDataAt(sivFlavour,2));
           
  if (!dragElm)
    throw "No Element found for "+event.dataTransfer.mozGetDataAt(sivFlavour,2); 
  
  var item = dom.find(this.owner.parentId);
  
  if (!item)
    throw "No Element found for "+this.owner.parentId;
  
  //... lets update the sieve dom and move the node to his new position...
  item.append(dragElm,this.owner.getId());

  // ... remove droptarget infront of the last object's last position ...
  $(event.dataTransfer.mozGetDataAt(sivFlavour,0))
    .prev()
      .remove();
  
  // ... and add a new one directly before it's new positon ...
  this.owner.dropTarget
    .before(
      (new SieveDropBoxUI(this.owner.parentId,dragElm))
        .drop(new SieveConditionDropHandler())
        .getWidget())
    .before(event.dataTransfer.mozGetDataAt(sivFlavour,0));          
}

SieveConditionDropHandler.prototype.createElement
    = function(sivFlavour,event)
{    
  event = event.originalEvent;
  
  var type = event.dataTransfer.mozGetDataAt(sivFlavour,1);
    
  // The new home for our element
  var item = dom.find(this.owner.parentId);
  
  if(!item)
    throw "Element "+this.owner.parentId+" not found";
        
  // TODO Should be moved to can drop, call can drop here...
  

 /* if ((this.owner.getId() == -1) && (!item.children(":last").getTest))
    return null;
  
  if ((sivFlavour == "sieve/action") && (this.owner.getId() != -1))
    return null;*/
    
  if (sivFlavour == "sieve/test")
  {
    elm = SieveLexer.createByName("condition/if",
            "if "+SieveLexer.createByName(type).toScript()+"{\r\n}\r\n");
            
    item.append(elm,this.owner.getId());

    //Step 1 insert new  droptarget
    this.owner.dropTarget
      .before(
        (new SieveDropBoxUI(item.id,elm))
          .drop(new SieveConditionDropHandler())
          .getWidget())

    // ... now its getting a bit ugly, we can not always add an elsif ...
    // ... so we need two strategies. One is to...
    if (this.owner.getSieve()  && this.owner.getSieve().getTest)
      // ... reuse the existing if or elsif,
      this.owner.dropTarget
        .before(this.owner.dropTarget.next())
        .after($("<div>").text("#ELSE IF "));
    else 
      // ... the otherone append new elsif
      this.owner.dropTarget
        .before($("<div>").text("#ELSE IF "))   
        
    // Finally we can insert our Element.        
    this.owner.dropTarget
        .before(elm.toWidget())
  }
  else if (sivFlavour == "sieve/action")
  {
    
    elm = SieveLexer.createByName("condition/else",
            "else {\r\n"+SieveLexer.createByName(type).toScript()+"\r\n}");
            
    item.append(elm);
    
    this.owner.dropTarget
      .before(
        (new SieveDropBoxUI(this.owner.parentId,elm))
          .drop(new SieveBlockDropHandler())
          .getWidget())
      .before($("<div>").text("# ELSE"))          
      .before(elm.toWidget());      
  }
  else 
   throw "Incompatible drop";

  // TODO HTML!
     
  /*item.append(elm,this.owner.getId());
  
  this.owner.dropTarget
    .before(
      (new SieveDropBoxUI(this.owner.parentId,elm))
        .drop(new SieveConditionDropHandler())
        .getWidget())
    .before(elm.toWidget());*/  
}
