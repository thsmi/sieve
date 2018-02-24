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


(function () {

  "use strict";

  /* global $: false */
  /* global SieveStringListWidget */
  /* global SieveActionDialogBoxUI */
  /* global SieveTabWidget */
  /* global SieveTestDialogBoxUI */
  /* global SieveMatchTypeUI */
  /* global SieveDesigner */
  /* global SieveComparatorUI */

  const MAX_QUOTE_LEN = 240;

  function SieveSetActionUI(elm) {
    SieveActionDialogBoxUI.call(this, elm);
  }

  SieveSetActionUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
  SieveSetActionUI.prototype.constructor = SieveSetActionUI;

  SieveSetActionUI.prototype.getTemplate
    = function () {
      return "./variables/templates/SieveSetActionUI.html #sivDialogVariables";
    };

  SieveSetActionUI.prototype.name
    = function (value) {
      return this.getSieve().getElement("name").value(value);
    };

  SieveSetActionUI.prototype.value
    = function (value) {
      return this.getSieve().getElement("value").value(value);
    };

  SieveSetActionUI.prototype.onSave
    = function () {
      let item = null;

      item = $("#sivVariableName").val();
      if (!item.trim()) {
        alert("Variable name can't be empty");
        return false;
      }

      this.name(item);
      this.value($("#sivVariableValue").val());

      let status;
      let value = null;

      status = $("input[type='checkbox'][name='10']").is(":checked");
      if (status)
        value = ":length";

      this.getSieve().getElement("modifier/10").setValue(value);
      this.getSieve().enable("modifier/10", status);

      value = null;
      status = $("input[type='checkbox'][name='20']").is(":checked");
      if (status)
        value = ":quotewildcard";

      this.getSieve().getElement("modifier/20").setValue(value);
      this.getSieve().enable("modifier/20", status);

      value = null;
      status = $("input[type='checkbox'][name='30']").is(":checked");
      if (status)
        value = $("input:radio[name='30']:checked").val();

      this.getSieve().getElement("modifier/30").setValue(value);
      this.getSieve().enable("modifier/30", status);

      value = null;
      status = $("input[type='checkbox'][name='40']").is(":checked");
      if (status)
        value = $("input:radio[name='40']:checked").val();

      this.getSieve().getElement("modifier/40").setValue(value);
      this.getSieve().enable("modifier/40", status);

      this.getSieve().toScript();

      return true;
    };


  SieveSetActionUI.prototype.onLoad
    = function () {

      (new SieveTabWidget()).init();

      let state = null;

      state = this.getSieve().enable("modifier/10");
      $('input:checkbox[name="10"]').prop('checked', state);

      state = this.getSieve().enable("modifier/20");
      $('input:checkbox[name="20"]').prop('checked', state);

      state = this.getSieve().enable("modifier/30");
      $('input:checkbox[name="30"]')
        .change(function () { $('input:radio[name="30"]').prop('disabled', !($(this).prop('checked'))); })
        .prop('checked', state)
        .change();

      // if (item)
      //   $('input:radio[name="30"][value="'+ item.nodeName().substr(9)+'"]' ).prop('checked', true);

      state = this.getSieve().enable("modifier/40");
      $('input:checkbox[name="40"]')
        .change(function () { $('input:radio[name="40"]').prop('disabled', !($(this).prop('checked'))); })
        .prop('checked', state)
        .change();

      // if (item)
      //  $('input:radio[name="40"][value="'+ item.nodeName().substr(9)+'"]' ).prop('checked', true);

      $("#sivVariableName").val(this.name());
      $("#sivVariableValue").val(this.value());
    };


  SieveSetActionUI.prototype.getSummary
    = function () {
      return $("<div/>")
        .html("Set variable <em>" + this.name() + "</em> to value " +
          "<div><em>" +
          $('<div/>').text(this.value().substr(0, MAX_QUOTE_LEN)).html() +
          ((this.value().substr().length > MAX_QUOTE_LEN) ? "..." : "") +
          "</em></div>");

    };

  // -----------------------------------------------------------------------------

  function SieveStringTestUI(elm) {
    SieveTestDialogBoxUI.call(this, elm);
  }

  SieveStringTestUI.prototype = Object.create(SieveTestDialogBoxUI.prototype);
  SieveStringTestUI.prototype.constructor = SieveStringTestUI;

  SieveStringTestUI.prototype.getTemplate
    = function () {
      return "./variables/templates/SieveStringTestUI.html #sivDialogVariables";
    };

  SieveStringTestUI.prototype.keys
    = function (values) {
      return this.getSieve().getElement("keys").values(values);
    };

  SieveStringTestUI.prototype.sources
    = function (values) {
      return this.getSieve().getElement("sources").values(values);
    };

  SieveStringTestUI.prototype.matchtype
    = function () {
      return this.getSieve().getElement("match-type");
    };

  SieveStringTestUI.prototype.comparator
    = function () {
      return this.getSieve().getElement("comparator");
    };

  SieveStringTestUI.prototype.onSave
    = function () {
      let values = null;

      values = (new SieveStringListWidget("#sivVariablesSourceList")).values();

      if (!values || !values.length) {
        window.alert("Source list is empty");
        return false;
      }

      this.sources(values);

      values = (new SieveStringListWidget("#sivVariablesKeyList")).values();

      if (!values || !values.length) {
        alert("Key list is empty");
        return false;
      }

      this.keys(values);

      return true;
    };


  SieveStringTestUI.prototype.onLoad
    = function () {
      (new SieveTabWidget()).init();

      (new SieveStringListWidget("#sivVariablesSourceList"))
        .init(this.sources());

      (new SieveStringListWidget("#sivVariablesKeyList"))
        .init(this.keys());

      let matchtype = new SieveMatchTypeUI(this.matchtype());
      $("#sivVariablesMatchTypes")
        .append(matchtype.html());

      let comparator = new SieveComparatorUI(this.comparator());
      $("#sivVariablesComparator")
        .append(comparator.html());
    };

  SieveStringTestUI.prototype.getSummary
    = function () {
      return $("<div/>")
        .html(" string " + $('<em/>').text(this.sources()).html()
          + " " + this.matchtype().getValue()
          + " " + $('<em/>').text(this.keys()).html());

    };


  if (!SieveDesigner)
    throw new Error("Could not register Body Extension");

  SieveDesigner.register("action/set", SieveSetActionUI);
  SieveDesigner.register("test/string", SieveStringTestUI);

})(window);
