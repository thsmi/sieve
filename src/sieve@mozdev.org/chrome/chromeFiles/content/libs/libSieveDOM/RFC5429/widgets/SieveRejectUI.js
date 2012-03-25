/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";
 
 // TODO Implement Extended Reject

function SieveRejectUI(elm)
{
  SieveActionBoxUI.call(this,elm)
}

SieveRejectUI.prototype.__proto__ = SieveActionBoxUI.prototype;


SieveRejectUI.prototype.onValidate
   = function ()
{
  this.getSieve().setReason($("#txtReason"+this.id()).val());

  return true;
}

SieveRejectUI.prototype.initEditor
    = function ()
{  
  return $("<div/>")
           .append($("<div/>")
             .text("Reject incomming messages and reply the following reason:"))
           .append($("<textarea/>")
             .attr("id","txtReason"+this.id())
             .attr("multiline","true")
             .attr("cols","60").attr("rows","5")
             .attr("wrap","off")
             .attr("value",""+this.getSieve().getReason()));
}

SieveRejectUI.prototype.initSummary
    = function ()
{        
  return $("<div/>")
           .html("Reject incomming messages and reply the following reason:" +
             "<div><em>"+ 
               $('<div/>').text(this.getSieve().getReason().substr(0,240)).html() +
               ((this.getSieve().getReason().length > 240)?"...":"") +
             "</em></div>");
}

