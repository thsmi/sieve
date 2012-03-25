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
    .append(
      (new SieveStringListUI(this.getSieve().headerNames))
        .defaults(["To","From","Cc","Bcc","Reply-To","Subject","Date","Message-ID","Content-Type"])
        .html());
}
  
SieveExistsUI.prototype.initSummary
    = function()
{ 
  return $("<div/>")
           .html("the following header(s) exist:"
             +"<em>"+ $('<div/>').text(this.getSieve().headerNames.toScript()).html()+"</em>");
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
    .html('<h1>Compares header as strings</h1>'
      + '<p>You typically use this test with headers containing subject line or' +
          ' a spam score</p>' 
      + "<p>Do not use this test, if the header should be matched against a " +
          "mail addresses. The result will be unrealiable, as this test is" +
          "not aware of display names. Use the address test instead")
}

SieveHeaderUI.prototype.initEditor
    = function()
{  
  // 
  //

  
  return $("<div/>")
      .append($("<h1/>").text("Any of the following header ..."))
      .append((new SieveStringListUI(this.getSieve().headerNames))
        .defaults(["Subject","Date","Message-ID","Content-Type"]).html())
      .append((new SieveMatchTypeUI(this.getSieve().matchType)).html())
      .append($("<h1/>").text("... any of the keyword(s)"))
      .append((new SieveStringListUI(this.getSieve().keyList)).html())    
      .append((new SieveComparatorUI(this.getSieve().comparator)).html());

}
  
SieveHeaderUI.prototype.initSummary
    = function()
{  
  return $("<div/>")
      .html(" header <em>"+ $('<div/>').text(this.getSieve().headerNames.toScript()).html()+"</em>"
              + " " + this.getSieve().matchType.type
              + " <em>" + $('<div/>').text(this.getSieve().keyList.toScript()).html()+"</em>");
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
      .html('<h1>Compares headers against E-Mail addresses.</h1>'
      + '<p>You typically use test with headers like "to", "from", "cc" etc. </p>'
      + '<p>As this test is aware of e-mail addresses containing display names. '
      + "A header containing  '\"roadrunner\" &lt;roadrunner@acme.example.com&gt;'"
      + " is considered to be equivalent to \"'roadrunner@acme.example.com\"</p>"            
      + '<p>If the header should be matched against a string use the header test.</p>'      
);
}

SieveAddressUI.prototype.initEditor
    = function()
{
 
  /*From, To, Cc, Bcc, Sender, Resent-From, Resent-To*/
  return $("<div/>")
      .append($("<h1/>").text("Any of the following header ..."))
      .append((new SieveStringListUI(this.getSieve().headerList))
        .defaults(["To","From","Cc","Bcc","Reply-To"]).html())
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
      .html(" address <em>"+ $('<div/>').text(this.getSieve().headerList.toScript()).html()+"</em>"
              + " " + this.getSieve().matchType.type
              + " " + ((this.getSieve().addressPart.type != "all") ? this.getSieve().addressPart.type: "")
              + " <em>" + $('<div/>').text(this.getSieve().keyList.toScript()).html()+"</em>");
}





function SieveEnvelopeUI(elm)
{
  SieveTestBoxUI.call(this,elm);
}

SieveEnvelopeUI.prototype.__proto__ = SieveTestBoxUI.prototype;

SieveEnvelopeUI.prototype.initHelp
    = function ()
{
      
  return $("<div/>")
    .html('<h1>Compares fields against the envelope</h1>'
      + '<p>The envelop is equivalent to the mail delivery protocol. So it ' +
          'does not test against a real header. Instead uses trace information' +
          'from the mail delivery protocol for specific values.</p>' +
          '<p>A "to" tests the SMTP sender field "RCPT TO" a "from" the recipient' +
          ' "MAIL FROM". </p>' +
          '<p>It\'s the most reliant way to test from which address a meessage ' +
          'was send to or received.</p>');
}

SieveEnvelopeUI.prototype.initEditor
    = function()
{
 
/*envelope [COMPARATOR] [ADDRESS-PART] [MATCH-TYPE]
            <envelope-part: string-list> <key-list: string-list>*/  
  /*From, To, Cc, Bcc, Sender, Resent-From, Resent-To*/
  return $("<div/>")
      .append($("<h1/>").text("Any of the following envelope fields ..."))
      .append((new SieveStringListUI(this.getSieve().envelopeList))
        .defaults(["From","To"]).html())
      .append((new SieveMatchTypeUI(this.getSieve().matchType)).html())
      .append((new SieveAddressPartUI(this.getSieve().addressPart)).html())
      .append($("<h1/>").text("... any of the keyword(s)"))
      .append((new SieveStringListUI(this.getSieve().keyList)).html())    
      .append((new SieveComparatorUI(this.getSieve().comparator)).html());
}

SieveEnvelopeUI.prototype.initSummary
    = function()
{
  return $("<div/>")
      .html(" envelope <em>"+ $('<div/>').text(this.getSieve().envelopeList.toScript()).html()+"</em>"
              + " " + this.getSieve().matchType.type
              + " " + ((this.getSieve().addressPart.type != "all") ? this.getSieve().addressPart.type: "")
              + " <em>" + $('<div/>').text(this.getSieve().keyList.toScript()).html()+"</em>");
}

