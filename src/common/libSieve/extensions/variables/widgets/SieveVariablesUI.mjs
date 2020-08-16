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

import {
  SieveTestDialogBoxUI,
  SieveActionDialogBoxUI
} from "./../../../toolkit/widgets/Boxes.mjs";

import {
  SieveStringListWidget,
  SieveOverlayWidget,
  SieveOverlayItemWidget
} from "./../../../toolkit/widgets/Widgets.mjs";

import { SieveMatchTypeWidget } from "./../../../extensions/RFC5228/widgets/SieveMatchTypesUI.mjs";
import { SieveComparatorWidget } from "./../../../extensions/RFC5228/widgets/SieveComparatorsUI.mjs";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.js";
import { SieveI18n } from "../../../toolkit/utils/SieveI18n.js";

const MAX_QUOTE_LEN = 240;

/**
 * Provides a ui for the set action
 */
class SieveSetActionUI extends SieveActionDialogBoxUI {

  /**
   * The variable's name
   *
   * @returns {SieveString}
   *   the element's name
   */
  name() {
    return this.getSieve().getElement("name");
  }

  /**
   * The variable's value
   *
   * @returns {SieveString}
   *   the element's value
   */
  value() {
    return this.getSieve().getElement("value");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/variables/templates/SieveSetActionUI.html";
  }

  /**
   * @inheritdoc
   */
  onSave() {
    const item = document.querySelector("#sivVariableName");

    if (!item.checkValidity())
      return false;

    this.name().value(item.value);
    this.value().value(document.querySelector("#sivVariableValue").value);

    (new SieveOverlayWidget("modifier/", "#sivModifier"))
      .save(this.getSieve());

    return true;
  }

  /**
   * @inheritdoc
   */
  async onLoad() {

    document.querySelector("#sivVariableName").value = this.name().value();
    document.querySelector("#sivVariableValue").value = this.value().value();

    const widget = (new SieveOverlayWidget("modifier/", "#sivModifier"));
    await widget.init(this.getSieve());

    // Sort the modifiers...
    let modifiers = document.querySelectorAll(`${widget.selector} .sieve-modifier`);
    modifiers = Array.from(modifiers).sort((lhs, rhs) => {
      rhs = rhs.querySelector("input[type='checkbox'][name^='modifier/']").name;
      lhs = lhs.querySelector("input[type='checkbox'][name^='modifier/']").name;

      return rhs.localeCompare(lhs);
    });

    for (const modifier of modifiers)
      document.querySelector(`${widget.selector}`).appendChild(modifier);
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const msg = SieveI18n.getInstance().getString("set.summary")
      .replace("${variable}", '<em class="sivSetVariable"></em>')
      .replace("${value}", '<div><em class="sivSetValue"></em></div>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    elm.querySelector(".sivSetVariable").textContent
      = this.name().value();
    elm.querySelector(".sivSetValue").textContent
      = this.value().quote(MAX_QUOTE_LEN);
    return elm;
  }
}

/**
 * Renders a UI for the :upper and :lower modifiers
 *
 * They are used tom make the whole string upper or lowercase.
 * Their precedence is 40
 */
class SieveModifierCaseWidget extends SieveOverlayItemWidget {

  /**
   * @inheritdoc
   */
  static nodeType() {
    return "modifier/";
  }

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "modifier/40";
  }

  /**
   * @inheritdoc
   **/
  getTemplate() {
    return "./extensions/variables/templates/SieveCaseUI.html";
  }

  /**
   * @inheritdoc
   */
  static isCapable(capabilities) {
    return capabilities.hasCapability("variables");
  }

  /**
   * @inheritdoc
   */
  load(sivElement) {
    document
      .querySelector("#cbxModifier40")
      .addEventListener("change", () => {
        if (document.querySelector("#cbxModifier40").checked)
          document.querySelector("#divModifier40").classList.remove("d-none");
        else
          document.querySelector("#divModifier40").classList.add("d-none");
      });


    if (sivElement.enable("modifier/40")) {

      document
        .querySelector("#cbxModifier40")
        .checked = true;

      const value = sivElement.getElement("modifier/40").toScript();
      document
        .querySelector(`input[type="radio"][name="modifier/40/"][value="${value}"]`)
        .checked = true;
    }

    document
      .querySelector("#cbxModifier40")
      .dispatchEvent(new Event('change'));
  }

  /**
   * @inheritdoc
   */
  save(sivElement) {

    let value = null;
    const status = document.querySelector("#cbxModifier40").checked;
    if (status)
      value = document.querySelector(`input[type="radio"][name='modifier/40/']:checked`).value;

    sivElement.getElement("modifier/40").setElement(value);
    sivElement.enable("modifier/40", status);
  }
}

/**
 * Renders a UI for the :upperfirst and :lowerfirst modifier.
 *
 * The are used to manipulate the first character and have a precedence of 30
 */
class SieveModifierCaseFirstWidget extends SieveOverlayItemWidget {

