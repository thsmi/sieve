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

  /* global SieveOverlayWidget */
  /* global SieveOverlayItemWidget */

  /* global SieveDesigner */

  /**
   * An abstract unique UI implementation.
   */
  class SieveAbstractUniqueUI extends SieveOverlayItemWidget {

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "test/duplicate/unique/";
    }
  }

  /**
   * Provides a UI for the unique id tag.
   */
  class SieveUniqueDefaultUI extends SieveAbstractUniqueUI {

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "test/duplicate/unique/default";
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./duplicate/templates/SieveUniqueDefault.html";
    }

    /**
     * @inheritdoc
     */
    load(sivElement) {

      if (sivElement.getElement("unique").hasElement())
        return;

      $("#cbxUniqueDefault").prop("checked", true);
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {
      if (!$("#cbxUniqueDefault").prop("checked"))
        return;

      sivElement.getElement("unique").setElement();
    }
  }

  /**
   * Provides a UI for the unique id tag.
   */
  class SieveUniqueIdUI extends SieveAbstractUniqueUI {

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "test/duplicate/unique/id";
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./duplicate/templates/SieveUniqueId.html";
    }

    /**
     * @inheritdoc
     */
    load(sivElement) {

      $("#txtUniqueId").focus(() => { $('#cbxUniqueId').prop('checked', true); });
      $("#txtUniqueId").val("");

      let elm = sivElement.getElement("unique");

      if (!elm.isNode(this.constructor.nodeName()))
        return;

      $("#cbxUniqueId").prop("checked", true);
      $("#txtUniqueId").val(elm.getElement("uniqueid").value());
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {

      if (!$("#cbxUniqueId").prop("checked"))
        return;

      let elm = sivElement.getElement("unique");

      if (!elm.isNode(this.constructor.nodeName())) {
        elm.setElement(':uniqueid ""');
      }

      elm.getElement("uniqueid").value($("#txtUniqueId").val());
    }
  }

  /**
   * Provides a UI for the uniue header tag.
   */
  class SieveUniqueHeaderUI extends SieveAbstractUniqueUI {

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "test/duplicate/unique/header";
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./duplicate/templates/SieveUniqueHeader.html";
    }

    /**
     * @inheritdoc
     */
    load(sivElement) {

      $("#txtUniqueHeader").focus(() => { $('#cbxUniqueHeader').prop('checked', true); });
      $("#txtUniqueHeader").val("");

      let elm = sivElement.getElement("unique");

      if (!elm.isNode(this.constructor.nodeName()))
        return;

      $("#cbxUniqueHeader").prop("checked", true);
      $("#txtUniqueHeader").val(elm.getElement("header").value());
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {

      if (!$("#cbxUniqueHeader").prop("checked"))
        return;

      let elm = sivElement.getElement("unique");

      if (!elm.isNode(this.constructor.nodeName())) {
        elm.setElement(':header ""');
      }

      elm.getElement("header")
        .value($("#txtUniqueHeader").val());
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
     * @param {string} id
     *   the tag's id
     * @param {boolean} [status]
     *   optional parameter to change the tags state
     *
     * @returns {boolean}
     *   true in case the element is enabled otherwise false
     */
    enable(id, status) {
      return this.getSieve().enable(id, status);
    }

    /**
     * Checks if the given tag exists.
     * It is used to detect if tags a set.
     *
     * @param {string} id
     *   the tag's  id
     *
     * @returns {boolean}
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
     * @inheritdoc
     */
    onLoad() {
      (new SieveOverlayWidget("test/duplicate/unique/", "#sivUnique"))
        .init(this.getSieve());

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
     * @inheritdoc
     */
    onSave() {

      (new SieveOverlayWidget("test/duplicate/unique/", "#sivUnique"))
        .save(this.getSieve());

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
     * @inheritdoc
     */
    getTemplate() {
      return "./duplicate/templates/SieveDuplicateTestUI.html";
    }

    /**
     * @inheritdoc
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

  SieveDesigner.register2(SieveUniqueDefaultUI);
  SieveDesigner.register2(SieveUniqueIdUI);
  SieveDesigner.register2(SieveUniqueHeaderUI);

  SieveDesigner.register("test/duplicate", SieveDuplicateUI);

})(window);
