/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   kaivol <github@kavol.de>
 *
 */

import "./../logic/SievePgpEncrypt.mjs";

import { SieveDesigner } from "./../../../toolkit/SieveDesigner.mjs";

import {
  SieveActionDialogBoxUI
} from "./../../../toolkit/widgets/Boxes.mjs";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.mjs";
import { SieveI18n } from "../../../toolkit/utils/SieveI18n.mjs";

/**
 * Provides an abstract UI for the pgpencrypt action.
 */
class SievePgpEncryptUI extends SieveActionDialogBoxUI {

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/pgpencrypt/templates/SievePgpEncryptActionUI.html";
  }

  /**
   * Gets the currently set key.
   *
   * @returns {string}
   *   the element's key
   */
  keys(key) {
    return this.getSieve().getElement("keys").getElement("keys").value(key);
  }

  /**
   * @inheritdoc
   */
  onSave() {
    const key = document.querySelector("#sivPgpKey").value;
    this.keys(key);
    this.getSieve().enable("keys", key.length > 0);
    // should check if the given key is a valid PGP key
    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    document.querySelector("#sivPgpKey").value = this.keys();
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const msg = SieveI18n.getInstance().getString("pgpencrypt.summary").replace("${address}", `
<pre 
    style="-webkit-line-clamp: 4;
           -webkit-box-orient: vertical;
           display: -webkit-box;
           overflow: hidden;"    
    class="sivPgpKey"
></pre>
`);

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    elm.querySelector(".sivPgpKey").textContent = this.keys();
    return elm;
  }
}

SieveDesigner.register("action/pgpencrypt", SievePgpEncryptUI);
