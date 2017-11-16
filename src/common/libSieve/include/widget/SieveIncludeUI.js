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

/* global window */

"use strict";

(function(exports) {

	/* global $: false */
  /* global SieveActionBoxUI */
  /* global SieveActionDialogBoxUI */
  /* global SieveDesigner */
  /* global SieveTabWidget */
  /* global SieveStringListWidget */
  	
  /******************************************************************************/
  
  function SieveReturnUI(elm)
  {
    SieveActionBoxUI.call(this,elm);
  }
  
  SieveReturnUI.prototype = Object.create(SieveActionBoxUI.prototype);
  SieveReturnUI.prototype.constructor = SieveReturnUI;
  
  SieveReturnUI.prototype.initSummary
      = function ()
  {
    return $("<div/>")
             .text("End current script and return to the parent script");  
  };
  
  /******************************************************************************/
  
     
  function SieveGlobalActionUI(elm)
  {
    SieveActionDialogBoxUI.call(this,elm);  
  }
  
  SieveGlobalActionUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
  SieveGlobalActionUI.prototype.constructor = SieveGlobalActionUI;
  
  SieveGlobalActionUI.prototype.getTemplate
      = function () 
  {
    return "./include/widget/SieveGlobalActionUI.html";           
  };
  
  SieveGlobalActionUI.prototype.onSave
      = function ()    
  {
    var values = (new SieveStringListWidget("#sivIncludeGlobalList")).values();
    
    if (!values || !values.length) {
      alert("Source list is empty");
      return false;
    }
    
    this.getSieve().values()
      .clear()
      .append(values);	
      
    return true;
  };
  
  SieveGlobalActionUI.prototype.onLoad
      = function ()    
  {
    (new SieveTabWidget()).init(); 
    
    (new SieveStringListWidget("#sivIncludeGlobalList"))
      .init()
      .values(this.getSieve().values());   
  };
  
  SieveGlobalActionUI.prototype.getSummary
      = function()
  {
  	
    return $("<div/>")         
             .html("Define as global variable(s) "+$('<em/>').text(this.getSieve().values().toScript()).html());  
    
  };
  
  
  /******************************************************************************/
  
     
  function SieveIncludeActionUI(elm)
  {
    SieveActionDialogBoxUI.call(this,elm);  
  }
  
  SieveIncludeActionUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
  SieveIncludeActionUI.prototype.constructor = SieveIncludeActionUI;
  
  SieveIncludeActionUI.prototype.getTemplate
      = function () 
  {
    return "./include/widget/SieveIncludeActionUI.html";
  };
  
  SieveIncludeActionUI.prototype.onSave
      = function ()    
  {
  	var sieve = this.getSieve();
  	
  	var script = $("#sivIncludeScriptName").val();
  	
  	if (script.trim() === "") {
  	  alert("Invalid Script name");
  	  return false;
  	}
  	  	
  	sieve.script($("#sivIncludeScriptName").val());
  	
  	sieve.personal( $("input[type='radio'][name='personal']:checked").val() == "true");
  	sieve.optional( $("input:checkbox[name='optional']:checked").length);
  	sieve.once( $("input:checkbox[name='once']:checked").length);
  	
    return true;
  };
  
  SieveIncludeActionUI.prototype.onLoad
      = function ()    
  {
    (new SieveTabWidget()).init();
    
    var sieve = this.getSieve();
    
    
    $('input:radio[name="personal"][value="'+!!sieve.personal()+'"]').prop('checked', true);
    
    $('input:checkbox[name="optional"]').prop('checked', !!sieve.optional());
    $('input:checkbox[name="once"]').prop('checked', !!sieve.once());
    
    $("#sivIncludeScriptName").val(sieve.script());
  };
  
  SieveIncludeActionUI.prototype.getSummary
      = function()
  {
  	var str = 
   	  "Include "
   	    +(this.getSieve().personal()?"personal":"global")
   	    +" script "+$('<em/>').text(this.getSieve().script()).html();
    
    return $("<div/>")         
             .html(str);  
    
  };
  
  
  if (!SieveDesigner)
    throw "Could not register Action Widgets";
  
    
  SieveDesigner.register("action/return", SieveReturnUI);
  SieveDesigner.register("action/global", SieveGlobalActionUI);
  SieveDesigner.register("action/include", SieveIncludeActionUI);
  
})(window);