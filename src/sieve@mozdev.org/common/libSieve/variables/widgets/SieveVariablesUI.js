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
  /* global SieveStringListWidget */
  /* global SieveActionDialogBoxUI */
  /* global SieveTabWidget */
  /* global SieveTestDialogBoxUI */
  /* global SieveMatchTypeUI */
  /* global SieveDesigner */
	
  function SieveSetActionUI(elm)
  {
    SieveActionDialogBoxUI.call(this,elm);  
  }
  
  SieveSetActionUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
  SieveSetActionUI.prototype.constructor = SieveSetActionUI;
  
  SieveSetActionUI.prototype.getTemplate
      = function () 
  {
    return "./variables/widgets/SieveSetActionUI.html";   
  };
  
  SieveSetActionUI.prototype.onSave
      = function ()    
  {
    var item = null;
    
    item = $("#sivVariableName").val();
    if(!item.trim()) {
    	alert("Variable name can't be empty");
      return false;
    }
    
    this.getSieve().name(item);
    
    this.getSieve().value($("#sivVariableValue").val());
   
    
    var modifiers = this.getSieve().modifiers();
    
    item = $("input:checkbox[name='10']:checked");
    if (item && item.val())
      modifiers.setItem(item.val());
    else
      modifiers.removeItem(10);
      
    item = $("input:checkbox[name='20']:checked");
    if (item && item.val())
      modifiers.setItem(item.val());  
    else
      modifiers.removeItem(20);
      
    item = $("input:checkbox[name='30']:checked");
    if (item && item.val()) {
    	item = $("input:radio[name='30']:checked").val();
    	modifiers.setItem(item);
    }
    else
      modifiers.removeItem(30);  
   
    item = $("input:checkbox[name='40']:checked");
    if (item && item.val()) {
      item = $("input:radio[name='40']:checked").val();
      modifiers.setItem(item);
    }
    else
      modifiers.removeItem(40);  
      
    return true;
  };
  
  
  SieveSetActionUI.prototype.onLoad
      = function ()    
  {
   (new SieveTabWidget()).init();
   
   //var state = this.getSieve().state();
   var item = null;
     
   item = this.getSieve().modifiers().getItem(10);
   $('input:checkbox[name="10"]').prop('checked', !!item );
   
   item = this.getSieve().modifiers().getItem(20);
   $('input:checkbox[name="20"]').prop('checked', !!item ); 
   
   
   item = this.getSieve().modifiers().getItem(30);
   $('input:checkbox[name="30"]')
     .change(function() { $('input:radio[name="30"]').prop('disabled',!($(this).prop('checked'))); } )
     .prop('checked', !!item )
     .change();
     
   if (item)   
     $('input:radio[name="30"][value="'+ item.nodeName().substr(9)+'"]' ).prop('checked', true);  
  
   item = this.getSieve().modifiers().getItem(40);
   $('input:checkbox[name="40"]')
     .change(function() { $('input:radio[name="40"]').prop('disabled',!($(this).prop('checked'))); } )
     .prop('checked', !!item )  
     .change();
    
   if (item)
     $('input:radio[name="40"][value="'+ item.nodeName().substr(9)+'"]' ).prop('checked', true);
     
    $("#sivVariableName").val(this.getSieve().name());
    $("#sivVariableValue").val(this.getSieve().value());   
  };
  
  SieveSetActionUI.prototype.getSummary
      = function()
  {
    return $("<div/>")         
             .html("Set variable <em>" +this.getSieve().name()+ "</em> to value "+
               "<div><em>"+ 
                 $('<div/>').text(this.getSieve().value().substr(0,240)).html() +
                 ((this.getSieve().value().substr().length > 240)?"...":"") +
               "</em></div>");	
  	
  };
  
  //-----------------------------------------------------------------------------
  
  function SieveStringTestUI(elm)
  {
    SieveTestDialogBoxUI.call(this,elm);  
  }
  
  SieveStringTestUI.prototype = Object.create(SieveTestDialogBoxUI.prototype);
  SieveStringTestUI.prototype.constructor = SieveStringTestUI;
  
  SieveStringTestUI.prototype.getTemplate
      = function () 
  {
    return "./variables/widgets/SieveStringTestUI.html";
  };
  
  SieveStringTestUI.prototype.onSave
      = function ()    
  {
  	var values = null;
  	
  	var sieve = this.getSieve();
  	
  	values = (new SieveStringListWidget("#sivVariablesSourceList")).values();
  	
  	if (!values || !values.length) {
  		alert("Source list is empty");
  	  return false;
  	}
  	
    sieve.source()
      .clear()
      .append(values);
      
    values = (new SieveStringListWidget("#sivVariablesKeyList")).values();
    
    if (!values || !values.length) {
      alert("Key list is empty");
      return false;
    }
  
    sieve.keyList()
      .clear()
      .append(values);
      
    return true;
  };


  SieveStringTestUI.prototype.onLoad
      = function ()    
  {
    (new SieveTabWidget()).init();
    
    (new SieveStringListWidget("#sivVariablesSourceList"))
      .init()
      .values(this.getSieve().source());
      
    (new SieveStringListWidget("#sivVariablesKeyList"))
      .init()
      .values(this.getSieve().keyList());
      
    var matchType = new SieveMatchTypeUI(this.getSieve().matchType());
    $("#sivVariablesMatchTypes")
      .append(matchType.html());     
  };

  SieveStringTestUI.prototype.getSummary
      = function()
  {
    return $("<div/>")
        .html(" string "+ $('<em/>').text(this.getSieve().source().toScript()).html()
                + " " + this.getSieve().matchType().matchType()
                + " " + $('<em/>').text(this.getSieve().keyList().toScript()).html());
    
  };
  
  
  if (!SieveDesigner)
    throw "Could not register Body Extension";
  
  SieveDesigner.register("action/setvariable", SieveSetActionUI);
  SieveDesigner.register("test/string", SieveStringTestUI);

})(window);