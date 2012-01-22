/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 
// TODO Add button to show selection source...


// //TODO move to own classfile...
//  with flavour -> sieve/action, sieve/test etc...
// TODO Implement "accepts" list
 
/**
 * 
 * @param {} elm
 *   Optional sieve element which should be bound to this box.
 */
function SieveAbstractBoxUI(elm)
{ 
  if (elm)
    this._sivElm = elm;
}

/**
 * Return the nesteds unique id. In case no sieve element is bound to 
 * this element it return -1 
 * 
 * @return {int}
 *   An Integer as unique identifiert for the nested sieve element. 
 */
SieveAbstractBoxUI.prototype.getId
    = function()
{
  if (this._sivElm)
    return this._sivElm.id
    
  return -1;
}

SieveAbstractBoxUI.prototype.getSieve
    = function ()
{
  return this._sivElm;
}

SieveAbstractBoxUI.prototype.getWidget
    = function ()
{
  throw "Implement getWidget()";
}

SieveAbstractBoxUI.prototype.toScript
    = function ()
{
  if (this._sieveElm)
    return _sieveElm.toScript();
    
  return "";
}

/**
 * 
 * @param {} elm
 */
function SieveDragBoxUI(elm)
{
  // Call parent constructor...
  SieveAbstractBoxUI.call(this,elm);
}

// Inherrit from DragBox
SieveDragBoxUI.prototype.__proto__ = SieveAbstractBoxUI.prototype;  

SieveDragBoxUI.prototype._action = "move";
SieveDragBoxUI.prototype._flavour = "sieve/action";

SieveDragBoxUI.prototype.flavour
    = function (flavour)
{
  if (typeof(flavour) === 'undefined' )
    return this._flavour;
  
  this._flavour = flavour;
  
  return this;
}

SieveDragBoxUI.prototype.onDragGesture
    = function(event)
{
  if (!this._domElm)
    throw "Freefloating DOM Element...";
    
  event = event.originalEvent;
  // keep in mind we can not pass javascript object through drag & drop
   switch (this._action)
   {
     case "move" :
       event.dataTransfer.mozSetDataAt(this.flavour(),this.getWidget().get(0),0);
       event.dataTransfer.mozSetDataAt(this.flavour(),this.getWidget().get(0).previousSibling,1);
       event.dataTransfer.mozSetDataAt(this.flavour(),this.getId(),2);
       event.dataTransfer.mozSetDataAt(this.flavour(),"move",3);
       event.dataTransfer.mozSetDataAt("application/sieve",this.toScript(),4)

       break;
               
     case "create" :
       event.dataTransfer.mozSetDataAt(this.flavour(),this.getWidget().get(0),0);
       event.dataTransfer.mozSetDataAt(this.flavour(),this._elmType,1);
       event.dataTransfer.mozSetDataAt(this.flavour(),"",2);
       event.dataTransfer.mozSetDataAt(this.flavour(),"create",3);
       event.dataTransfer.mozSetDataAt("application/sieve",this.toScript(),4)
               
       break;
             
     default :
       throw "Unknown Action..."
   }
           
   // TODO use mouse event and calculate real offset istead of using 5,5...
   event.dataTransfer.setDragImage(this.getWidget().get(0),5,5);
   event.stopPropagation();

   return true;   
}
 
SieveDragBoxUI.prototype.init
    = function ()
{
  return $(document.createElement("div"))      
}

SieveDragBoxUI.prototype.getWidget
    = function ()
{
  if (this._domElm)
    return this._domElm;

  var _this = this;
    
  this._domElm = this.init()
    .addClass("SivElement")
    .attr("draggable","true")
    .bind("dragstart",function(e) { return _this.onDragGesture(e)})
    .click(function(e) { return false; } );
         
  return this._domElm;
}

/******************************************************************************/

function SieveEditableDragBoxUI(elm)
{
  // Call parent constructor...
  SieveDragBoxUI.call(this,elm);
}

// Inherrit from DragBox
SieveEditableDragBoxUI.prototype.__proto__ = SieveDragBoxUI.prototype;

