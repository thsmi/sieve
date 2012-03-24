/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

"use strict";

function SieveBlockUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
}

SieveBlockUI.prototype.__proto__ = SieveAbstractBoxUI.prototype;

SieveBlockUI.prototype.init
    = function ()
{
  var elm = $(document.createElement("div"))
              .addClass("sivBlock");
  
  var item = null;
  
  for (var i=0; i<this.getSieve().elms.length;i++)
  {      
    item = this.getSieve().elms[i].html()
      
    if (!item)
      continue;
      
    elm
      .append((new SieveDropBoxUI(this))
        .drop(new SieveBlockDropHandler(),this.getSieve().elms[i])
        .html()
        .addClass("sivBlockSpacer"))
      .append(
        $("<div/>").append(item)
          .addClass("sivBlockChild"));
  }
   
  elm.append((new SieveDropBoxUI(this))
    .drop(new SieveBlockDropHandler())
    .html()
    .addClass("sivBlockSpacer"));
  
  return elm; 
}

SieveBlockUI.prototype.createHtml
    = function (parent)
{
  return parent.append(
      this.init());
}