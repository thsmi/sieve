/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";
 
// TODO Add button to show selection source...

// //TODO move to own classfile...
//  with flavour -> sieve/action, sieve/test etc...
// TODO Implement "accepts" list
 
/**
 * can be an document or element...
 * @param {} elm
 *   Optional sieve element which should be bound to this box.
 */
function SieveAbstractBoxUI(elm)
{
  if (!elm)
   throw "Element expected";

  if (!elm.document && !elm.root)
    throw "Neiter a Sieve Element nor a Sieve Document";
    
  this._elm = elm;
}

/**
 * Return the nesteds unique id. In case no sieve element is bound to 
 * this element it return -1 
 * 
 * @return {int}
 *   An Integer as unique identifiert for the nested sieve element. 
 */
SieveAbstractBoxUI.prototype.id
    = function()
{
  if (this._elm.document)
    return this._elm.id()
    
  return -1;
}

/**
 * Returns the sieve Element bound to this box.
 * In case no element is bound, an exception will be thrown
 * 
 * @return {}
 *   the sieve object bound to this box
 */
SieveAbstractBoxUI.prototype.getSieve
    = function ()
{
  if (!this._elm.document)
    throw "No Sieve Element bound to this box";
    
  return this._elm;
}

SieveAbstractBoxUI.prototype.document
    = function()
{
  if (this._elm.document)
    return this._elm.document();
    
  return this._elm;
}

SieveAbstractBoxUI.prototype.getWidget
    = function ()
{
  throw "Implement getWidget()";
}

SieveAbstractBoxUI.prototype.toScript
    = function ()
{
  if (this._elm.document)
    return this._elm.toScript();
    
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
       event.dataTransfer.mozSetDataAt(this.flavour(),this.id(),1);
       event.dataTransfer.mozSetDataAt("application/sieve",""+this.getSieve().toScript(),2)
       event.dataTransfer.mozSetDataAt(this.flavour(),"move",3);
       

       break;
               
     case "create" :
       event.dataTransfer.mozSetDataAt(this.flavour(),this.getWidget().get(0),0);
       event.dataTransfer.mozSetDataAt(this.flavour(),this._elmType,1);
       event.dataTransfer.mozSetDataAt("application/sieve",this.toScript(),2);
       event.dataTransfer.mozSetDataAt(this.flavour(),"create",3);       
               
       break;
             
     default :
       throw "Unknown Action..."
   }
         
   // TODO use mouse event and calculate real offset istead of using 5,5...
   event.dataTransfer.setDragImage(this.getWidget().get(0),5,5);
  // event.preventDefault();
   event.stopPropagation();

   return true;   
}
 
SieveDragBoxUI.prototype.init
    = function ()
{
  return $("<div/>");
}

SieveDragBoxUI.prototype.getWidget
    = function ()
{
  if (this._domElm)
    return this._domElm;

  var _this = this;
    
  this._domElm = this.init()
    .addClass("SivElement")
    .attr("id","sivElm"+this.id())
    .attr("draggable","true")
    .bind("dragstart",function(e) {return _this.onDragGesture(e)});
         
  return this._domElm;
}

//****************************************************************************//

function SieveStackableDragBoxUI(elm)
{
  SieveDragBoxUI.call(this,elm);
  this.panels = [];
  this.selectedIndex = 0;
}

SieveStackableDragBoxUI.prototype.__proto__ = SieveDragBoxUI.prototype;

SieveStackableDragBoxUI.prototype.getPanel
    = function (idx)
{
  return this.panels[idx];
}

SieveStackableDragBoxUI.prototype.showPanel
    = function (idx)
{
  if (idx == this.selectedIndex)
    return;
  
  for (var i=0; i<this.panels.length; i++)
    this.panels[i].hide();
    
  this.selectedIndex = idx;
  
  return this.panels[idx].show();  
}

SieveStackableDragBoxUI.prototype.initPanels
    = function ()
{
}

SieveStackableDragBoxUI.prototype.init
    = function ()
{
  this.initPanels();

  var item = $("<div/>");
  
  for (var i=0; i<this.panels.length; i++)
    item.append(this.panels[i])
          
  this.showPanel(1);
  
  return item;  
}

/******************************************************************************/


