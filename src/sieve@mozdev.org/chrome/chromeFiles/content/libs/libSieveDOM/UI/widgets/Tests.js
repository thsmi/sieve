/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

 "use strict";

//testunary .append() -> testunary in anyof wrapen  SieveTestUI einführen...
//testmultary.append -> an entsprechender stelle einfügen SieveTestListUI...

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
        .isOver($("#SizeTestOver"+this.id()).val())
        .getSize()
          .value($("#SizeTestValue"+this.id()).val())
          .unit($("#SizeTestUnit"+this.id()).val());

  $("#txtSizeText"+this.id())
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
             .attr("id","SizeTestOver"+this.id())           
             .append($("<option/>")
               .text("bigger").val("true"))
             .append($("<option/>")
               .text("smaler").val("false")) 
             .val(""+this.getSieve().isOver()))          
           .append($("<span/>")
             .text("than"))
           .append($("<input/>")
             .attr("type","text")
             .attr("id","SizeTestValue"+this.id())
             .val(""+this.getSieve().getSize().value()) )           
           .append($("<select/>")
             .attr("id","SizeTestUnit"+this.id())
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
           .attr("id","txtSizeText"+this.id())
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
  
  if ($("#BooleanTestValue"+this.id()).val() == "true")
    this.getSieve().value = true
  else
    this.getSieve().value = false;
    
  $("#txtBooleanText"+this.id())
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
             .attr("id","BooleanTestValue"+this.id())           
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
           .attr("id","txtBooleanText"+this.id())
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
  return $("<div/>").text("all of the following header exist:")
    .append((new SieveHeaderListUI(this.getSieve().headerNames)).getWidget())
}
  
SieveExistsUI.prototype.initSummary
    = function()
{
  return $("<div/>")
           .text("the following header(s) exist:"+this.getSieve().headerNames.toScript())
}

//****************************************************************************//
function SieveHeaderUI(elm)
{
  SieveEditableDragBoxUI.call(this,elm);
  this.flavour("sieve/test");  
}

SieveHeaderUI.prototype.__proto__ = SieveEditableDragBoxUI.prototype;

SieveHeaderUI.prototype.onValidate
    = function ()
{
     
  $("#lblHeader"+this.id())
    .text(" header "+this.getSieve().headerNames.toScript()
          +" [is|contains|matches] [case-sensitive] "
          +this.getSieve().keyList.toScript());       
  
  return true;      
}

SieveHeaderUI.prototype.initEditor
    = function()
{  
  // 
  //

  
  return $("<div/>")
    .append($("<div/>")
      .append($("<div/>").text(
        "Use this test to compare Strings like a subject lines, spam score, etc."))
      .append($("<div/>").text(
         "But do not compare against headers containing mail addresses, like To, Bcc,"
         + "From, Cc! They usually contain a display name. Instead of "
         + "'roadrunner@acme.example.com\' the header can be something similar to " 
         + "'\"roadrunner\" <roadrunner@acme.example.com>'. The \"address\" test "
         + "is aware of display names and compares against the pure mail address.")))
    .append($("<h1/>").text("Any of the following header ..."))
    .append((new SieveHeaderListUI(this.getSieve().headerNames)).getWidget())
    .append((new SieveMatchTypeUI(this.getSieve().matchType)).getWidget())
    .append($("<h1/>").text("... any of the keyword(s)"))
    .append((new SieveStringListUI(this.getSieve().keyList)).getWidget())    
    .append((new SieveComparatorUI(this.getSieve().comparator)).getWidget())
}
  
SieveHeaderUI.prototype.initSummary
    = function()
{
  // case- insensitive is the default so skip it...
  return $("<div/>")
      .attr("id","lblHeader"+this.id()) 
      .text(" header "+this.getSieve().headerNames.toScript()
              +" [is|contains|matches] [case-sensitive] "
              +this.getSieve().keyList.toScript());
}

//****************************************************************************//

function SieveAddressUI(elm)
{
  SieveEditableDragBoxUI.call(this,elm);
  this.flavour("sieve/test");  
}

SieveAddressUI.prototype.__proto__ = SieveEditableDragBoxUI.prototype;

SieveAddressUI.prototype.onValidate
    = function ()
{
     
  $("#lblAddress"+this.id())
    .text(" address "+this.getSieve().headerList.toScript()
          +" [is|contains|matches] [case-sensitive] "
          +this.getSieve().keyList.toScript());       
  
  return true;      
}

SieveAddressUI.prototype.initEditor
    = function()
{
 
  /*From, To, Cc, Bcc, Sender, Resent-From, Resent-To*/
  return $("<div/>")
    .append($("<span/>").text(
      'The address test is designed to match headers containing E-Mail addresses.' 
      + 'It offers compared to the "header test" more sophisticated address matching'
      + ' and is capable to cope with addres headers containing display names'))
    .append($("<h1/>").text("Any of the following header ..."))
    .append((new SieveHeaderListUI(this.getSieve().headerList)).getWidget())
    .append((new SieveMatchTypeUI(this.getSieve().matchType)).getWidget())
    .append((new SieveAddressPartUI(this.getSieve().addressPart)).getWidget())
    .append($("<h1/>").text("... any of the keyword(s)"))
    .append((new SieveStringListUI(this.getSieve().keyList)).getWidget())    
    .append((new SieveComparatorUI(this.getSieve().comparator)).getWidget())
}
  
SieveAddressUI.prototype.initSummary
    = function()
{
  // case- insensitive is the default so skip it...
  return $("<div/>")
      .attr("id","lblAddress"+this.id()) 
      .text(" address "+this.getSieve().headerList.toScript()
              +" [is|contains|matches] [case-sensitive] "
              +this.getSieve().keyList.toScript());
}

//****************************************************************************//

function SieveAnyOfAllOfUI(elm)
{
  SieveEditableDragBoxUI.call(this,elm);
  this.flavour("sieve/test");
}

SieveAnyOfAllOfUI.prototype.__proto__ = SieveEditableDragBoxUI.prototype;


SieveAnyOfAllOfUI.prototype.onValidate
    = function ()
{
  
  if ($("#AnyOfAllOfValue"+this.id()).val() == "true")
    this.getSieve().isAllOf = true
  else
    this.getSieve().isAllOf = false;
    
  $("#lblAnyOfAllOf"+this.id())
    .text((this.getSieve().isAllOf)?"All of the following:":"Any of the following:");          
  
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
           .attr("id","lblAnyOfAllOf"+this.id())           
           .text((this.getSieve().isAllOf)?"All of the following:":"Any of the following:");  
}



SieveAnyOfAllOfUI.prototype.init
    = function()
{
  var item = SieveEditableDragBoxUI.prototype.init.call(this);
  
  for (var i=0; i<this.getSieve().tests.length; i++)
    item.append($("<div/>")
      .css("padding-left","30px")
      .append(this.getSieve().tests[i][1].widget()))
      
  
  return item;
}