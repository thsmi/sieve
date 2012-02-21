/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

"use strict";

// TODO rename to SieveContentSection
function SieveBlockUI(elm)
{
  SieveDragBoxUI.call(this,elm);
}

SieveBlockUI.prototype.__proto__ = SieveAbstractBoxUI.prototype;

SieveBlockUI.prototype.init
    = function ()
{
  var elm = $(document.createElement("div"))
              .addClass("SivElementBlock");
  
  var item = null;
  
  for (var i=0; i<this.getSieve().elms.length;i++)
  {      
    item = this.getSieve().elms[i].widget()
      
    if (!item)
      continue;
      
    elm
      .append((new SieveDropBoxUI(this,this.getSieve().elms[i]))
        .drop(new SieveBlockDropHandler())
        .getWidget())
      .append(item);
  }
   
  elm.append((new SieveDropBoxUI(this))
    .drop(new SieveBlockDropHandler())
    .getWidget());
  
  return elm; 
}

SieveBlockUI.prototype.getWidget
    = function ()
{
  if (this._domElm)
    return this._domElm;
    
  this._domElm = this.init()
    .addClass("SivElement")
    //.attr("id","sivElm"+this.id());
    
  return this._domElm;
}