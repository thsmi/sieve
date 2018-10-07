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
  /* global SieveTestDialogBoxUI */

  /* global SieveRadioGroupWidget */
  /* global SieveRadioGroupItemWidget */

  /* global SieveDesigner */

  /**
   * Provides a widget for the unique tags
   */
  class SieveUniqueWidget extends SieveRadioGroupWidget {

    /**
     * @inheritDoc
     */
    constructor(selector) {
      super("test/duplicate/unique/", selector);
    }
  }

  /**
   * An abstract unique UI implementation.
   */
  class SieveAbstractUniqueUI extends SieveRadioGroupItemWidget {

    /**
     * @inheritDoc
     */
    static nodeType() {
      return "test/duplicate/unique/";
    }

    /**
     * @inheritDoc
     */
    getName() {
      return "sieve-unique";
    }

    /**
     * @inheritDoc
     */
    onSave(sivElement) {

      // We prime the content type with a fake element.
      // This makes updating the strings easier.
      //
      // But we skip if the lement is already primed.

      if (!sivElement._element.current || sivElement._element.current.nodeName() !== this.constructor.nodeName()) {
        sivElement.setValue(
          "" + this.getRadioItem().find("input[name='" + this.getName() + "']").val() + ' ""');
      }

    }
  }

  /**
   * Provides a UI for the unique id tag.
   */
  class SieveUniqueIdUI extends SieveAbstractUniqueUI {

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "test/duplicate/unique/id";
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./duplicate/templates/SieveUniqueId.html";
    }

    /**
     * @inheritDoc
     */
    load(sivElement) {
      $("#sivUniqueIdName").val("");

      super.load(sivElement);
    }


    /**
     * @inheritDoc
     */
    onLoad(sivElement) {

      super.onLoad(sivElement);

      $("#sivUniqueIdName").val(
        sivElement._element.current.getElement("uniqueid").value());
    }


    /**
     * @inheritDoc
     */
    onSave(sivElement) {

      super.onSave(sivElement);

      sivElement._element.current.getElement("uniqueid").value(
        $("#sivUniqueIdName").val());
    }
  }

  /**
   * Provides a UI for the uniue header tag.
   */
  class SieveUniqueHeaderUI extends SieveAbstractUniqueUI {

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "test/duplicate/unique/header";
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./duplicate/templates/SieveUniqueHeader.html";
    }

    /**
     * @inheritDoc
     */
    load(sivElement) {
      $("#sivUniqueHeaderName").val("");

      super.load(sivElement);
    }


    /**
     * @inheritDoc
     */
    onLoad(sivElement) {

      super.onLoad(sivElement);

      if (sivElement.isDefaultValue()) {
        $("#sivUniqueHeaderName").val(
          sivElement._element.default.getElement("header").value());

        return;
      }

      $("#sivUniqueHeaderName").val(
        sivElement._element.current.getElement("header").value());
    }


    /**
     * @inheritDoc
     */
    onSave(sivElement) {

      let value = $("#sivUniqueHeaderName").val();

      if (sivElement.isDefaultValue()) {

        let defaultValue = sivElement._element.default.getElement("header").value();

        if ( value === defaultValue)
          return;
      }

      super.onSave(sivElement);

      sivElement._element.current.getElement("header").value(value);
    }

  }


  /**
   * Implements a control for editing a duplicate test
   *
   * @constructor
   * @param {Object} elm - The sieve element which should be rendered.
   */
  class SieveDuplicateUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveAbstractElement}
     *   the element's unique field
     */
    unique() {
      return this.getSieve().getElement("unique");
    }

    /**
     * Checks and changes a tag's enabled state.
     *
     * @param {String} id
     *   the tag's id
     * @param {Boolean} [status]
     *   optional parameter to change the tags state
     *
     * @returns {Boolean}
     *   true in case the element is enabled otherwise false
     */
    enable(id, status) {
      return this.getSieve().enable(id, status);
    }

    /**
     * Checks if the given tag exists.
     * It is used to detect if tags a set.
     *
     * @param {String} id
     *   the tag's  id
     *
     * @returns {Boolean}
     *   true in case the tag existed during parsing otherwise false.
     */
    isEnabled(id) {
      return this.getSieve().enable(id);
    }

    /**
     * Returns a reference to the handle tag.
     * It is guaranteed to exist. But it may be disabled
     *
     * @returns {SieveAbstractElement}
     *   the handle tag.
     */
    handle() {
      return this.getSieve().getElement("handle").getElement("handle");
    }

    /**
     * Returns a reference to the seconds tag.
     * It is guaranteed to exist. But it may be disabled
     *
     * @returns {SieveAbstractElement}
     *   the seconds tag
     */
    seconds() {
      return this.getSieve().getElement("seconds").getElement("timeout");
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      (new SieveUniqueWidget("#sivUnique"))
        .init(this.unique());

      $('input:radio[name="sieve-duplicate-handle"][value="' + this.enable("handle") + '"]').attr("checked", "checked");
      $('input:radio[name="sieve-duplicate-seconds"][value="' + this.enable("seconds") + '"]').attr("checked", "checked");
      $('input:radio[name="sieve-duplicate-last"][value="' + this.enable("last") + '"]').attr("checked", "checked");


      $("#sivDuplicateHandle").focus(function () { $('input:radio[name="sieve-duplicate-handle"][value="true"]').attr("checked", "checked"); });
      $("#sivDuplicateSeconds").focus(function () { $('input:radio[name="sieve-duplicate-seconds"][value="true"]').attr("checked", "checked"); });

      if (this.isEnabled("handle"))
        $("#sivDuplicateHandle").val(this.handle().value());

      if (this.isEnabled("seconds"))
        $("#sivDuplicateSeconds").val(this.seconds().getValue());

    }

    /**
     * @inheritDoc
     */
    onSave() {

      (new SieveUniqueWidget("#sivUnique"))
        .save(this.unique());

      let state = {};
      state["handle"] = ($("input[type='radio'][name='sieve-duplicate-handle']:checked").val() === "true");
      state["seconds"] = ($("input[type='radio'][name='sieve-duplicate-seconds']:checked").val() === "true");
      state["last"] = ($("input[type='radio'][name='sieve-duplicate-last']:checked").val() === "true");

      try {
        if (state["handle"])
          this.handle().value($("#sivDuplicateHandle").val());

        if (state["seconds"])
          this.seconds().setValue($("#sivDuplicateSeconds").val());
      }
      catch (ex) {
        alert(ex);
        return false;
      }

      this.enable("handle", state["handle"]);
      this.enable("seconds", state["seconds"]);
      this.enable("last", state["last"]);

      return true;
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./duplicate/templates/SieveDuplicateTestUI.html";
    }

    /**
     * @inheritDoc
     */
    getSummary() {

      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html(" duplicate ");
    }
  }


  // ************************************************************************************

  if (!SieveDesigner)
    throw new Error("Could not register Duplicate Extension");

  SieveDesigner.register2(SieveUniqueIdUI);
  SieveDesigner.register2(SieveUniqueHeaderUI);

  SieveDesigner.register("test/duplicate", SieveDuplicateUI);

})(window);
