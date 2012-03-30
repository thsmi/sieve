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
  SieveOperatorBoxUI.call(this,elm); 
}

SieveNotUI.prototype.__proto__ = SieveOperatorBoxUI.prototype;

SieveNotUI.prototype.initSummary
    = function ()
{
  return $("<div/>")
      .text("does not match:")
      .append(this.getSieve().test().html());  
}


//****************************************************************************//

function SieveAnyOfAllOfUI(elm)
{
  SieveOperatorBoxUI.call(this,elm); 
}

SieveAnyOfAllOfUI.prototype.__proto__ = SieveOperatorBoxUI.prototype;

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

SieveAnyOfAllOfUI.prototype.createHtml
    = function (parent)
{
  
  var item = $("<div/>")
      .addClass("sivOperator");
      
  for (var i=0; i<this.getSieve().tests.length; i++)
    item
      .append((new SieveDropBoxUI(this))      
        .drop(new SieveMultaryDropHandler(),this.getSieve().tests[i][1])
        .html()
        .addClass("sivOperatorSpacer"))
      .append(
        $("<div/>").append(this.getSieve().tests[i][1].html())        
          .addClass("sivOperatorChild"));
      
  item
    .append((new SieveDropBoxUI(this))      
      .drop(new SieveMultaryDropHandler())
      .html()
      .addClass("sivOperatorSpacer"));
    
  return SieveEditableBoxUI.prototype.createHtml.call(this,parent)
           .append(item);
    
}

SieveAnyOfAllOfUI.prototype.showSummary
    = function ()
{
  SieveEditableBoxUI.prototype.showSummary.call(this);  
  this.html().children(".sivSummaryContent").after(this.html().children(".sivOperator"));
}

SieveAnyOfAllOfUI.prototype.showEditor
    = function ()
{
  SieveEditableBoxUI.prototype.showEditor.call(this);  
  this.html().children(".sivEditorContent").after(this.html().children(".sivOperator"));
}

if (!SieveDesigner)
  throw "Could not register operator Widgets";

SieveDesigner.register("operator/not", SieveNotUI);
SieveDesigner.register("operator/anyof", SieveAnyOfAllOfUI);

