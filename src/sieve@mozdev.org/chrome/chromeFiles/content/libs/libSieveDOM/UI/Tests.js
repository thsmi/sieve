/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

//testunary .append() -> testunary in anyof wrapen
//testmultary.append -> an entsprechender stelle einfügen 

//****************************************************************************//

function SieveSizeTestUI(elm)
{
  SieveEditableDragBoxUI.call(this,elm);
  this.flavour("sieve/test");
}

SieveSizeTestUI.prototype.__proto__ = SieveEditableDragBoxUI.prototype;

SieveSizeTestUI.prototype.onValidate
    = function ()
{
  
  this.getSieve()
        .isOver($("#SizeTestOver"+this.getId()).val())
        .getSize()
          .value($("#SizeTestValue"+this.getId()).val())
          .unit($("#SizeTestUnit"+this.getId()).val());

  $("#txtSizeText"+this.getId())
    .text("message is "+(this.getSieve().isOver()?"larger":"smaller")
                   +" than "+this.getSieve().getSize().toScript());          
  
  return true;      
}

SieveSizeTestUI.prototype.initEditor
    = function ()
{
  return $(document.createElement("div"))
           .append($("<span/>")
             .text("Message is"))
           .append($("<select/>")
             .attr("id","SizeTestOver"+this.getId())           
             .append($("<option/>")
               .text("bigger").val("true"))
             .append($("<option/>")
               .text("smaler").val("false")) 
             .val(""+this.getSieve().isOver()))          
           .append($("<span/>")
             .text("than"))
           .append($("<input/>")
             .attr("type","text")
             .attr("id","SizeTestValue"+this.getId())
             .val(""+this.getSieve().getSize().value()) )           
           .append($("<select/>")
             .attr("id","SizeTestUnit"+this.getId())
             .append($("<option/>")
                .text("Bytes").val(""))
             .append($("<option/>")
                .text("Kilobytes").val("K"))
             .append($("<option/>")
                .text("Megabytes").val("M"))
             .append($("<option/>")
                .text("Gigabytes").val("G"))
             .val(this.getSieve().getSize().unit()));
}

SieveSizeTestUI.prototype.initSummary
    = function ()
{
  return $("<div/>")
           .attr("id","txtSizeText"+this.getId())
           .text("message is "+(this.getSieve().isOver()?"larger":"smaller")
                   +" than "+this.getSieve().getSize().toScript());  
}
    
//****************************************************************************//

function SieveBooleanTestUI(elm)
{
  SieveEditableDragBoxUI.call(this,elm);
  this.flavour("sieve/test");
}

SieveBooleanTestUI.prototype.__proto__ = SieveEditableDragBoxUI.prototype;

SieveBooleanTestUI.prototype.onValidate
    = function ()
{
  
  if ($("#BooleanTestValue"+this.getId()).val() == "true")
    this.getSieve().value = true
  else
    this.getSieve().value = false;
    
  $("#txtBooleanText"+this.getId())
    .text("is "+this.getSieve().value);          
  
  return true;      
}

SieveBooleanTestUI.prototype.initEditor
    = function ()
{
  return $(document.createElement("div"))
           .append($("<span/>")
             .text("is"))
           .append($("<select/>")
             .attr("id","BooleanTestValue"+this.getId())           
             .append($("<option/>")
               .text("true").val("true"))
             .append($("<option/>")
               .text("false").val("false")) 
             .val(""+this.getSieve().value));
}

SieveBooleanTestUI.prototype.initSummary
    = function ()
{
  return $("<div/>")
           .attr("id","txtBooleanText"+this.getId())
           .text("is "+(this.getSieve().value));  
}
    
//****************************************************************************//

function SieveExistsUI(elm)
{
  SieveEditableDragBoxUI.call(this,elm);
  this.flavour("sieve/test");  
}

SieveExistsUI.prototype.__proto__ = SieveEditableDragBoxUI.prototype;

SieveExistsUI.prototype.initEditor
    = function()
{
  return $("<div/>").text("implement me")
}
  
SieveExistsUI.prototype.initSummary
    = function()
{
  return $("<div/>")
           .text("one if the following mailheader exists:"+this.getSieve().headerNames.toWidget())
}