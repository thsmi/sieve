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
  
function SieveStringListWidget(selector) {
  this._selector = selector; 
  this._min = 0;
}

SieveStringListWidget.prototype.addItem
    = function (value) {       

  var that = this;    	
  if (typeof(value) == "undefined")
    value = "";
    
  var elm = this.template().clone();
      
  $($(this._selector).attr("list-new")).before(elm);
     
  elm.find(":text").val(value).focus();
  elm.find("button").click(function() {
  	if (that._min >= that.items().length)
  	  return;
    elm.remove() }
  )
  
  return this;
}

SieveStringListWidget.prototype.init
    = function ()
{ 
  
  var that = this;
  
  $($(this._selector).attr("list-new"))
    .click(function() { that.addItem(); });
  
  this._min = parseInt($(this._selector).attr("list-min"),10);
    
  if (isNaN(this._min))
    this._min = 0;
    
  return this;
}

SieveStringListWidget.prototype.template
    = function () {
  return $($(this._selector).attr("list-template")).children().first();	
}

SieveStringListWidget.prototype.items
    = function () {
  var id = 	($(this._selector).attr("list-items"))
    
  return $( id + " input[type='text'],"+ id + " input[type='email']"  );
}

SieveStringListWidget.prototype.values
    = function (values) {
    	
  if (typeof(values) !== "undefined") {
  	
    for (var i=0; i<values.size(); i++) 
      this.addItem(values.item(i));
      
    return this;
  }
 
  // Convert the items into a string array...
  var result = [];
  
  this.items().each(function( index ) {
    result.push($(this).val());
  })
  
  return result;
}
  



function SieveTabWidget() {	
  this._tabs = "div.dialogTab";
  this._content = ".tab-content";
}

SieveTabWidget.prototype.init
    = function (tabs, content) {
    	
  var that = this;
  
  $(this._tabs+' > div').click(function(){
  	that.onTabChange(this);
  });
  
}

SieveTabWidget.prototype.onTabChange
    = function (elm) {
    	
  $(this._tabs +' > div').removeClass('tab-active');
  $(this._content + ' > div').removeClass('tab-active');

  $(elm).addClass('tab-active');
        
  var id = $(elm).attr('tab-content');
  $("#"+id).addClass('tab-active');   	
}

