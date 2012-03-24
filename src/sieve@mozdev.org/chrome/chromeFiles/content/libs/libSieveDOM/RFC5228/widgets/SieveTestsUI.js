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
  SieveTestBoxUI.call(this,elm);
}

SieveSizeTestUI.prototype.__proto__ = SieveTestBoxUI.prototype;

SieveSizeTestUI.prototype.onValidate
    = function ()
{
  
  this.getSieve()
        .isOver($("#SizeTestOver"+this.id()).val())
        .getSize()
          .value($("#SizeTestValue"+this.id()).val())
          .unit($("#SizeTestUnit"+this.id()).val());         
  
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
           .text("message is "+(this.getSieve().isOver()?"larger":"smaller")
                   +" than "+this.getSieve().getSize().toScript());  
}
    
//****************************************************************************//

function SieveBooleanTestUI(elm)
{
  SieveTestBoxUI.call(this,elm);
}

SieveBooleanTestUI.prototype.__proto__ = SieveTestBoxUI.prototype;

SieveBooleanTestUI.prototype.onValidate
    = function ()
{
  
  if ($("#BooleanTestValue"+this.id()).val() == "true")
    this.getSieve().value = true
  else
    this.getSieve().value = false;
  
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
           .text("is "+(this.getSieve().value));  
}
    
//****************************************************************************//

function SieveExistsUI(elm)
{
  SieveTestBoxUI.call(this,elm);  
}

SieveExistsUI.prototype.__proto__ = SieveTestBoxUI.prototype;

SieveExistsUI.prototype.initEditor
    = function()
{
  return $("<div/>").text("all of the following header exist:")
    .append((new SieveHeaderListUI(this.getSieve().headerNames)).html())
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
  SieveTestBoxUI.call(this,elm);  
}

SieveHeaderUI.prototype.__proto__ = SieveTestBoxUI.prototype;

SieveHeaderUI.prototype.onValidate
    = function ()
{ 
  return true;      
}

SieveHeaderUI.prototype.initHelp
    = function ()
{
  return $("<div/>")
    .html('<h1>Header Test</h1>'
      + 'Use this test to compare Strings like a subject lines, spam score, etc.<br/>' 
      + "But do not compare against headers containing mail addresses, like To, Bcc,"
      + "From, Cc! They usually contain a display name. Instead of "
      + "'roadrunner@acme.example.com\' the header can be something similar to " 
      + "'\"roadrunner\" &lt;roadrunner@acme.example.com&gt;'. The \"address\" test "
      + "is aware of display names and compares against the pure mail address.")
}

SieveHeaderUI.prototype.initEditor
    = function()
{  
  // 
  //

  
  return $("<div/>")
      .append($("<h1/>").text("Any of the following header ..."))
      .append((new SieveHeaderListUI(this.getSieve().headerNames)).html())
      .append((new SieveMatchTypeUI(this.getSieve().matchType)).html())
      .append($("<h1/>").text("... any of the keyword(s)"))
      .append((new SieveStringListUI(this.getSieve().keyList)).html())    
      .append((new SieveComparatorUI(this.getSieve().comparator)).html());

}
  
SieveHeaderUI.prototype.initSummary
    = function()
{
  // case- insensitive is the default so skip it...
  return $("<div/>")
      .text(" header "+this.getSieve().headerNames.toScript()
              +" [is|contains|matches] [case-sensitive] "
              +this.getSieve().keyList.toScript());
}

//****************************************************************************//

function SieveAddressUI(elm)
{
  SieveTestBoxUI.call(this,elm);
}

SieveAddressUI.prototype.__proto__ = SieveTestBoxUI.prototype;

SieveAddressUI.prototype.onValidate
    = function ()
{
  return true;      
}

SieveAddressUI.prototype.initHelp
    = function ()
{
  return $("<div/>")
      .html('<h1>Address Test</h1>'
      +'The address test is designed to match headers containing E-Mail addresses.' 
      + 'It offers compared to the "header test" more sophisticated address matching'
      + ' and is capable to cope with addres headers containing display names');
}

SieveAddressUI.prototype.initEditor
    = function()
{
 
  /*From, To, Cc, Bcc, Sender, Resent-From, Resent-To*/
  return $("<div/>")
      .append($("<h1/>").text("Any of the following header ..."))
      .append((new SieveHeaderListUI(this.getSieve().headerList)).html())
      .append((new SieveMatchTypeUI(this.getSieve().matchType)).html())
      .append((new SieveAddressPartUI(this.getSieve().addressPart)).html())
      .append($("<h1/>").text("... any of the keyword(s)"))
      .append((new SieveStringListUI(this.getSieve().keyList)).html())    
      .append((new SieveComparatorUI(this.getSieve().comparator)).html());
}
  
SieveAddressUI.prototype.initSummary
    = function()
{
  // case- insensitive is the default so skip it...
  return $("<div/>")
      .text(" address "+this.getSieve().headerList.toScript()
              +" [is|contains|matches] [case-sensitive] "
              +this.getSieve().keyList.toScript());
}





function SieveEnvelopeUI(elm)
{
  SieveTestBoxUI.call(this,elm);
}

SieveEnvelopeUI.prototype.__proto__ = SieveTestBoxUI.prototype;


SieveEnvelopeUI.prototype.initSummary
    = function()
{
  return $("<div/>").text("envelope:"+this.getSieve().toScript());
}

