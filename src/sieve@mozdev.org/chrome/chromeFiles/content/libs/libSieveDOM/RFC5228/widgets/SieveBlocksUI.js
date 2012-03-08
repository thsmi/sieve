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
    item = this.getSieve().elms[i].html()
      
    if (!item)
      continue;
      
    elm
      .append((new SieveDropBoxUI(this,this.getSieve().elms[i]))
        .drop(new SieveBlockDropHandler())
        .html())
      .append(item);
  }
   
  elm.append((new SieveDropBoxUI(this))
    .drop(new SieveBlockDropHandler())
    .html());
  
  return elm; 
}

SieveBlockUI.prototype.createHtml
    = function ()
{
  return this.init()
    .addClass("SivElement")
    .attr("id","sivElm"+this.id());
}