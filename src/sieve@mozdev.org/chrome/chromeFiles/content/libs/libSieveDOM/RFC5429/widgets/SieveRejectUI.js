/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";
 

function SieveRejectUI(elm)
{
  SieveActionBoxUI.call(this,elm)
}

SieveRejectUI.prototype = Object.create(SieveActionBoxUI.prototype);
SieveRejectUI.prototype.constructor = SieveRejectUI;

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
             .text(" Reject is replaced by the ereject ans should not be used anymore. The ereject action is similar to reject,"
                    +" but will always favor protocol-level message rejection."))
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

//*************************************************************************************//

function SieveErejectUI(elm)
{
  SieveActionBoxUI.call(this,elm)
}

SieveErejectUI.prototype = Object.create(SieveActionBoxUI.prototype);
SieveErejectUI.prototype.constructor = SieveErejectUI;

SieveErejectUI.prototype.onValidate
   = function ()
{
  this.getSieve().setReason($("#txtReason"+this.id()).val());

  return true;
}

SieveErejectUI.prototype.initEditor
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

SieveErejectUI.prototype.initSummary
    = function ()
{        
  return $("<div/>")
           .html("Reject incomming messages and reply the following reason:" +
             "<div><em>"+ 
               $('<div/>').text(this.getSieve().getReason().substr(0,240)).html() +
               ((this.getSieve().getReason().length > 240)?"...":"") +
             "</em></div>");
}

if (!SieveDesigner)
  throw "Could not register Reject Widgets";

  
SieveDesigner.register("action/reject", SieveRejectUI);
SieveDesigner.register("action/ereject", SieveErejectUI);
