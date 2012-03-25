/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

 "use strict";

function SieveMatchTypeUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
}

SieveMatchTypeUI.prototype.__proto__ = SieveAbstractBoxUI.prototype; 

SieveMatchTypeUI.prototype.onSelect
    = function ()
{
  var value = $("input[name='rgMatchType"+this.id()+"']:checked").val(); 
  this.getSieve().matchType(value);
}

SieveMatchTypeUI.prototype.createHtml
    = function ()
{
  var that = this;
  
  return $("<div/>")
    .addClass("sivMatchType")
    .append($("<div/>")
      .css("overflow","auto")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgMatchType"+this.id())
        .css("float","left")
        .attr("value","contains")
        .change(function () {that.onSelect()}))
      .append($("<div/>")
        .css("float","left")
        .append($("<h1/>").text("... contains ..."))
        .append($("<span/>").text('e.g. "frobnitzm" contains "frob" and "nit", but not "fbm"'))))
    .append($("<div/>")
      .css("overflow","auto")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgMatchType"+this.id())
        .css("float","left")
        .attr("value","is")
        .change(function () {that.onSelect()}))
      .append($("<div/>")
        .css("float","left")
        .append($("<h1/>").text("... is ..."))
        .append($("<span/>").text('e.g. only "frobnitzm" is "frobnitzm"'))))
    .append($("<div/>")
      .css("overflow","auto")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgMatchType"+this.id())
        .css("float","left")
        .attr("value","matches")
        .change(function () {that.onSelect()}))
      .append($("<div/>")
        .css("float","left")        
        .append($("<h1/>").text("... matches ..."))
        .append($("<span/>").html('... as an wildcard match ...<br>'
          + '"*" matches zero or more characters, and "?" matches a single character <br>'
          + 'e.g.: "frobnitzm" matches "frob*zm" or "frobnit?m" but not frob?m '))))
    .find("input[name='rgMatchType"+this.id()+"'][value='"+this.getSieve().matchType()+"']")
      .attr("checked","checked")
    .end();
}
//****************************************************************************//

function SieveAddressPartUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
}

SieveAddressPartUI.prototype.__proto__ = SieveAbstractBoxUI.prototype; 

SieveAddressPartUI.prototype.onSelect
    = function ()
{
  var value = $("input[name='rgAddressPart"+this.id()+"']:checked").val(); 
  this.getSieve().addressPart(value);
}

SieveAddressPartUI.prototype.createHtml
    = function ()
{
  var that = this;
  
  return $("<div/>")
    .addClass("sivAddressPart")
    .append($("<div/>")
      .css("overflow","auto")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgAddressPart"+this.id())
        .css("float","left")
        .attr("value","all")
        .change(function () {that.onSelect()}))
      .append($("<div/>")
        .css("float","left")
        .append($("<h1/>").text("... an email address with ..."))
        .append($("<span/>").html('An email address consists of a domain an a local part split by the "@" sign.<br>'
          + 'The local part is case sensitive while the domain part is not'))))
    .append($("<div/>")
      .css("overflow","auto")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgAddressPart"+this.id())
        .css("float","left")
        .attr("value","domain")
        .change(function () {that.onSelect()}))
      .append($("<div/>")
        .css("float","left")
        .append($("<h1/>").text("... a domain part with ..."))
        .append($("<span/>").html('Everything after the @ sign. The domain part is not case sensistive.<br>'
          + 'e.g.: "me@example.com" is stripped to "example.com"'))))
    .append($("<div/>")
      .css("overflow","auto")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgAddressPart"+this.id())
        .css("float","left")
        .attr("value","localpart")
        .change(function () {that.onSelect()}))
      .append($("<div/>")
        .css("float","left")        
        .append($("<h1/>").text("... a local part with..."))
        .append($("<span/>").html('Everything before the @ sign. The local part is case sensistive.<br>'
          + 'e.g.: "me@example.com" is stripped to "me"'))))
    .find("input[name='rgAddressPart"+this.id()+"'][value='"+this.getSieve().addressPart()+"']")
      .attr("checked","checked")
    .end();           
          
}

//****************************************************************************//

function SieveComparatorUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
}

SieveComparatorUI.prototype.__proto__ = SieveAbstractBoxUI.prototype; 

SieveComparatorUI.prototype.onSelect
    = function ()
{
  var value = $("input[name='rgComparator"+this.id()+"']:checked").val(); 
  this.getSieve().comparator(value);
}