SieveEditableDragBoxUI.prototype.onValidate
    = function(e)
{
  return true;
}

SieveEditableDragBoxUI.prototype.showEditor
    = function(e)
{
  //e.stopPropagation();
  /*if (e) 
  {
    e.stopPropagation();
    e.preventDefault();
  }*/

  this.editor
    .removeAttr("sivIsEditable")
    .show();
    
  this.summary
    .hide();
    
  return;
}

SieveEditableDragBoxUI.prototype.showSummary
    = function (e)
{
  /*if (e) 
  {
    e.stopPropagation();
    e.preventDefault();
  }*/
  //e.stopPropagation();
  
  if (!this.onValidate())
    return;
    
  this.editor
    .attr("sivIsEditable","true")
    .hide();
    
  this.summary.show(); 
  
  return;
}

SieveEditableDragBoxUI.prototype.getWidget
    = function ()
{
  if (this._domElm)
    return this._domElm;
  
  var _this = this;
  
  this.editor = this.initEditor()
    .append($(document.createElement("div"))
      .append($(document.createElement("button"))
        .text("Apply")
        .click(function(e) { _this.showSummary(); return false; } )));

        
  this.summary = this.initSummary()
      .click(function(e) { _this.showEditor(); return false; } );
      
  // Invoke parent method, to get a drag Box 
  return $(SieveDragBoxUI.prototype.getWidget.call(this))
    .attr("sivElmType","editable")
    .append(this.summary
      .show())
    .append(this.editor
      .hide())
}

/*****************************************************************************/

/**
 * 
 * 
 * @param {} parentId
 *   Identifier of the parent Sieve Element, to which dropped
 *   Elemenents will be added.
 * @optional @param {SieveAbstractElement} elm
 *   Optional sieve element which should be bound to this box.  
 */
function SieveDropBoxUI(parentId,elm)
{
  SieveAbstractBoxUI.call(this,elm);
  
  this.dropTarget = null;
  
  if (!parentId)
    throw "Invalid parent ID:"+parentId;
    
  this.parentId = parentId;
  
  //this._flavour = ["sieve/action"];
}

SieveDropBoxUI.prototype.__proto__ = SieveAbstractBoxUI.prototype;

SieveDropBoxUI.prototype._flavours = [];

SieveDropBoxUI.prototype.flavours
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

SieveDropBoxUI.prototype.canDrop
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
    
    
    if ((elm.nextSibling) && (elm.nextSibling === this.dropTarget.get(0)))
      return false;
    
    if ((elm.previousSibling) && (elm.previousSibling === this.dropTarget.get(0)))
      return false;
          
  // ... or onto a parent into his child block          
/*  for (var node = this.dropTarget; node; node = node.parentNode)
    if (node.isSameNode(event.dataTransfer.mozGetDataAt(sivFlavour,0)))
      return false;*/
          
  return true;
}

SieveDropBoxUI.prototype.moveElement
    = function(sivFlavour,event)
{
  event = event.originalEvent;
   
  var dragElm = dom.remove(event.dataTransfer.mozGetDataAt(sivFlavour,2));
           
  if (!dragElm)
    throw "No Element found for "+event.dataTransfer.mozGetDataAt(sivFlavour,2); 
  
  //... lets update the sieve dom and move the node to his new position...
  dom.append(this.parentId,dragElm,this.getId());

  // ... remove droptarget infront of the last object's last position ...
  $(event.dataTransfer.mozGetDataAt(sivFlavour,0))
    .prev()
      .remove();
  
  // ... and add a new one directly before it's new positon ...
  this.dropTarget
    .before((new SieveDropBoxUI(this.parentId,dragElm)).flavours(this.flavours()).getWidget())
    .before(event.dataTransfer.mozGetDataAt(sivFlavour,0));          
}

SieveDropBoxUI.prototype.createElement
    = function(sivFlavour,event)
{
  event = event.originalEvent;
  
  var elm = SieveLexer.createByName(
               event.dataTransfer.mozGetDataAt(sivFlavour,1));

  dom.append(this.parentId,elm,this.getId());
  
  this.dropTarget
    .before((new SieveDropBoxUI(this.parentId,elm)).getWidget())
    .before(elm.toWidget());  
}

