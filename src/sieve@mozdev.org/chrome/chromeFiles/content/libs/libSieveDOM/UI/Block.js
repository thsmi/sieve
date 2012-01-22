/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */


// TODO rename to SieveContentSection
function SieveBlockUI(elm)
{
  SieveDragBoxUI.call(this,elm);
}

SieveBlockUI.prototype.__proto__ = SieveDragBoxUI.prototype;

SieveBlockUI.prototype.init
    = function ()
{
  var elm = $(document.createElement("div"))
              .addClass("SivElementBlock");
  
  var item = null;
  
  for (var i=0; i<this.getSieve().elms.length;i++)
  {
    // XXX: remove me: backward compatibility
    if (!this.getSieve().elms[i].toWidget)
      continue;
      
    item = this.getSieve().elms[i].toWidget()
      
    if (!item)
      continue;
      
    elm
      .append((new SieveDropBoxUI(this.getId(),this.getSieve().elms[i]))
        .flavours("sieve/action")
        .getWidget())
      .append(item);
  }
   
  elm.append((new SieveDropBoxUI(this.getId())).flavours("sieve/action").getWidget());
  
  return elm; 
}