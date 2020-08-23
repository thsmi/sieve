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

import "./../logic/SieveInclude.mjs";

import { SieveDesigner } from "./../../../toolkit/SieveDesigner.mjs";

import { SieveActionDialogBoxUI } from "./../../../toolkit/widgets/Boxes.mjs";

import { SieveStringListWidget } from "./../../../toolkit/widgets/Widgets.mjs";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.mjs";
import { SieveI18n } from "../../../toolkit/utils/SieveI18n.mjs";

/**
 * Provides an UI for the Return Action
 */
class SieveReturnUI extends SieveActionDialogBoxUI {

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/include/template/SieveReturnActionUI.html";
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const msg = SieveI18n.getInstance().getString("return.summary");
    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    return elm;
  }
}

/**
 * Provides an UI for the global action
 */
class SieveGlobalActionUI extends SieveActionDialogBoxUI {

  /**
   * The variables which are exported into the global namespace.
   *
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
    return "./extensions/include/template/SieveGlobalActionUI.html";
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

    const msg = SieveI18n.getInstance().getString("global.summary")
      .replace("${variables}", '<em class="sivGlobalVariables"></em>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    elm.querySelector(".sivGlobalVariables").textContent
      = this.variables().values();
    return elm;
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
    return "./extensions/include/template/SieveIncludeActionUI.html";
  }

  /**
   * @inheritdoc
   */
  onLoad() {

    if (this.personal())
      document.querySelector("#sivIncludePersonal").checked = true;
    else
      document.querySelector("#sivIncludeGlobal").checked = true;

    document.querySelector('#sivIncludeOptional').checked = !!this.optional();
    document.querySelector('#sivIncludeOnce').checked = !!this.once();

    document.querySelector("#sivIncludeScriptName").value = this.script();
  }

  /**
   * @inheritdoc
   */
  onSave() {

    const script = document.querySelector("#sivIncludeScriptName");

    if (!script.checkValidity())
      return false;

    this.script(script.value);

    this.personal(document.querySelector("#sivIncludePersonal").checked);
    this.optional(document.querySelector('#sivIncludeOptional').checked);
    this.once(document.querySelector('#sivIncludeOnce').checked);

    return true;
  }

  /**
   * @inheritdoc
   */
  getSummary() {

    const entity = `include.summary.${!this.personal() ? "global" : "personal"}`;

    const msg = SieveI18n.getInstance().getString(entity)
      .replace("${script}", '<em class="sivIncludeScript"></em>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    elm.querySelector(".sivIncludeScript").textContent = this.script();
    return elm;
  }
}

SieveDesigner.register("action/return", SieveReturnUI);
SieveDesigner.register("action/global", SieveGlobalActionUI);
SieveDesigner.register("action/include", SieveIncludeActionUI);
