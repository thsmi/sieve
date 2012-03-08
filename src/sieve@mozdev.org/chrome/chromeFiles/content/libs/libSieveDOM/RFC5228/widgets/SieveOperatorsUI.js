/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";

function SieveNotUI(elm)
{
  SieveTestBoxUI.call(this,elm);
  this.flavour("sieve/operator");
}

SieveNotUI.prototype.__proto__ = SieveTestBoxUI.prototype;



SieveNotUI.prototype.initSummary
    = function ()
{
  var elm = $("<div/>");
  
  elm.text("does not match:");    

  elm.append(this.getSieve().test().html())
    
  return elm;     
}


//****************************************************************************//

function SieveAnyOfAllOfUI(elm)
{
  SieveTestBoxUI.call(this,elm);
  this.flavour("sieve/operator");
}

SieveAnyOfAllOfUI.prototype.__proto__ = SieveTestBoxUI.prototype;


SieveAnyOfAllOfUI.prototype.onValidate
    = function ()
{
  
  if ($("#AnyOfAllOfValue"+this.id()).val() == "true")
    this.getSieve().isAllOf = true
  else
    this.getSieve().isAllOf = false;         
  
  return true;
}

SieveAnyOfAllOfUI.prototype.initEditor
    = function ()
{
  return $(document.createElement("div"))
           .append($("<select/>")
             .attr("id","AnyOfAllOfValue"+this.id())           
             .append($("<option/>")
               .text("All of the following").val("true"))
             .append($("<option/>")
               .text("Any of the following").val("false")) 
             .val(""+this.getSieve().isAllOf));
}

SieveAnyOfAllOfUI.prototype.initSummary
    = function ()
{
  return $("<div/>")        
           .text((this.getSieve().isAllOf)?"All of the following:":"Any of the following:");  
}

SieveAnyOfAllOfUI.prototype.showSummary
    = function ()
{
  SieveTestBoxUI.prototype.showSummary.call(this);
  
  this._domElm.children(".sivSummaryContent").after(this._domElm.children(".sivAnyOf"));
}

SieveAnyOfAllOfUI.prototype.showEditor
    = function ()
{
  SieveTestBoxUI.prototype.showEditor.call(this);  
  this._domElm.children(".sivEditorContent").after(this._domElm.children(".sivAnyOf"));
}

SieveAnyOfAllOfUI.prototype.init
    = function()
{
  var item = $("<div/>")
      .addClass("sivAnyOf")
      .css("padding-left","30px");
      
  for (var i=0; i<this.getSieve().tests.length; i++)
    item
      .append((new SieveDropBoxUI(this,this.getSieve().tests[i][1]))      
        .drop(new SieveMultaryDropHandler()).html())
      .append(this.getSieve().tests[i][1].html())
      
  item
    .append((new SieveDropBoxUI(this))      
      .drop(new SieveMultaryDropHandler()).html());
  
  return SieveEditableDragBoxUI.prototype.init.call(this)
    .append(item);
}