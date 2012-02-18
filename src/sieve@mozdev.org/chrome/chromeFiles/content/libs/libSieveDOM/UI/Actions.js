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

"use strict";

function SieveStopUI(elm)
{
  SieveDragBoxUI.call(this,elm);
}

SieveStopUI.prototype.__proto__ = SieveDragBoxUI.prototype;

SieveStopUI.prototype.init
    = function ()
{
  return $(document.createElement("div"))
           .text("End Script (Stop processing)");  
}


/******************************************************************************/
function SieveDiscardUI(elm)
{
  SieveDragBoxUI.call(this,elm);
}

SieveDiscardUI.prototype.__proto__ = SieveDragBoxUI.prototype;

SieveDiscardUI.prototype.init
    = function ()
{
  return $(document.createElement("div"))
           .text("Discard incomming message silently");  
}

/******************************************************************************/
function SieveKeepUI(elm)
{
  SieveDragBoxUI.call(this,elm);
}

SieveKeepUI.prototype.__proto__ = SieveDragBoxUI.prototype;

SieveKeepUI.prototype.init
    = function ()
{
  return $(document.createElement("div"))
           .text("Keep a message's copy in the main inbox");  
}

/******************************************************************************/
// extends sieve draggable box
function SieveRedirectUI(elm)
{
  SieveEditableDragBoxUI.call(this,elm);
}

SieveRedirectUI.prototype.__proto__ = SieveEditableDragBoxUI.prototype;

SieveRedirectUI.prototype.onValidate
   = function ()
{
  if (! $("#txtRedirect"+this.getId()).get(0).checkValidity())
    return false;
    
  this.getSieve().setAddress($("#txtRedirect"+this.getId()).val());  
  $("#lblRedirect"+this.getId()).text(this.getSieve().getAddress());
  
  return true;
}

SieveRedirectUI.prototype.initEditor
    = function ()
{
  return $(document.createElement("div"))
           .text("Redirect messages to:")
           .append($("<div/>")
             .append($("<input/>")
               .attr("id","txtRedirect"+this.getId())
               .attr("type","email")
               .attr("x-moz-errormessage","Please specify a valid email address.")
               .attr("value",""+this.getSieve().getAddress())));
               
}

SieveRedirectUI.prototype.initSummary
    = function ()
{
  return $(document.createElement("div"))
           .text("Redirect message to ")           
           .append($(document.createElement("span"))
             .text(this.getSieve().getAddress())
             .addClass("SivMailAddress")
             .attr("id","lblRedirect"+this.getId()));         
}

/******************************************************************************/

function SieveRejectUI(elm)
{
  SieveEditableDragBoxUI.call(this,elm)
}

SieveRejectUI.prototype.__proto__ = SieveEditableDragBoxUI.prototype;


SieveRejectUI.prototype.onValidate
   = function ()
{
  this.getSieve().setReason($("#txtReason"+this.getId()).val());
  $("#lblReason"+this.getId()).text(this.getSieve().getReason());

  return true;
}

SieveRejectUI.prototype.initEditor
    = function ()
{  
  return $(document.createElement("div"))
           .text("Reject incomming messages and reply the following reason:")
           .append($(document.createElement("textarea"))
             .attr("id","txtReason"+this.getId())
             .attr("multiline","true")
             .attr("value",""+this.getSieve().getReason()));
}

SieveRejectUI.prototype.initSummary
    = function ()
{  
  return $(document.createElement("div"))
           .text("Reject incomming messages and reply the following reason:")
           .addClass("text")
           .append($(document.createElement("div"))
             .text(this.getSieve().getReason())
             .attr("id","lblReason"+this.getId()));         
}

/******************************************************************************/

function SieveFileIntoUI(elm)
{
  SieveEditableDragBoxUI.call(this,elm)
}

SieveFileIntoUI.prototype.__proto__ = SieveEditableDragBoxUI.prototype;

SieveFileIntoUI.prototype.onValidate
   = function ()
{
  this.getSieve().setPath($("#txtPath"+this.getId()).val());
  $("#lblPath"+this.getId()).text(this.getSieve().getPath());

  return true;
}

SieveFileIntoUI.prototype.initEditor
    = function ()
{  
  return $(document.createElement("div"))
           .text("Copy the incomming message into:")
           .append($(document.createElement("textarea"))
             .attr("id","txtPath"+this.getId())
             .attr("multiline","true")
             .attr("value",""+this.getSieve().getPath()));
}

SieveFileIntoUI.prototype.initSummary
    = function ()
{  
  return $(document.createElement("div"))
           .text("Copy the incomming message into:")
           .addClass("text")
           .append($(document.createElement("div"))
             .text(this.getSieve().getPath())
             .attr("id","lblPath"+this.getId()));         
}