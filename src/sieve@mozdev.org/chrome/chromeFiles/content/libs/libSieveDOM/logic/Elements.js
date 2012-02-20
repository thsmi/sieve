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
function SieveAbstractElement(id)
{
  if (!id)
    throw new "Invalid id";
    
  this.id = id;
  
  this._parent = null;
}

// A shorthand to create children bound to this Element...
SieveAbstractElement.prototype._createByName = function(name, data) {    
  return SieveLexer.createByName(name,data).parent(this);
}
  
SieveAbstractElement.prototype._createByClass = function(types, data) {    
  return SieveLexer.createByClass(types,data).parent(this);
}
  
SieveAbstractElement.prototype._probeByName = function(name, data) {    
  return SieveLexer.probeByName(name, data);
}
  
SieveAbstractElement.prototype._probeByClass = function(types, data) {    
  return SieveLexer.probeByClass(types,data);
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
  throw "Implement toScript() for "+this.id;
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

/**
 * Creates
 * @return {}
 */
SieveAbstractElement.prototype.toWidget
    = function ()
{
  return null;     
}

SieveAbstractElement.prototype.id
    = function (id)
{
  return this.id;
}

SieveAbstractElement.prototype.parent
    = function (parent)
{
  if (typeof(parent) === "undefined")
    return this._parent;
  
  this._parent = parent;
  
  return this;
}

SieveAbstractElement.prototype.find
    = function (id)
{   
  return (this.id == id) ? this : null; 
}

SieveAbstractElement.prototype.require
    = function (imports)
{
}

// TODO only temporary, should be merged into remove...
SieveAbstractElement.prototype.removeChild
    = function ()
{
  throw "Implement SieveAbstractElement.removeChild";
}

/**
 * Removes this node from the parent Node.
 * 
 * @return {}
 */
SieveAbstractElement.prototype.remove
    = function ()
{
  // Locate our parent...
  if (!this._parent)
    throw "No parent Node";
    
  // ...and remove this node
  var elm = this._parent.removeChild(this.id);
  if (elm.id != this.id)
    throw "Could not remove Node";
    
  // ... finally cleanup all evidence to our parent Node;
  this._parent = null;
  
  return this;
}