  /**
   * @inheritdoc
   */
  static nodeType() {
    return "modifier/";
  }

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "modifier/30";
  }

  /**
   * @inheritdoc
   **/
  getTemplate() {
    return "./extensions/variables/templates/SieveCaseFirstUI.html";
  }

  /**
   * @inheritdoc
   */
  static isCapable(capabilities) {
    return capabilities.hasCapability("variables");
  }

  /**
   * @inheritdoc
   */
  load(sivElement) {

    document
      .querySelector("#cbxModifier30")
      .addEventListener("change", () => {
        if (document.querySelector("#cbxModifier30").checked)
          document.querySelector("#divModifier30").classList.remove("d-none");
        else
          document.querySelector("#divModifier30").classList.add("d-none");
      });


    if (sivElement.enable("modifier/30")) {

      document
        .querySelector("#cbxModifier30")
        .checked = true;

      const value = sivElement.getElement("modifier/30").toScript();
      document
        .querySelector(`input[type="radio"][name="modifier/30/"][value="${value}"]`)
        .checked = true;
    }

    document
      .querySelector("#cbxModifier30")
      .dispatchEvent(new Event('change'));
  }

  /**
   * @inheritdoc
   */
  save(sivElement) {

    let value = null;
    const status = document.querySelector("#cbxModifier30").checked;
    if (status)
      value = document.querySelector(`input[type="radio"][name='modifier/30/']:checked`).value;

    sivElement.getElement("modifier/30").setElement(value);
    sivElement.enable("modifier/30", status);
  }
}

/**
 * Renders a ui for the quote wildcard modifier.
 */
class SieveModifierQuoteWildcardWidget extends SieveOverlayItemWidget {

  /**
   * @inheritdoc
   */
  static nodeType() {
    return "modifier/";
  }

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "modifier/20";
  }

  /**
   * @inheritdoc
   **/
  getTemplate() {
    return "./extensions/variables/templates/SieveQuotewildcardUI.html";
  }

  /**
   * @inheritdoc
   */
  static isCapable(capabilities) {
    return capabilities.hasCapability("variables");
  }

  /**
   * @inheritdoc
   */
  load(sivElement) {
    if (sivElement.enable("modifier/20"))
      document.querySelector("#cbxModifier20").checked = true;
  }

  /**
   * @inheritdoc
   */
  save(sivElement) {

    let value = null;
    const status = document.querySelector("#cbxModifier20").checked;
    if (status)
      value = document.querySelector("#cbxModifier20").value;

    sivElement.getElement("modifier/20").setElement(value);
    sivElement.enable("modifier/20", status);
  }
}

/**
 * Renders a UI for the length modifier.
 */
class SieveModifierLengthWidget extends SieveOverlayItemWidget {

  /**
   * @inheritdoc
   */
  static nodeType() {
    return "modifier/";
  }

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "modifier/10";
  }

  /**
   * @inheritdoc
   **/
  getTemplate() {
    return "./extensions/variables/templates/SieveLengthUI.html";
  }

  /**
   * @inheritdoc
   */
  static isCapable(capabilities) {
    return capabilities.hasCapability("variables");
  }

  /**
   * @inheritdoc
   */
  load(sivElement) {
    if (sivElement.enable("modifier/10"))
      document.querySelector("#cbxModifier10").checked = true;
  }

  /**
   * @inheritdoc
   */
  save(sivElement) {

    let value = null;
    const status = document.querySelector("#cbxModifier10").checked;
    if (status)
      value = document.querySelector("#cbxModifier10").value;

    sivElement.getElement("modifier/10").setElement(value);
    sivElement.enable("modifier/10", status);
  }
}



/**
 * Provides a ui for the sieve string test
 * Checks if any of  the source strings matches against any of the keys.
 */
class SieveStringTestUI extends SieveTestDialogBoxUI {

  /**
   * The keys against which the source strings should be checked.
   *
   * @returns {SieveStringList}
   *   the element's keys
   */
  keys() {
    return this.getSieve().getElement("keys");
  }

  /**
   * The source strings which should be compared against the keys.
   *
   * @returns {SieveStringList}
   *   the element's sources
   */
  sources() {
    return this.getSieve().getElement("sources");
  }

  /**
   * Gets a reference to the active match-type
   *
   * @returns {SieveAbstractElement}
   *   the element's matchtype
   */
  matchtype() {
    return this.getSieve().getElement("match-type");
  }

  /**
   * Gets a reference to the active comparator.
   *
   * @returns {SieveAbstractElement}
   *   the element's comparator
   */
  comparator() {
    return this.getSieve().getElement("comparator");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/variables/templates/SieveStringTestUI.html";
  }

  /**
   * @inheritdoc
   */
  onSave() {

    (new SieveStringListWidget("#sivVariablesSourceList"))
      .save(this.sources());
    (new SieveStringListWidget("#sivVariablesKeyList"))
      .save(this.keys());

    (new SieveMatchTypeWidget("#sivVariablesMatchTypes"))
      .save(this.matchtype());
    (new SieveComparatorWidget("#sivVariablesComparator"))
      .save(this.comparator());

    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {

    (new SieveStringListWidget("#sivVariablesSourceList"))
      .init(this.sources());
    (new SieveStringListWidget("#sivVariablesKeyList"))
      .init(this.keys());

    (new SieveMatchTypeWidget("#sivVariablesMatchTypes"))
      .init(this.matchtype());
    (new SieveComparatorWidget("#sivVariablesComparator"))
      .init(this.comparator());
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const msg = SieveI18n.getInstance().getString("string.summary")
      .replace("${sources}", '<em class="sivStringSources"></em>')
      .replace("${matchtype}", '<span class="sivStringMatchType"></span>')
      .replace("${value}", '<em class="sivStringValue"></em>>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);

    elm.querySelector(".sivStringSources").textContent
      = this.sources().values();
    elm.querySelector(".sivStringMatchType").textContent
      = this.matchtype().getElement().toScript();
    elm.querySelector(".sivStringValue").textContent
      = this.keys().values();

    return elm;
  }
}

SieveDesigner.register2(SieveModifierLengthWidget);
SieveDesigner.register2(SieveModifierQuoteWildcardWidget);
SieveDesigner.register2(SieveModifierCaseFirstWidget);
SieveDesigner.register2(SieveModifierCaseWidget);

SieveDesigner.register("action/set", SieveSetActionUI);
SieveDesigner.register("test/string", SieveStringTestUI);
