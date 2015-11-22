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

/* global $: false */
/* global SieveAbstractBoxUI */

"use strict";

function SieveAddressPartUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
}

SieveAddressPartUI.prototype = Object.create(SieveAbstractBoxUI.prototype); 
SieveAddressPartUI.prototype.constructor = SieveAddressPartUI;

SieveAddressPartUI.prototype.onSelect
    = function ()
{
  var value = $("input[name='rgAddressPart"+this.id()+"']:checked").val(); 
  this.getSieve().addressPart(value);
};

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
        .change(function () {that.onSelect();}))
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
        .change(function () {that.onSelect(); }))
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
        .change(function () {that.onSelect();}))
      .append($("<div/>")
        .css("float","left")        
        .append($("<h1/>").text("... a local part with..."))
        .append($("<span/>").html('Everything before the @ sign. The local part is case sensistive.<br>'
          + 'e.g.: "me@example.com" is stripped to "me"'))))
    .find("input[name='rgAddressPart"+this.id()+"'][value='"+this.getSieve().addressPart()+"']")
      .attr("checked","checked")
    .end();           
          
};

//****************************************************************************//


function SieveComparatorUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
}

SieveComparatorUI.prototype = Object.create(SieveAbstractBoxUI.prototype); 
SieveComparatorUI.prototype.constructor = SieveComparatorUI;

SieveComparatorUI.prototype.onSelect
    = function ()
{
  var value = $("input[name='rgComparator"+this.id()+"']:checked").val(); 
  this.getSieve().comparator(value);
};

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
        .change(function () {that.onSelect();}))
      .append($("<span/>").text("Case insensitive ASCII String (default)")))
    .append($("<div/>")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgComparator"+this.id())
        .attr("value","i;octet")
        .change(function () {that.onSelect();}))
      .append($("<span/>").text("Case sensitive byte by byte")))
      .find("input[name='rgComparator"+this.id()+"'][value='"+this.getSieve().comparator()+"']")
        .attr("checked","checked")
      .end();
};

//****************************************************************************//

function SieveStringListUI(elm)
{
  // Call parent constructor...
  SieveAbstractBoxUI.call(this,elm);
  this._defaults = [];
}

SieveStringListUI.prototype = Object.create(SieveAbstractBoxUI.prototype);  
SieveStringListUI.prototype.constructor = SieveStringListUI;

SieveStringListUI.prototype.onAddItem
    = function (owner)
{    
  this._createListItemUI("")
    .insertAfter(owner.parent().parent().parent())
    .find("input")
      .focus();
      
  // moving the focus impicitely triggest onUpdateItem, so we do not...
  // have to call it here...
};

SieveStringListUI.prototype.onRemoveItem
    = function (elm)
{
  if (!elm.hasClass("sivStringListItem"))
    throw "String List item expected";
   
  var owner = elm.parents(".SivStringList");
  
  elm.remove();
  
  this.onUpdateItem(owner);   
};

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
};

SieveStringListUI.prototype.defaults
  = function (defaults)
{
  if (typeof(defaults) === "undefined")
    return this._defaults;
  
  this._defaults = defaults;
  return this;   
};


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
    .blur(function() {$(this).remove();});
    
  for (var i=0; i<defaults.length; i++)
    if (!this.getSieve().contains(defaults[i]))
      item.append($("<option>").text(defaults[i]).val(defaults[i]) );

  if (!item.find("option").length)
    return;
    
  item.insertAfter(parent).focus();
};


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
            .click(function(ev){ that.showDropDown($(this).parent()); } ))));
        
};

SieveStringListUI.prototype.init
    = function ()
{
  var that = this;
  var headers = $("<div/>").addClass("SivStringList");
  
  for (var i=0; i< this.getSieve().size(); i++)
    headers.append(this._createListItemUI(this.getSieve().item(i)));
  
 /* headers.append($("<div/>")
    .attr("id","divAddString"+this.id())
    .append($("<input/>")
      .attr("id","txtAddString"+this.id()))
    .append($("<button/>").text("+")
      .click(function(){ that.onAddItem() } )));*/
    
  return headers; 
};

SieveStringListUI.prototype.html
    = function ()
{
  if (this._domElm)
    return this._domElm;

  var _this = this;
    
  this._domElm = this.init();
         
  return this._domElm;
};





// FIXME: The Widgest should not be created via new,
// instead the Sieve Designer should be invoked...

/*if (!SieveDesigner)
  throw "Could not register String Widgets";

SieveDesigner.register("stringlist", SieveStringListUI);
SieveDesigner.register("match-type", SieveElseUI);
SieveDesigner.register("address-part", SieveAddressPartUI);
SieveDesigner.register("comparator", SieveComparatorUI);*/


