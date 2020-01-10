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

(function () {

  "use strict";

  /* global $: false */
  /* global SieveActionBoxUI */
  /* global SieveActionDialogBoxUI */
  /* global SieveDesigner */
  /* global SieveStringListWidget */

  const DOM_ELEMENT = 0;
  /**
   * Provides an UI for the Return Action
   */
  class SieveReturnUI extends SieveActionBoxUI {

    /**
     * @inheritdoc
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
     * @inheritdoc
     */
    getTemplate() {
      return "./include/template/SieveGlobalActionUI.html";
    }

    /**
     * @inheritdoc
     */
    onSave() {
      const variables = (new SieveStringListWidget("#sivIncludeGlobalList"));

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
     * @inheritdoc
     */
    onLoad() {
      (new SieveStringListWidget("#sivIncludeGlobalList"))
        .init(this.variables());
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .append($("<span/>").text("Define global variable(s): "))
        .append($("<em/>").text(this.variables().values()));
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
     * @param {boolean} value
     *   true in case the script can be included more than once otherwise false.
     * @returns {boolean}
     *   the current once flag
     */
    once(value) {
      return this.getSieve().enable("once", value);
    }

    /**
     * Optional indicates if it is an error in case the script
     * can not be included.
     *
     * @param {boolean} value
     *   true makes the action fail silently. False will raise an error.
     * @returns {boolean}
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
     * @param {boolean} value
     *   true to enable a personal script, false for a global script.
     * @returns {boolean}
     *   the current personal flag.
     */
    personal(value) {

      const elm = this.getSieve().getElement("location");

      if (value === true)
        elm.setElement(":personal");

      if (value === false)
        elm.setElement(":global");

      return (elm.getElement().nodeName() === "tag/location-type/personal");
    }

    /**
     * Gets and sets the script location.
     *
     * @param {string} [value]
     *   the script location to set
     * @returns {string}
     *   the current script location.
     */
    script(value) {

      const elm = this.getSieve().getElement("script");

      if (value !== null && typeof (value) !== "undefined")
        elm.value(value);

      return elm.value();
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./include/template/SieveIncludeActionUI.html";
    }

    /**
     * @inheritdoc
     */
    onLoad() {
      $('input:radio[name="personal"][value="' + !!this.personal() + '"]').prop('checked', true);

      $('input:checkbox[name="optional"]').prop('checked', !!this.optional());
      $('input:checkbox[name="once"]').prop('checked', !!this.once());

      $("#sivIncludeScriptName").val(this.script());
    }

    /**
     * @inheritdoc
     */
    onSave() {

      const script = $("#sivIncludeScriptName");

      if (!script.get(DOM_ELEMENT).checkValidity()) {
        return false;
      }

      this.script(script.val());

      this.personal($("input[type='radio'][name='personal']:checked").val() === "true");
      this.optional(($("input:checkbox[name='optional']:checked").length > 0));
      this.once(($("input:checkbox[name='once']:checked").length > 0));

      return true;
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const str =
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
