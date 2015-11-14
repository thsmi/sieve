/*
 * The contents of this file are licenced. You may obtain a copy of 
 * the license at https://github.com/thsmi/sieve/ or request it via 
 * email from the author.
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *      
 */
 
"use strict";

function SieveRejectActionUI(elm)
{
  SieveActionDialogBoxUI.call(this,elm)
}

SieveRejectActionUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
SieveRejectActionUI.prototype.constructor = SieveRejectActionUI;

SieveRejectActionUI.prototype.getTemplate
    = function () 
{
  return "./reject/widgets/SieveRejectActionUI.html"      
}

SieveRejectActionUI.prototype.onSave
    = function ()    
{
	this.getSieve().setReason($("#sivRejectReason").val());
	
	return true;
}

SieveRejectActionUI.prototype.onLoad
    = function ()    
{
	(new SieveTabWidget()).init();
	
	$("#sivRejectReason").val(this.getSieve().getReason());
}

SieveRejectActionUI.prototype.getSummary
    = function ()
{        
  return $("<div/>")         
           .html("Reject incomming messages and reply the following reason:" +
             "<div>"+ 
               $('<em/>').text(this.getSieve().getReason().substr(0,240)).html() +
               ((this.getSieve().getReason().length > 240)?"...":"") +
             "</div>");
}

//*************************************************************************************//

function SieveExtendedRejectActionUI(elm)
{
  SieveActionDialogBoxUI.call(this,elm)
}

SieveExtendedRejectActionUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
SieveExtendedRejectActionUI.prototype.constructor = SieveExtendedRejectActionUI;

SieveExtendedRejectActionUI.prototype.getTemplate
    = function () 
{
  return "./reject/widgets/SieveExtendedRejectActionUI.html"      
}

SieveExtendedRejectActionUI.prototype.onSave
    = function ()    
{
  this.getSieve().setReason($("#sivExtendedRejectReason").val());
  
  return true;
}

SieveExtendedRejectActionUI.prototype.onLoad
    = function ()    
{
  (new SieveTabWidget()).init();
  
  $("#sivExtendedRejectReason").val(this.getSieve().getReason());
}
SieveExtendedRejectActionUI.prototype.getSummary
    = function ()
{        
  return $("<div/>")
           .html("Reject incomming messages and reply the following reason:" +
             "<div>"+ 
               $('<em/>').text(this.getSieve().getReason().substr(0,240)).html() +
               ((this.getSieve().getReason().length > 240)?"...":"") +
             "</div>");
}

if (!SieveDesigner)
  throw "Could not register Reject Widgets";

  
SieveDesigner.register("action/reject", SieveRejectActionUI);
SieveDesigner.register("action/ereject", SieveExtendedRejectActionUI);