SieveDropBoxUI.prototype.onDragEnter
    = function (event)
{   
  for (var i=0; i<this.flavours().length; i++)
    if (this.canDrop(this.flavours()[i],event))
      this.dropTarget.attr("sivDragging", "true");
  
  return true;
}

SieveDropBoxUI.prototype.onDragExit
    = function (event)
{      
  for (var i=0; i<this.flavours().length; i++)
    if (this.canDrop(this.flavours()[i],event))
      this.dropTarget.removeAttr("sivDragging");
      
  return true;
}
      
SieveDropBoxUI.prototype.onDragOver
    = function (event)
{
  for (var i=0; i<this.flavours().length; i++)
  {
    if (this.canDrop(this.flavours()[i],event))
    {
      this.dropTarget.attr("sivDragging", "true");
      return false;
    /*  event.stopPropagation(); 
      event.preventDefault();
            
      return;*/          
    }
  }
  
  return true;
}

SieveDropBoxUI.prototype.onDragDrop
    = function (event)
{  
  for (var i=0; i<this.flavours().length; i++)
  {
    if ( !this.canDrop(this.flavours()[i],event) )
      continue;
      
    this.dropTarget.removeAttr("sivDragging");       
        
    switch (event.originalEvent.dataTransfer.mozGetDataAt(this.flavours()[i],3))
    {
      case "move" :
        this.moveElement(this.flavours()[i],event);
        return false;
            
      case "create" :
        this.createElement(this.flavours()[i],event);
        return false;
    }
  }
  
  return true;
  // TODO hookup listener ...           
  //event.stopPropagation();  
}

SieveDropBoxUI.prototype.getWidget
    = function ()
{
  if (this.dropTarget)
    return this.dropTarget;
  
  var _this = this;
  this.dropTarget = 
    $(document.createElement("div"))
      .addClass("sivDropBox")
      .bind("dragdrop",function(e) { return _this.onDragDrop(e)})
      .bind("dragover",function(e) { return _this.onDragOver(e)})
      .bind("dragexit",function(e) { return _this.onDragExit(e)})
      .bind("dragenter",function(e) { return _this.onDragEnter(e)})
      .text(this.getId()+"@"+this.parentId+" ["+this.flavours()+"]");           

  return this.dropTarget
}


/******************************************************************************/

function SieveTrashBoxUI(flavours)
{
  // Call parent constructor...
  SieveDropBoxUI.call(this,-1);
  this.flavours(flavours);
}

// Inherrit from DragBox
SieveTrashBoxUI.prototype.__proto__ = SieveDropBoxUI.prototype;

SieveTrashBoxUI.prototype.canDrop
    = function(sivFlavour, event)
{
  // accept only the registered drop flavour...
  if ( ! event.originalEvent.dataTransfer.mozGetDataAt(sivFlavour,0))
    return false;
            
  if (event.originalEvent.dataTransfer.mozGetDataAt(sivFlavour,3) != "move")
    return false; 
            
  return true;  
}

SieveTrashBoxUI.prototype.createElement
    = function (sivFlavour,event)
{
}

SieveTrashBoxUI.prototype.moveElement
    = function(sivFlavour,event)
{
  event = event.originalEvent;
  
  var dragElm = dom.remove(event.dataTransfer.mozGetDataAt(sivFlavour,2));
           
  if (!dragElm)
    throw "No Element found for "+event.dataTransfer.mozGetDataAt(sivFlavour,2); 
               
  
  // delete node and the corresponding dropbox...
  $(event.dataTransfer.mozGetDataAt(sivFlavour,0))
    .prev()
      .remove()
      .end()
    .remove();
}

// TODO: DELETE ME just a Temporary object for backward kompatibility
function SivDropTarget(parentId,elm)
{
  SieveDropBoxUI.call(this,parentId,elm);
}

SivDropTarget.prototype.__proto__ = SieveDropBoxUI.prototype;

SivDropTarget.prototype.getWidget
    = function ()
{
  return SieveDropBoxUI.prototype.getWidget.call(this).get(0)  
}
