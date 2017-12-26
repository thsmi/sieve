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

  function SieveStringListWidget(selector) {
    this._selector = selector;
    this._min = 0;
  }

  SieveStringListWidget.prototype.addItem
    = function (value) {

      if (typeof (value) === "undefined")
        value = "";

      let elm = this.template().clone();

      $($(this._selector).attr("list-new")).before(elm);

      elm.find(":text").val(value).focus();
      elm.find("button").click(() => {
        if (this._min >= this.items().length)
          return;
        elm.remove();
      }
      );

      return this;
    };

  SieveStringListWidget.prototype.init
    = function () {

      $($(this._selector).attr("list-new"))
        .click(() => { this.addItem(); });

      this._min = parseInt($(this._selector).attr("list-min"), 10);

      if (isNaN(this._min))
        this._min = 0;

      return this;
    };

  SieveStringListWidget.prototype.template
    = function () {
      return $($(this._selector).attr("list-template")).children().first();
    };

  SieveStringListWidget.prototype.items
    = function () {
      let id = ($(this._selector).attr("list-items"));

      return $(id + " input[type='text']," + id + " input[type='email']");
    };

  SieveStringListWidget.prototype.values
    = function (values) {

      if (typeof (values) !== "undefined") {

        for (let i = 0; i < values.size(); i++)
          this.addItem(values.item(i));

        return this;
      }

      // Convert the items into a string array...
      let result = [];

      this.items().each(function () {
        result.push($(this).val());
      });

      return result;
    };

  function SieveTabWidget() {
    this._tabs = "div.dialogTab";
    this._content = ".tab-content";
  }

  SieveTabWidget.prototype.init
    = function (tabs, content) {

      $(this._tabs + ' > div').click(() => {
        this.onTabChange(this);
      });
    };

  SieveTabWidget.prototype.onTabChange
    = function (elm) {

      $(this._tabs + ' > div').removeClass('tab-active');
      $(this._content + ' > div').removeClass('tab-active');

      $(elm).addClass('tab-active');

      let id = $(elm).attr('tab-content');
      $("#" + id).addClass('tab-active');
    };

  exports.SieveTabWidget = SieveTabWidget;
  exports.SieveStringListWidget = SieveStringListWidget;

})(window);
