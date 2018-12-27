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
     * Gets the reason why the mail should be rejected
     *
     * @returns {SieveString} the current reason
     */
    reason() {
      return this.getSieve().getElement("reason");
    }

    /**
     * @inheritdoc
     */
    onSave() {
      this.reason().value($("#sivRejectReason").val());
      return true;
    }

    /**
     * @inheritdoc
     */
    onLoad() {
      $("#sivRejectReason").val(this.reason().value());
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .append($("<div/>")
          .text("Reject incoming messages and reply the following reason:"))
        .append($("<div/>")
          .append($('<em/>')
            .text(this.reason().quote(MAX_QUOTE_LEN))));
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
