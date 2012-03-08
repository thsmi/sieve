/*
 * The content of this file is licenced. You may obtain a copy of the license
 * at http://sieve.mozdev.org or request it via email from the author. 
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *   
 */

// Enable Strict Mode
"use strict";

/**
 * 
 * @param {} id
 */
function SieveAbstractElement(docshell, id)
{
  if (!id)
    throw "Invalid id";
    
  this._id = id;
  
  this._parent = null;
  this._docshell = docshell;
}

// A shorthand to create children bound to this Element...
SieveAbstractElement.prototype._createByName = function(name, data) {    
  return this._docshell.createByName(name, data, this);
}
  
SieveAbstractElement.prototype._createByClass = function(types, data) {    
  return this._docshell.createByClass(types, data, this);
}
  
SieveAbstractElement.prototype._probeByName = function(name, data) {    
  return this._docshell.probeByName(name, data);
}
  
SieveAbstractElement.prototype._probeByClass = function(types, data) {    
  return this._docshell.probeByClass(types,data);
}  


/**
 * 
 * @param {} data
 */
SieveAbstractElement.prototype.init 
    = function (data)
{
  throw "Implement me"
}

SieveAbstractElement.prototype.toScript
    = function ()
{
  throw "Implement toScript() for "+this._id;
}

/**
 * Returns the new Widget bound to this element.
 * @return {}
 */
SieveAbstractElement.prototype.widget
    = function ()
{  
  if (!this._widget)
    this._widget = this.toWidget()
    
  return this._widget;       
}

SieveAbstractElement.prototype.html
   = function (refresh)
{
  if (typeof(refresh) !== "undefined")
    if (refresh)
      this.widget().refresh();
      
  if (this.widget() == null)
    return null;
    
  return this.widget().html();
}

/**
 * Creates
 * @return {}
 */
SieveAbstractElement.prototype.toWidget
    = function ()
{
  return null;     
}

SieveAbstractElement.prototype.document
    = function ()
{  
  return this._docshell;
}

/**
 * Returns the unique identifier for this element.
 * 
 * In case the parameter "id" the default pehavioud is inverted. Instead of 
 * returning a unique idetifier for this element, a reverse lookup is started
 * and the SieveElement with a matchin id is returned.
 *
 * @param @optional {int} id
 *   defines to use a reverse lookup 
 * @return {}
 *   
 */
SieveAbstractElement.prototype.id
    = function (id)
{
  if (typeof(id) === "undefined")
    return this._id;
    
  return this._docshell.id(id);
}

SieveAbstractElement.prototype.parent
    = function (parent)
{
  if (typeof(parent) === "undefined")
    return this._parent;
  
  this._parent = parent;
  
  return this;
}

SieveAbstractElement.prototype.require
    = function (imports)
{
}

// TODO only temporary, should be merged into remove...
/*SieveAbstractElement.prototype.removeChild
    = function ()
{
  throw "Implement SieveAbstractElement.removeChild";
}*/

/**
 * Removes this node from the parent Node.
 * 
 * @return {}
 */
SieveAbstractElement.prototype.remove
    = function (cascade)
{
  // Locate our parent...
  if (!this._parent)
    throw "No parent Node";
    
  // ...and remove this node
  var elm = this._parent.removeChild(this._id,cascade);
  if ((!cascade) && (elm.id() != this._id))
    throw "Could not remove Node";
    
  // ... finally cleanup all evidence to our parent Node;
  this._parent = null;
  
  return elm;
}

//****************************************************************************//

function SieveAbstractBlock(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  
  // Initialize Block Elements
  this.elms = [];
}

SieveAbstractBlock.prototype.__proto__ = SieveAbstractElement.prototype;

SieveAbstractBlock.prototype.children
    = function (idx)
{
  if (typeof(idx) === "undefined")
    return this.elms;  
    
  if ((typeof(idx) === "string")  && (idx.toLowerCase() == ":last"))
    idx = this.elms.length-1;    
    
  return this.elms[idx];
}

/**
 * Appends an Element to this Element. Inf the element is alread existant, it will be moved
 * 
 * @param {} elm
 *   the element that should be appened
 * @param @optional {int} siblingId
 *   defines the sibling after which the new element should be inserted. 
 *   In case no matching sibling is found, it will be appended at the end.
 * @return {}
 */
SieveAbstractBlock.prototype.append
    = function (elm, siblingId)
{
  // we have to do this fist as there is a good chance the the index
  // might change after deleting...
  if(elm.parent())
    elm.remove();
  
  var idx = this.elms.length;
  
  if ((typeof(siblingId) !== "undefined") && (siblingId >= 0)) 
    for (var idx = 0; idx<this.elms.length; idx++)
      if (this.elms[idx].id() == siblingId)
        break;

  this.elms.splice(idx,0,elm);
  elm.parent(this);
    
  return this;
}

// TODO Merge with "remove" when its working as it should
/**
 * Removes the node including all child elements.
 * 
 * To remove just a child node pass it's id as an argument
 * 
 *  @param @optional {int} childId
 *  the child id which should be removed.
 *    
 * @return {}
 */
SieveAbstractBlock.prototype.removeChild
    = function (childId,cascade)
{
  // should we remove the whole node
  if (typeof (childId) === "undefined")
     throw "Child ID Missing";
    //return SieveAbstractElement.prototype.remove.call(this);
  
    
  // ... or just a child item
  var elm = null;
  // Is it a direct match?
  for (var i=0; i<this.elms.length; i++)
  {
    if (this.elms[i].id() != childId)
      continue;
    
    elm = this.elms[i];
    elm.parent(null);
    
    this.elms.splice(i,1);
    
    break;
  }
  
  if (cascade && this.empty())
    return this.remove(cascade);
    
  if (cascade)
    return this;
    
  return elm;
}

SieveAbstractBlock.prototype.empty
    = function ()
{
  // The direct descendants of our root node are always considered as
  // not empty. Otherwise cascaded remove would wipe them away.
  if (this.document().root() == this.parent())
    return false;
  
  for (var i=0; i<this.elms.length; i++)
    if (this.elms[i].widget())
      return false;
      
  return true;
}

SieveAbstractBlock.prototype.require
    = function (imports)
{
  for (var i=0; i<this.elms.length; i++)
    this.elms[i].require(imports)
}
