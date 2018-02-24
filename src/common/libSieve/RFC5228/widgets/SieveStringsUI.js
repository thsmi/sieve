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

(function (exports) {

  "use strict";
  /* global $: false */
  /* global SieveAbstractBoxUI */

  function SieveStringListUI(elm) {
    // Call parent constructor...
    SieveAbstractBoxUI.call(this, elm);
    this._defaults = [];
  }

  SieveStringListUI.prototype = Object.create(SieveAbstractBoxUI.prototype);
  SieveStringListUI.prototype.constructor = SieveStringListUI;

  SieveStringListUI.prototype.onAddItem
    = function (owner) {
      this._createListItemUI("")
        .insertAfter(owner.parent().parent().parent())
        .find("input")
        .focus();

      // moving the focus impicitely triggest onUpdateItem, so we do not...
      // have to call it here...
    };

  SieveStringListUI.prototype.onRemoveItem
    = function (elm) {
      if (!elm.hasClass("sivStringListItem"))
        throw new Error("String List item expected");

      let owner = elm.parents(".SivStringList");

      elm.remove();

      this.onUpdateItem(owner);
    };

  SieveStringListUI.prototype.onUpdateItem
    = function (elm) {
      if (!elm.hasClass("SivStringList"))
        throw new Error("String List expected");
      /* we rebuild the whole string list at it's easier to do so */

      let inputs = elm.find("input");

      if (!inputs.length)
        return;

      this.getSieve().clear();

      for (let i = 0; i < inputs.length; i++)
        this.getSieve().append(inputs[i].value);
    };

  SieveStringListUI.prototype.defaults
    = function (defaults) {
      if (typeof (defaults) === "undefined")
        return this._defaults;

      this._defaults = defaults;
      return this;
    };


  SieveStringListUI.prototype.showDropDown
    = function (parent) {

      let defaults = this.defaults();

      if (!defaults.length)
        return;

      let item = $("<select/>")
        .attr("size", defaults.length)
        .change(function (ev) {
          $(this).parent().find("input").val(item.val()).change().focus();
        })
        .blur(function () { $(this).remove(); });

      for (let i = 0; i < defaults.length; i++)
        if (!this.getSieve().contains(defaults[i]))
          item.append($("<option>").text(defaults[i]).val(defaults[i]));

      if (!item.find("option").length)
        return;

      item.insertAfter(parent).focus();
    };


  SieveStringListUI.prototype._createListItemUI
    = function (text) {
      let that = this;

      return $("<div/>")
        .addClass("sivStringListItem")
        .append($("<span/>")
          .append($("<input/>")
            .change(function (ev) { that.onUpdateItem($(this).parent().parent().parent()); })
            .val(text))
          .append($("<span/>")
            .append($("<span/>")
              .addClass("sivStringAdd")
              .click(function (ev) { that.onAddItem($(this)); }))
            .append($("<span/>")
              .addClass("sivStringRemove")
              .click(function (ev) { that.onRemoveItem($(this).parents(".sivStringListItem")); }))
            .append($("<span/>")
              .addClass("sivStringDrop")
              .click(function (ev) { that.showDropDown($(this).parent()); }))));

    };

  SieveStringListUI.prototype.init
    = function () {
      let headers = $("<div/>").addClass("SivStringList");

      for (let i = 0; i < this.getSieve().size(); i++)
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
    = function () {
      if (this._domElm)
        return this._domElm;

      this._domElm = this.init();

      return this._domElm;
    };

  exports.SieveStringListUI = SieveStringListUI;

})(window);

// FIXME: The Widgest should not be created via new,
// instead the Sieve Designer should be invoked...

/* if (!SieveDesigner)
  throw "Could not register String Widgets";

SieveDesigner.register("stringlist", SieveStringListUI);
SieveDesigner.register("match-type", SieveElseUI);
SieveDesigner.register("address-part", SieveAddressPartUI);
SieveDesigner.register("comparator", SieveComparatorUI);*/


