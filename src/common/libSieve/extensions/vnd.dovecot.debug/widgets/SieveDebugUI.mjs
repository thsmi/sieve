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
import "./../logic/SieveDebug.mjs";

import { SieveDesigner } from "./../../../toolkit/SieveDesigner.mjs";

import {
  SieveActionDialogBoxUI
} from "./../../../toolkit/widgets/Boxes.mjs";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.mjs";
import { SieveI18n } from "../../../toolkit/utils/SieveI18n.mjs";

/**
 * Provides a ui for the debug log action.
 */
class SieveDebugLogUI extends SieveActionDialogBoxUI {

  /**
   * The debug message which should be logged.
   *
   * @returns {SieveString}
   *   the element's message
   */
  message() {
    return this.getSieve().getElement("message");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/vnd.dovecot.debug/templates/SieveDebugLogUI.html";
  }

  /**
   * @inheritdoc
   */
  onSave() {
    this.message().value(document.querySelector("#sivDebugLogMessage").value);
    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    document.querySelector("#sivDebugLogMessage").value = this.message().value();
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const msg = SieveI18n.getInstance().getString("debug_log.summary")
      .replace("${message}", '<em class="sivDebugLogMessage"></em>');

    const elm = (new SieveTemplate()).convertFragment(`<div>${msg}</div>`);
    elm.querySelector(".sivDebugLogMessage").textContent = this.message().value();
    return elm;
  }
}

SieveDesigner.register("action/debug_log", SieveDebugLogUI);
