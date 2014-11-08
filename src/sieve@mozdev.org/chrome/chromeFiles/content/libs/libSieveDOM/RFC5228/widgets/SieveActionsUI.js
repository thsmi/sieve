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

/******************************************************************************/

function SieveStopUI(elm)
{
  SieveActionBoxUI.call(this,elm);
}

SieveStopUI.prototype = Object.create(SieveActionBoxUI.prototype);
SieveStopUI.prototype.constructor = SieveStopUI;

SieveStopUI.prototype.initSummary
    = function ()
{
  return $(document.createElement("div"))
           .text("End Script (Stop processing)");  
}


/******************************************************************************/
function SieveDiscardUI(elm)
{
  SieveActionBoxUI.call(this,elm);
}

SieveDiscardUI.prototype = Object.create(SieveActionBoxUI.prototype);
SieveDiscardUI.prototype.constructor = SieveDiscardUI;

SieveDiscardUI.prototype.initSummary
    = function ()
{
  return $(document.createElement("div"))
           .text("Discard message silently");  
}

/******************************************************************************/
function SieveKeepUI(elm)
{
  SieveActionBoxUI.call(this,elm);
}

SieveKeepUI.prototype = Object.create(SieveActionBoxUI.prototype);
SieveKeepUI.prototype.constructor = SieveKeepUI;

SieveKeepUI.prototype.initSummary
    = function ()
{
  return $(document.createElement("div"))
           .text("Keep a copy in the main inbox");  
}

/******************************************************************************/
// extends sieve draggable box
function SieveRedirectUI(elm)
{
  SieveActionBoxUI.call(this,elm);
}

SieveRedirectUI.prototype = Object.create(SieveActionBoxUI.prototype);
SieveRedirectUI.prototype.constructor = SieveRedirectUI;

SieveRedirectUI.prototype.onValidate
   = function ()
{
  if (! $("#txtRedirect"+this.id()).get(0).checkValidity())
    throw "Invalid email address";
    
  this.getSieve().setAddress($("#txtRedirect"+this.id()).val());  
  
  return true;
}

SieveRedirectUI.prototype.initEditor
    = function ()
{
  return $(document.createElement("div"))
           .text("Redirect messages to:")
           .append($("<div/>")
             .append($("<input/>")
               .attr("id","txtRedirect"+this.id())
               .attr("type","email")
               .attr("x-moz-errormessage","Please specify a valid email address.")
               .attr("value",""+this.getSieve().getAddress())));
               
}

SieveRedirectUI.prototype.initSummary
    = function ()
{
  return $("<div/>")
           .html("Redirect message to " +
             "<em>"+ $('<div/>').text(this.getSieve().getAddress()).html()+"</em>");
}


/******************************************************************************/

function SieveFileIntoUI(elm)
{
  SieveActionBoxUI.call(this,elm)
}

SieveFileIntoUI.prototype = Object.create(SieveActionBoxUI.prototype);
SieveFileIntoUI.prototype.constructor = SieveFileIntoUI;

SieveFileIntoUI.prototype.onValidate
   = function ()
{
  this.getSieve().setPath($("#txtPath"+this.id()).val());
}

SieveFileIntoUI.prototype.initEditor
    = function ()
{              
  return $("<div/>")
           .text("Copy the incomming message into folder:")
           .append($("<div/>")
             .append($("<input/>")
               .attr("id","txtPath"+this.id())
               .attr("value",""+this.getSieve().getPath())));
}

SieveFileIntoUI.prototype.initSummary
    = function ()
{              
  return $("<div/>")
           .html("Copy message into:" +
             "<div><em>"+ $('<div/>').text(this.getSieve().getPath()).html()+"</em></div>");
}

/******************************************************************************/

if (!SieveDesigner)
  throw "Could not register Action Widgets";

  
SieveDesigner.register(SieveDiscard, SieveDiscardUI);
SieveDesigner.register(SieveKeep, SieveKeepUI);
SieveDesigner.register(SieveStop, SieveStopUI);

SieveDesigner.register(SieveFileInto, SieveFileIntoUI);
SieveDesigner.register(SieveRedirect,SieveRedirectUI);