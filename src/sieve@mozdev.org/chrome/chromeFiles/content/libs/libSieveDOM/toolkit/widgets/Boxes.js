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

SieveAbstractBoxUI.prototype.createHtml
    = function ()
{
  
  throw "Implement html()";      
}

SieveAbstractBoxUI.prototype.html
    = function ()
{    
  if (this._domElm)
    return this._domElm;
    
  this._domElm = this.createHtml();
  
  return this._domElm;
}

SieveAbstractBoxUI.prototype.refresh
    = function ()
{
  if (this.id() < 0)
    throw "Invalid id";
   
  this._domElm = null;
  
  $("#sivElm"+this.id()).replaceWith(this.html());
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
  // just primitives are safe
  switch (this._action)
  {
     case "move" :
       // FIXME: test/plain is interpreted as link if an exception occures during drag an drop
       //event.dataTransfer.mozSetDataAt("text/plain",""+this.getSieve().toScript(),0);
       event.dataTransfer.mozSetDataAt("application/sieve",""+this.getSieve().toScript(),0);
       event.dataTransfer.mozSetDataAt(this.flavour(),
          { id: this.id(), action:"move"},0);        

       break;
               
     case "create" :
       // TODO: Fix me
       //event.dataTransfer.mozSetDataAt("text/plain",""+this.getSieve().toScript(),0)
       event.dataTransfer.mozSetDataAt("application/sieve",this.toScript(),0);
       event.dataTransfer.mozSetDataAt(this.flavour(),
          { type: this._elmType, action:"create"} ,0);
       
               
       break;
             
     default :
       throw "Unknown Action..."
   }
         
   // TODO use mouse event and calculate real offset istead of using 5,5...
   event.dataTransfer.setDragImage(this.html().get(0),5,5);
   //event.preventDefault();
   event.stopPropagation();

   return true;   
}
 
SieveDragBoxUI.prototype.init
    = function ()
{
  return $("<div/>");
}


SieveDragBoxUI.prototype.html
    = function (invalidate)
{ 
  if (this._domElm && !invalidate) 
    return this._domElm;
  
  var _this = this;
    
  this._domElm = this.init()
    .addClass("SivElement")
    .attr("draggable","true")
    .bind("dragstart",function(e) { _this.onDragGesture(e); return true;})
    .bind("dragend", function (e) { return false; });
    
  if (this.id() >= 0)
    this._domElm.attr("id","sivElm"+this.id());
  
  return this._domElm;
}


/******************************************************************************/


function SieveEditableDragBoxUI(elm)
{
  // Call parent constructor...
  SieveDragBoxUI.call(this,elm);
}

// Inherrit from DragBox
SieveEditableDragBoxUI.prototype.__proto__ =  SieveDragBoxUI.prototype;

SieveEditableDragBoxUI.prototype.onValidate
    = function(e)
{
  return true;
}

SieveEditableDragBoxUI.prototype.showEditor
    = function(e)
{ 
  if (!this.initEditor)
    return;
    
  var _this = this;      
      
  this._domElm.children(".sivSummaryContent").remove();
  
  // TODO Add close Button next to help button
  if (this.initHelp)
    this._domElm
      .append($("<div/>")
        .addClass("sivEditorHelpIcon")
        .click(function() { $(this)/*.toggle()*/.next().toggle();}))
      .append(this.initHelp()
        .click(function() { $(this).toggle()/*.next().toggle()*/;})
        .addClass("sivEditorHelpText"))    
      
  this._domElm    
    .attr("sivIsEditable",  "true")
    .append(this.initEditor()
      .addClass("sivEditorContent"))
    .append($("<div/>")
      .addClass("sivControlBox")
      .append($("<button/>")
        .text("Ok")
        .click(function(e) { _this.showSummary();   e.preventDefault(); return true; } ))
      .append($("<div/>")));
    
}

SieveEditableDragBoxUI.prototype.showSummary
    = function (e)
{
  try
  {
    this.onValidate()
  }
  catch (ex)
  {
    this._domElm.find(".sivControlBox > div").text(ex);
    return;
  }
    
  var _this = this;
    
  this._domElm
    .removeAttr("sivIsEditable")
      .children(".sivEditorContent,.sivControlBox,.sivEditorHelpText,.sivEditorHelpIcon")
        .remove()
      .end()
      .append(this.initSummary()
        .addClass("sivSummaryContent")
        .click(function(e) { _this.showEditor();   e.preventDefault(); return true; } ));
        
  return;
} 

SieveEditableDragBoxUI.prototype.init
    = function ()
{
  var _this = this;
   
  return $("<div/>")
      .addClass((this.initEditor)?"sivEditableElement":"")
      .append(this.initSummary()
        .addClass("sivSummaryContent")
        .click(function(e) { _this.showEditor();   e.preventDefault(); return true; } ));
}

/*****************************************************************************/

function SieveTestBoxUI(elm)
{
  // Call parent constructor...
  SieveEditableDragBoxUI.call(this,elm);
  this.flavour("sieve/test");  
  this._dropBox = (new SieveDropBoxUI(this,this.getSieve())).drop(new SieveTestDropHandler()); 
}

SieveTestBoxUI.prototype.__proto__ =  SieveEditableDragBoxUI.prototype;

SieveTestBoxUI.prototype.refresh
    = function ()
{
  if (this.id() < 0)
    throw "Invalid id";
    
  this.html(true);
}


SieveTestBoxUI.prototype.html
    = function (invalidate)
{ 
  if (this._dragBox && !invalidate) 
    return this._dragBox;
       
  var box = this._dropBox.html(true)
    .append(SieveEditableDragBoxUI.prototype.html.call(this,true));
    
  if (this._dragBox)
  {
    this._dragBox.before(box);    
    this._dragBox.remove();
  }
    
  this._dragBox = box;  
  
  return this._dragBox;
}

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
  
  return false;
}

SieveDropBoxUI.prototype.onDragExit
    = function (event)
{
  this.dropTarget.removeAttr("sivDragging");
  
  return false;
}
      
SieveDropBoxUI.prototype.onDragOver
    = function (event)
{   
  if (!this.handler.canDrop(event))
    return true;
    
  this.dropTarget.attr("sivDragging", "true");
  
  return false;         
}

SieveDropBoxUI.prototype.onDragDrop
    = function (event)
{
  this.dropTarget.removeAttr("sivDragging");
  
  if (!this.handler.drop(event))
    return true;

  return false;
}

SieveDropBoxUI.prototype.html
    = function (invalidate,cascade)
{
  if (this.dropTarget && !invalidate)
    return this.dropTarget;
  
  var _this = this;
  this.dropTarget = 
     $("<div/>")
      .addClass("sivDropBox")
      //.attr("id","SivElm"+this.id())
      .bind("drop",function(e) { return _this.onDragDrop(e) })
      .bind("dragover",function(e) { return _this.onDragOver(e) })
      .bind("dragleave",function(e) { return _this.onDragExit(e) })
      .bind("dragenter",function(e) { return _this.onDragEnter(e) });
      //.text(this.id()+"@"+((this.parent())?this.parent().id():"-1")+" ["+this.handler.flavours()+"]");           
    
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