SieveComparatorUI.prototype.createHtml
    = function ()
{
  var that = this;
  return $("<div/>")
    .addClass("sivComparator")
    .append($("<h1/>").text("Compare"))
    .append($("<div/>")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgComparator"+this.id())
        .attr("value","i;ascii-casemap")
        .change(function () {that.onSelect()}))
      .append($("<span/>").text("Case insensitive ASCII String (default)")))
    .append($("<div/>")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgComparator"+this.id())
        .attr("value","i;octet")
        .change(function () {that.onSelect()}))
      .append($("<span/>").text("Case sensitive UTF-8 Octetts")))
      .find("input[name='rgComparator"+this.id()+"'][value='"+this.getSieve().comparator()+"']")
        .attr("checked","checked")
      .end();
}

//****************************************************************************//

function SieveStringListUI(elm)
{
  // Call parent constructor...
  SieveAbstractBoxUI.call(this,elm);
  this._defaults = [];
}

SieveStringListUI.prototype.__proto__ = SieveAbstractBoxUI.prototype;  

SieveStringListUI.prototype.onAddItem
    = function (owner)
{    
  this._createListItemUI("")
    .insertAfter(owner.parent().parent().parent())
    .find("input")
      .focus();
      
  // moving the focus impicitely triggest onUpdateItem, so we do not...
  // have to call it here...
}

SieveStringListUI.prototype.onRemoveItem
    = function (elm)
{
  if (!elm.hasClass("sivStringListItem"))
    throw "String List item expected";
   
  var owner = elm.parents(".SivStringList");
  
  elm.remove();
  
  this.onUpdateItem(owner);   
}

SieveStringListUI.prototype.onUpdateItem
    = function (elm)
{
  if (!elm.hasClass("SivStringList"))
    throw "String List expected";  
  /* we rebuild the whole string list at it's easier to do so */ 
  
  var inputs = elm.find("input");
 
  if (!inputs.length)
    return;  
  
  this.getSieve().clear();
  
  for (var i=0; i<inputs.length; i++ )
    this.getSieve().append(inputs[i].value);
}

SieveStringListUI.prototype.defaults
  = function (defaults)
{
  if (typeof(defaults) === "undefined")
    return this._defaults;
  
  this._defaults = defaults;
  return this;   
}


SieveStringListUI.prototype.showDropDown
    = function (parent)
{ 
    
  var defaults = this.defaults();    

  if (!defaults.length)
    return;

  var that = this;
  
  var item = $("<select/>")
    .attr("size",defaults.length)
    .change(function(ev){ 
      $(this).parent().find("input").val(item.val()).change().focus(); } )
    .blur(function() {$(this).remove()})
    
  for (var i=0; i<defaults.length; i++)
    if (!this.getSieve().contains(defaults[i]))
      item.append($("<option>").text(defaults[i]).val(defaults[i]) );

  if (!item.find("option").length)
    return;
    
  item.insertAfter(parent).focus();
}


SieveStringListUI.prototype._createListItemUI
    = function (text)
{
  var that = this;
  
  return $("<div/>")
      .addClass("sivStringListItem")
      .append($("<span/>") 
        .append($("<input/>")
          .change(function(ev){ that.onUpdateItem($(this).parent().parent().parent());})
          .val(text))
        .append($("<span/>")
          .append($("<span/>")
            .addClass("sivStringAdd")
            .click(function(ev){ that.onAddItem($(this));} ))          
          .append($("<span/>")
            .addClass("sivStringRemove")
            .click(function(ev){ that.onRemoveItem($(this).parents(".sivStringListItem"));} ))                
          .append($("<span/>")
            .addClass("sivStringDrop")
            .click(function(ev){ that.showDropDown($(this).parent()) } ))));
        
}

SieveStringListUI.prototype.init
    = function ()
{
  var that = this;
  var headers = $("<div/>").addClass("SivStringList");
  
  for (var i=0; i< this.getSieve().size(); i++)
    headers.append(this._createListItemUI(this.getSieve().item(i)))
  
 /* headers.append($("<div/>")
    .attr("id","divAddString"+this.id())
    .append($("<input/>")
      .attr("id","txtAddString"+this.id()))
    .append($("<button/>").text("+")
      .click(function(){ that.onAddItem() } )));*/
    
  return headers; 
}

SieveStringListUI.prototype.html
    = function ()
{
  if (this._domElm)
    return this._domElm;

  var _this = this;
    
  this._domElm = this.init();
         
  return this._domElm;
}

