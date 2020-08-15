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

import { SieveDesigner } from "./../../../toolkit/SieveDesigner.mjs";

import { SieveActionDialogBoxUI } from "./../../../toolkit/widgets/Boxes.mjs";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.js";
import { SieveI18n } from "../../../toolkit/utils/SieveI18n.js";

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
    const msg = SieveI18n.getInstance().getString("reject.summary")
      .replace("${reason}", '<div><em class="sivRejectReason"></em></div>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
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
