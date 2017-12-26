/*
 * The contents of this file are licensed. You may obtain a copy of
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

(function (exports) {

  /* global $: false */
  /* global SieveDesigner */
  /* global SieveAbstractBoxUI */

  function SieveMatchTypeUI(elm) {
    SieveAbstractBoxUI.call(this, elm);
  }

  SieveMatchTypeUI.prototype = Object.create(SieveAbstractBoxUI.prototype);
  SieveMatchTypeUI.prototype.constructor = SieveMatchTypeUI;

  SieveMatchTypeUI.nodeName = function () {
    return "match-type";
  };

  SieveMatchTypeUI.nodeType = function () {
    return "comparison";
  };

  SieveMatchTypeUI.prototype.onSelect
    = function () {
      let value = $("input[name='rgMatchType" + this.id() + "']:checked").val();
      this.getSieve().matchType(value);
    };

  SieveMatchTypeUI.prototype.createHtml
    = function () {
      let value = this.getSieve().matchType();

      let widgets = SieveDesigner.getWidgetsByClass("match-type/", this.id());

      let item = $("<div/>").addClass("sivMatchType");
      let that = this;

      widgets.forEach(function (element) {
        item.append(element.html(function () { that.onSelect(); }));
      });

      item.find("input[name='rgMatchType" + this.id() + "'][value='" + value + "']")
        .attr("checked", "checked");

      return item;
    };

  // ************************************************************************************

  function SieveAbstractMatchUI(id) {
    this.id = id;
  }

  SieveAbstractMatchUI.prototype.html
    = function (value, header, description, callback) {
      return $("<div/>")
        .css("overflow", "auto")
        .append($("<input/>")
          .attr("type", "radio")
          .attr("name", "rgMatchType" + this.id)
          .css("float", "left")
          .attr("value", value)
          .change(callback))
        .append($("<div/>")
          .css("float", "left")
          .append($("<h1/>").text(header))
          .append($("<span/>").html(description)));
    };

  // ************************************************************************************

  function SieveContainsMatchUI(id) {
    SieveAbstractMatchUI.call(this, id);
  }

  SieveContainsMatchUI.prototype = Object.create(SieveAbstractMatchUI.prototype);
  SieveContainsMatchUI.prototype.constructor = SieveContainsMatchUI;

  SieveContainsMatchUI.nodeName = function () {
    return "match-type/contains";
  };

  SieveContainsMatchUI.nodeType = function () {
    return "match-type/";
  };

  SieveContainsMatchUI.isCapable = function (capabilities) {
    return true;
  };

  SieveContainsMatchUI.prototype.html
    = function (callback) {

      return SieveAbstractMatchUI.prototype.html.call(
        this, ":contains", "... contains ...",
        '"frobnitzm" contains "frob" and "nit", but not "fbm"', callback);
    };

  // ************************************************************************************

  function SieveIsMatchUI(id) {
    SieveAbstractMatchUI.call(this, id);
  }

  SieveIsMatchUI.prototype = Object.create(SieveAbstractMatchUI.prototype);
  SieveIsMatchUI.prototype.constructor = SieveIsMatchUI;

  SieveIsMatchUI.nodeName = function () {
    return "match-type/is";
  };

  SieveIsMatchUI.nodeType = function () {
    return "match-type/";
  };

  SieveIsMatchUI.isCapable = function (capabilities) {
    return true;
  };

  SieveIsMatchUI.prototype.html
    = function (callback) {

      return SieveAbstractMatchUI.prototype.html.call(
        this, ":is", "... is ...", 'Only "frobnitzm" is "frobnitzm"', callback);
    };


  // ************************************************************************************

  function SieveMatchesMatchUI(id) {
    SieveAbstractMatchUI.call(this, id);
  }

  SieveMatchesMatchUI.prototype = Object.create(SieveAbstractMatchUI.prototype);
  SieveMatchesMatchUI.prototype.constructor = SieveMatchesMatchUI;

  SieveMatchesMatchUI.nodeName = function () {
    return "match-type/matches";
  };

  SieveMatchesMatchUI.nodeType = function () {
    return "match-type/";
  };

  SieveMatchesMatchUI.isCapable = function (capabilities) {
    return true;
  };

  SieveMatchesMatchUI.prototype.html
    = function (callback) {

      return SieveAbstractMatchUI.prototype.html.call(
        this, ":matches", "... matches ...",
        '"*" matches zero or more characters, and "?" matches a single character <br>'
        + '"frobnitzm" matches "frob*zm" or "frobnit?m" but not frob?m', callback);
    };


  // ************************************************************************************

  if (!SieveDesigner)
    throw new Error("Could not register String Widgets");

  SieveDesigner.register("match-type", "comparison", SieveMatchTypeUI);
  SieveDesigner.register2(SieveIsMatchUI);
  SieveDesigner.register2(SieveContainsMatchUI);
  SieveDesigner.register2(SieveMatchesMatchUI);

  exports.SieveAbstractMatchUI = SieveAbstractMatchUI;
  exports.SieveMatchTypeUI = SieveMatchTypeUI;

})(window);
