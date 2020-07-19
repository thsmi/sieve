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
import { SieveAbstractMatchTypeUI } from "./../../../extensions/RFC5228/widgets/SieveMatchTypesUI.js";

/**
 * Provides an UI for the Sieve Count Match Type
 */
class SieveCountMatchUI extends SieveAbstractMatchTypeUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "match-type/count";
  }

  /**
   * @inheritdoc
   */
  static isCapable(capabilities) {
    return capabilities.hasCapability("relational");
  }

  /**
   * @inheritdoc
   */
  onLoad(sivElement) {
    super.onLoad(sivElement);

    this.getActiveItem().querySelector(".sieve-matchtype-count-relational").value =
      ":count " + sivElement.getElement("relational-match").toScript();
  }

  /**
   * @inheritdoc
   */
  onSave(sivElement) {
    sivElement.setElement(
      this.getActiveItem().querySelector(".sieve-matchtype-count-relational").value);
  }


  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/relational/templates/SieveMatchTypeCountUI.html";
  }

}

/**
 * Provides a UI for the value match type
 */
class SieveValueMatchUI extends SieveAbstractMatchTypeUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "match-type/value";
  }

  /**
   * @inheritdoc
   */
  static isCapable(capabilities) {
    return capabilities.hasCapability("relational");
  }

  /**
   * @inheritdoc
   */
  onLoad(sivElement) {

    super.onLoad(sivElement);

    this.getActiveItem().querySelector(".sieve-matchtype-value-relational").value =
      ":value " + sivElement.getElement("relational-match").toScript();
  }

  /**
   * @inheritdoc
   */
  // eslint-disable-next-line no-unused-vars
  onSave(sivElement, item) {
    sivElement.setElement(
      this.getActiveItem().querySelector(".sieve-matchtype-value-relational").value);
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/relational/templates/SieveMatchTypeValueUI.html";
  }
}

SieveDesigner.register2(SieveValueMatchUI);
SieveDesigner.register2(SieveCountMatchUI);