// TODO Create Panel when needed, makes live easier espeically after changes and on validate
function SieveEditableDragBoxUI(elm)
{
  // Call parent constructor...
  SieveStackableDragBoxUI.call(this,elm);
}

// Inherrit from DragBox
SieveEditableDragBoxUI.prototype.__proto__ = SieveStackableDragBoxUI.prototype;

SieveEditableDragBoxUI.prototype.onValidate
    = function(e)
{
  return true;
}

SieveEditableDragBoxUI.prototype.showEditor
    = function(e)
{
  
  this.showPanel(0);
  this._domElm.attr("sivIsEditable",  "true");  
    
  return;
}

SieveEditableDragBoxUI.prototype.showSummary
    = function (e)
{
  if (!this.onValidate())
    return;
  
  this.showPanel(1);
  this._domElm.removeAttr("sivIsEditable");  
  
  return;
}

SieveEditableDragBoxUI.prototype.initPanels
    = function ()
{
  var _this = this;
   
  this.panels[0] = this.initEditor()
    .append($(document.createElement("div"))
      .append($(document.createElement("button"))
        .text("Ok")
        .click(function(e) {  _this.showSummary(); e.preventDefault();return true; } )));
        
  this.panels[1] = this.initSummary()
      .click(function(e) { _this.showEditor(); e.preventDefault();return true; } );
}    

/*****************************************************************************/

/**
 * 
 * @param {SieveAbstractElement} elm
 *   Either the Sieve element which should be bound to this box or the document.
 * @param {SieveAbstractBoxUI} parent
 *   The parent Sieve Element, to which dropped Elemenents will be added.  
 */
function SieveDropBoxUI(parent,elm)
{
  if (!parent)
    throw "Parent expected";
  
  if (elm && elm.document)
    SieveAbstractBoxUI.call(this,elm);
  else if (parent.document)
    SieveAbstractBoxUI.call(this,parent.document());
  else if (parent.root)
    SieveAbstractBoxUI.call(this,parent);
  else
    throw ("Either a docshell or an elements expected")
    
  if (parent.document)
    this._parent = parent;
    
  this.dropTarget = null;
  
  this.drop(new SieveDropHandler());
}

SieveDropBoxUI.prototype.__proto__ = SieveAbstractBoxUI.prototype;

SieveDropBoxUI.prototype.onDragEnter
    = function (event)
{
  if (!this.handler.canDrop(event))
    return true;
    
  this.dropTarget.attr("sivDragging", "true");
  return true;
}

SieveDropBoxUI.prototype.onDragExit
    = function (event)
{
  this.dropTarget.removeAttr("sivDragging");    
  return true;
}
      
SieveDropBoxUI.prototype.onDragOver
    = function (event)
{   
  if (!this.handler.canDrop(event))
    return true;
    
  this.dropTarget.attr("sivDragging", "true");
  event.preventDefault();
  
  return true;         
}

SieveDropBoxUI.prototype.onDragDrop
    = function (event)
{
  this.dropTarget.removeAttr("sivDragging");
  
  if (this.handler.drop(event))
    event.preventDefault();
    
  return true;
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
      //.attr("id","SivElm"+this.id())
      .bind("dragdrop",function(e) { return _this.onDragDrop(e)})
      .bind("dragover",function(e) { return _this.onDragOver(e)})
      .bind("dragexit",function(e) { return _this.onDragExit(e)})
      .bind("dragenter",function(e) { return _this.onDragEnter(e)})
      /*.text(this.id()+"@"+this.parentId+" ["+this.handler.flavours()+"]")*/;           

  return this.dropTarget
}


SieveDropBoxUI.prototype.drop
    = function (handler)
{
  if (typeof(handler) === "undefined")
    return this.handler;
    
   //release old handler
   if (this.handler)
     this.handler.bind(null);
    
   this.handler = handler;
   this.handler.bind(this);
   
   return this;
}

SieveDropBoxUI.prototype.parent
    = function ()
{
  return this._parent;
}

//****************************************************************************//

function SieveTrashBoxUI(docshell)
{
  // Call parent constructor...
  SieveDropBoxUI.call(this,docshell);
  
  this.drop(new SieveTrashBoxDropHandler());
}

// Inherrit from DragBox
SieveTrashBoxUI.prototype.__proto__ = SieveDropBoxUI.prototype;


