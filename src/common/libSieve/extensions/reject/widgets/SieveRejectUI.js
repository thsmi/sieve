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

import { SieveDesigner } from "./../../../toolkit/SieveDesigner.js";

import { SieveActionDialogBoxUI } from "./../../../toolkit/widgets/Boxes.js";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.js";

const MAX_QUOTE_LEN = 240;

/**
 * Provides a UI for the reject action
 */
class SieveRejectActionUI extends SieveActionDialogBoxUI {

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/reject/templates/SieveRejectActionUI.html";
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
    this.reason().value(document.querySelector("#sivRejectReason").value);
    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    document.querySelector("#sivRejectReason").value = this.reason().value();
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const FRAGMENT =
      `<div>
           <div data-i18n="reject.summary"></div>
           <div><em class="sivRejectReason"></em></div>
         </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);
    elm.querySelector(".sivRejectReason").textContent
      = this.reason().quote(MAX_QUOTE_LEN);
    return elm;
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
    return "./extensions/reject/templates/SieveExtendedRejectActionUI.html";
  }

}

SieveDesigner.register("action/reject", SieveRejectActionUI);
SieveDesigner.register("action/ereject", SieveExtendedRejectActionUI);
