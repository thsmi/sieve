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
}

/**
 * 
 * @param {} data
 */
SieveAbstractElement.prototype.init 
    = function (data)
{
  throw "Implement init() for "+this.id;      
}

SieveAbstractElement.prototype.toScript
    = function ()
{
  throw "Implement toScript() for "+this.id;
}

SieveAbstractElement.prototype.toWidget
    = function ()
{
  return null;     
}


SieveAbstractElement.prototype.findParent
    = function (id)
{
  return null;
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