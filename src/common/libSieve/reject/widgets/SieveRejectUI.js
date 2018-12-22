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

(function () {

  "use strict";

  /* global $: false */
  /* global SieveActionDialogBoxUI */
  /* global SieveDesigner */

  const MAX_QUOTE_LEN = 240;

  /**
   * Provides a UI for the reject action
   */
  class SieveRejectActionUI extends SieveActionDialogBoxUI {

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./reject/templates/SieveRejectActionUI.html";
    }

    /**
     *  Gets and/or Sets the reason why the mail should be rejected
     *
     *  @param  {string} [reason]
     *    optional the new reason which should be set.
     *
     *  @returns {string} the current reason
     */
    reason(reason) {

      return this.getSieve().getElement("reason").value(reason);
    }

    /**
     * @inheritdoc
     */
    onSave() {
      this.reason($("#sivRejectReason").val());

      return true;
    }

    /**
     * @inheritdoc
     */
    onLoad() {
      $("#sivRejectReason").val(this.reason());
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .html("Reject incoming messages and reply the following reason:" +
          "<div>" +
          $('<em/>').text(this.reason().substr(0, MAX_QUOTE_LEN)).html() +
          ((this.reason().length > MAX_QUOTE_LEN) ? "..." : "") +
          "</div>");
    }
  }

  /**
   * Provides an UI for the extended reject action.
   * The extended reject replaces reject and has the same syntax.
   */
  class SieveExtendedRejectActionUI extends SieveRejectActionUI {

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./reject/templates/SieveExtendedRejectActionUI.html";
    }

  }

  if (!SieveDesigner)
    throw new Error("Could not register Reject Widgets");


  SieveDesigner.register("action/reject", SieveRejectActionUI);
  SieveDesigner.register("action/ereject", SieveExtendedRejectActionUI);

})(window);
