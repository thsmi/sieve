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

import { SieveStringListWidget } from "./../../../toolkit/widgets/Widgets.js";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.js";

/**
 * Provides an UI for the Return Action
 */
class SieveReturnUI extends SieveActionDialogBoxUI {

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./include/template/SieveReturnActionUI.html";
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const FRAGMENT =
      `<div>
           <div data-i18n="return.summary"></div>
         </div>`;

    return (new SieveTemplate()).convert(FRAGMENT);
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
    const FRAGMENT =
      `<div>
           <span data-i18n="global.summary"></span>
           <em class="sivGlobalVariables"></em>
         </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);
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
    return "./include/template/SieveIncludeActionUI.html";
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

    const FRAGMENT =
      `<div>
           <span data-i18n="include.summary1"></span>
           <span class="sivIncludePersonal" data-i18n="include.summary.personal"></span>
           <span class="sivIncludeGlobal" data-i18n="include.summary.global"></span>
           <span data-i18n="include.summary2"></span>
           <em class="sivIncludeScript"></em>
         </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);

    if (!this.personal())
      elm.querySelector(".sivIncludeGlobal").classList.add("d-none");
    else
      elm.querySelector(".sivIncludePersonal").classList.add("d-none");

    elm.querySelector(".sivIncludeScript").textContent = this.script();
    return elm;
  }
}

SieveDesigner.register("action/return", SieveReturnUI);
SieveDesigner.register("action/global", SieveGlobalActionUI);
SieveDesigner.register("action/include", SieveIncludeActionUI);
