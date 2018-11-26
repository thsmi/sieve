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

    /**
     * If once is enable the script can be included at most once.
     * Including it more than once results in an error.
     *
     * @param {Boolean} value
     *   true in case the script can be included more than once otherwise false.
     * @returns {Boolean}
     *   the current once flag
     */
    once(value) {
      return this.getSieve().enable("once", value);
    }

    /**
     * Optional indicates if it is an error in case the script
     * can not be included.
     *
     * @param {Boolean} value
     *   true makes the action fail silently. False will raise an error.
     * @returns {Boolean}
     *   the current optional flag.
     */
    optional(value) {
      return this.getSieve().enable("optional", value);
    }

    /**
     * Scripts can be included from personal or global location.
     * Global locations are normally accessible by all users while
     * a personal is normally equivalent to the current mailbox.
     *
     * A script has to be either in personal or global location.
     *
     * @param {Boolean} value
     *   true to enable a personal script, false for a global script.
     * @returns {boolean}
     *   the current personal flag.
     */
    personal(value) {

      let elm = this.getSieve().getElement("location");

      if (value === true)
        elm.setValue(":personal");

      if (value === false)
        elm.setValue(":global");

      return (elm.getValue() === ":personal");
    }

    /**
     * Gets and sets the script location.
     *
     * @param {String} [value]
     *   the script location to set
     * @returns {String}
     *   the current script location.
     */
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
