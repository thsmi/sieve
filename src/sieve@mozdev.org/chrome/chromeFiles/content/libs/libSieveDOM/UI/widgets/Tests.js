/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

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
  return $("<div/>").text("all of the following header exist:")
    .append((new SieveHeaderListUI(this.getSieve().headerNames)).getWidget())
}
  
SieveExistsUI.prototype.initSummary
    = function()
{
  return $("<div/>")
           .text("all of the following header exist:"+this.getSieve().headerNames.toScript())
}

//****************************************************************************//
function SieveHeaderUI(elm)
{
  SieveEditableDragBoxUI.call(this,elm);
  this.flavour("sieve/test");  
}

SieveHeaderUI.prototype.__proto__ = SieveEditableDragBoxUI.prototype;

SieveHeaderUI.prototype.initEditor
    = function()
{
 
  return $("<div/>")
    .append($("<div/>").text("Test if any of the following keyword(s) is contained ..."))
    .append((new SieveStringListUI(this.getSieve().keyList)).getWidget())
    .append($("<div/>")
      .append($("<input/>")
        .attr("type","radio")
        // TODO add Sieve ID here
        .attr("name","rgMatchTypeid"))
      .append($("<span/>")
        .html('... as an absolute match...<br>e.g. "frobnitzm" contains "frob" and "nit", but not "fbm"')))
    .append($("<div/>")
      .append($("<input/>")
        .attr("type","radio")
        // TODO add Sieve ID here
        .attr("name","rgMatchTypeid"))
      .append($("<span/>")
        .html('... as an absolute match...<br>e.g. "e.g. only "frobnitzm" is "frobnitzm"')))
    .append($("<div/>")
      .append($("<input/>")
        .attr("type","radio")
        // TODO add Sieve ID here
        .attr("name","rgMatchTypeid"))
      .append($("<span/>")
        .html('... as an wildcard match ...<br>'
          + '"*" matches zero or more characters, and "?" matches a single character <br>'
          + 'e.g.: "frobnitzm" matches "frob*zm" or "frobnit?m" but not frob?m ')))
    .append($("<div/>").text("... in any of the following Headers"))
    .append((new SieveHeaderListUI(this.getSieve().headerNames)).getWidget())
    .append($("<div/>")
      .text("Compare")
      .append($("<input/>")
        .attr("type","radio")
        // TODO add Sieve ID here
        .attr("name","rgComparatorid"))
      .append($("<span/>")
        .html('Case insensitive ASCII String (default)')))
    .append($("<div/>")
      .append($("<input/>")
        .attr("type","radio")
        // TODO add Sieve ID here
        .attr("name","rgMatchTypeid"))
      .append($("<span/>")
        .html('Case sensitive UTF-8 Octetts')));
}
  
SieveHeaderUI.prototype.initSummary
    = function()
{
  // case- insensitive is the default so skip it...
  return $("<div/>")
      .text(" "+this.getSieve().headerNames.toScript()
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
  
  if ($("#AnyOfAllOfValue"+this.getId()).val() == "true")
    this.getSieve().isAllOf = true
  else
    this.getSieve().isAllOf = false;
    
  $("#lblAnyOfAllOf"+this.getId())
    .text((this.getSieve().isAllOf)?"123All of the following:":"123Any of the following:");          
  
  return true;      
}

SieveAnyOfAllOfUI.prototype.initEditor
    = function ()
{
  return $(document.createElement("div"))
           .append($("<select/>")
             .attr("id","AnyOfAllOfValue"+this.getId())           
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
           .attr("id","lblAnyOfAllOf"+this.getId())           
           .text((this.getSieve().isAllOf)?"All of the following:":"Any of the following:");  
}



SieveAnyOfAllOfUI.prototype.init
    = function()
{
  var item = SieveEditableDragBoxUI.prototype.init.call(this);
  
  for (var i=0; i<this.getSieve().tests.length; i++)
    item.append($("<div/>")
      .css("padding-left","30px")
      .append(this.getSieve().tests[i][1].toWidget()))
      
  
  return item;
}