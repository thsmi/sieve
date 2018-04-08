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
  /* global SieveActionBoxUI */
  /* global SieveActionDialogBoxUI */
  /* global SieveDesigner */
  /* global SieveStringListWidget */

  /**
   * Provides an UI for the Return Action
   */
  class SieveReturnUI extends SieveActionBoxUI {

    /**
     * @inheritDoc
     */
    getSummary() {
      return $("<div/>")
        .text("End current script and return to the parent script");
    }
  }

  /**
   * Provides an UI for the global action
   */
  class SieveGlobalActionUI extends SieveActionDialogBoxUI {

    /**
     * @returns {SieveAbstractElement}
     *   the element's variables field
     */
    variables() {
      return this.getSieve().getElement("variables");
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./include/template/SieveGlobalActionUI.html";
    }

    /**
     * @inheritDoc
     */
    onSave() {
      let variables = (new SieveStringListWidget("#sivIncludeGlobalList"));

      if (!variables.isUnique()) {
        alert("Variable list items have to be unique");
        return false;
      }

      if (variables.isEmpty()) {
        alert("Variable list has to be non empty");
        return false;
      }

      variables.save(this.variables());
      return true;
    }

    /**
     * @inheritDoc
     */
    onLoad() {
      (new SieveStringListWidget("#sivIncludeGlobalList"))
        .init(this.variables());
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      return $("<div/>")
        .html("Define as global variable(s) " + $('<em/>').text(this.variables()).html());
    }
  }


  /**
   * A UI for the include action
   */
  class SieveIncludeActionUI extends SieveActionDialogBoxUI {


    once(value) {
      return this.getSieve().enable("once", value);
    }

    optional(value) {
      return this.getSieve().enable("optional", value);
    }

    personal(value) {

      let elm = this.getSieve().getElement("location");

      if (value === true)
        elm.setValue(":personal");

      if (value === false)
        elm.setValue(":global");

      return (elm.getValue() === ":personal");
    }

    script(value) {

      let elm = this.getSieve().getElement("script");

      if (value !== null && typeof (value) !== "undefined")
        elm.value(value);

      return elm.value();
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./include/template/SieveIncludeActionUI.html";
    }

    /**
     * @inheritDoc
     */
    onLoad() {
      $('input:radio[name="personal"][value="' + !!this.personal() + '"]').prop('checked', true);

      $('input:checkbox[name="optional"]').prop('checked', !!this.optional());
      $('input:checkbox[name="once"]').prop('checked', !!this.once());

      $("#sivIncludeScriptName").val(this.script());
    }

    /**
     * @inheritDoc
     */
    onSave() {

      let script = $("#sivIncludeScriptName");

      let value = script.val();
      if (value.trim() === "") {
        script.addClass("is-invalid");
        return false;
      }

      this.script(value);

      this.personal($("input[type='radio'][name='personal']:checked").val() === "true");
      this.optional(($("input:checkbox[name='optional']:checked").length > 0));
      this.once(($("input:checkbox[name='once']:checked").length > 0));

      return true;
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      let str =
        "Include "
        + (this.personal() ? "personal" : "global")
        + " script " + $('<em/>').text(this.script()).html();

      return $("<div/>")
        .html(str);
    }
  }


  if (!SieveDesigner)
    throw new Error("Could not register Action Widgets");


  SieveDesigner.register("action/return", SieveReturnUI);
  SieveDesigner.register("action/global", SieveGlobalActionUI);
  SieveDesigner.register("action/include", SieveIncludeActionUI);

})(window);
