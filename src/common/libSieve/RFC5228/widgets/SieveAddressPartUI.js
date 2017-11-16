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

/* global window */
 
"use strict";
 
(function(exports) {
  
  /* global $: false */
  /* global SieveDesigner */
  /* global SieveAbstractBoxUI */

  function SieveAddressPartUI(elm)
  {
    SieveAbstractBoxUI.call(this,elm);
  }
  
  SieveAddressPartUI.prototype = Object.create(SieveAbstractBoxUI.prototype);
  SieveAddressPartUI.prototype.constructor = SieveAddressPartUI;
  
  SieveAddressPartUI.nodeName = function () {
    return "address-part";
  };
  
  SieveAddressPartUI.nodeType  = function () {
    return "address-part";
  };
  
  SieveAddressPartUI.prototype.onSelect
      = function ()
  {
    var value = $("input[name='rgAddressPart"+this.id()+"']:checked").val(); 
    this.getSieve().addressPart(value);
  };
  
  SieveAddressPartUI.prototype.createHtml
      = function ()
  {
    var value = this.getSieve().addressPart();
    
    var widgets = SieveDesigner.getWidgetsByClass("address-part/",this.id());
    
    var item = $("<div/>").addClass("sivAddressPart");
    var that = this;
    
    widgets.forEach(function(element) { 
      item.append(element.html(function () {that.onSelect();})); 
    });
      
    item.find("input[name='rgAddressPart"+this.id()+"'][value='"+value+"']")
        .attr("checked","checked");
     
    return item;
  };
  
  //************************************************************************************
  
  function SieveAbstractAddressPartUI(id)
  {
    this.id = id;
  }
  
  SieveAbstractAddressPartUI.prototype.html 
      = function(value, header, description, callback)
  { 
    return $("<div/>")
        .css("overflow","auto")
        .append($("<input/>")
          .attr("type","radio")
          .attr("name","rgAddressPart"+this.id)
          .css("float","left")
          .attr("value",value)
          .change( callback))
        .append($("<div/>")
          .css("float","left")
          .append($("<h1/>").text(header))
          .append($("<span/>").html(description)));
  };
  
  //************************************************************************************
  
  function SieveAllPartUI(id)
  {
    SieveAbstractAddressPartUI.call(this,id);
  }
  
  SieveAllPartUI.prototype = Object.create(SieveAbstractAddressPartUI.prototype);
  SieveAllPartUI.prototype.constructor = SieveAllPartUI;
  
  SieveAllPartUI.nodeName = function () {
    return "address-part/all";
  };
  
  SieveAllPartUI.nodeType  = function () {
    return "address-part/";
  };
  
  SieveAllPartUI.isCapable = function (capabilities) {
    return true;      
  };
  
  SieveAllPartUI.prototype.html 
      = function(callback) {
        
    return SieveAbstractAddressPartUI.prototype.html.call(
      this, ":all","... an email address with ...",
      'An email address consists of a domain an a local part split by the "@" sign.<br>'
          + 'The local part is case sensitive while the domain part is not', callback);    
  };
  
  //************************************************************************************
  
  function SieveDomainPartUI(id)
  {
    SieveAbstractAddressPartUI.call(this, id);
  }
  
  SieveDomainPartUI.prototype = Object.create(SieveAbstractAddressPartUI.prototype);
  SieveDomainPartUI.prototype.constructor = SieveDomainPartUI;
  
  SieveDomainPartUI.nodeName = function () {
    return "address-part/domain";
  };
  
  SieveDomainPartUI.nodeType  = function () {
    return "address-part/";
  };
  
  SieveDomainPartUI.isCapable = function (capabilities) {
    return true;      
  };
  
  SieveDomainPartUI.prototype.html 
      = function(callback) {
        
    return SieveAbstractAddressPartUI.prototype.html.call(
      this, ":domain","... a domain part with ...",
      'Everything after the @ sign. The domain part is not case sensitive.<br>'
          + 'e.g.: "me@example.com" is stripped to "example.com"',
      callback);    
  };
  
  
  //************************************************************************************
  
  function SieveLocalPartUI(id)
  { 
    SieveAbstractAddressPartUI.call(this, id);
  }
  
  SieveLocalPartUI.prototype = Object.create(SieveAbstractAddressPartUI.prototype);
  SieveLocalPartUI.prototype.constructor = SieveLocalPartUI;
  
  SieveLocalPartUI.nodeName = function () {
    return "address-part/local";
  };
  
  SieveLocalPartUI.nodeType  = function () {
    return "address-part/";
  };
  
  SieveLocalPartUI.isCapable = function (capabilities) {
    return true;      
  };
  
  SieveLocalPartUI.prototype.html 
      = function(callback) {
        
    return SieveAbstractAddressPartUI.prototype.html.call(
      this, ":local", "... a local part with...",
            'Everything before the @ sign. The local part is case sensitive.<br>'
          + 'e.g.: "me@example.com" is stripped to "me"', callback);   
  };
  
  //************************************************************************************
  
  if (!SieveDesigner)
    throw "Could not register String Widgets";
  
  SieveDesigner.register("address-part", "address-part", SieveAddressPartUI);
  SieveDesigner.register2(SieveAllPartUI);
  SieveDesigner.register2(SieveDomainPartUI);
  SieveDesigner.register2(SieveLocalPartUI);
  
  exports.SieveAbstractAddressPartUI = SieveAbstractAddressPartUI;
  exports.SieveAddressPartUI = SieveAddressPartUI;
  
})(window);