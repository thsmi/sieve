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
import { SieveAbstractAddressPartUI } from "./../../../extensions/RFC5228/widgets/SieveAddressPartUI.mjs";

//   :user "+" :detail "@" :domain
// \----:local-part----/

/**
 * Provides an UI for the user part
 */
class SieveUserPartUI extends SieveAbstractAddressPartUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "address-part/user";
  }

  /**
   * @inheritdoc
   */
  static isCapable(capabilities) {
    return capabilities.hasCapability("subaddress");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/subaddress/templates/SieveAddressPartUser.html";
  }
}

/**
 * Provides and UI for the detail part
 */
class SieveDetailPartUI extends SieveAbstractAddressPartUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "address-part/detail";
  }

  /**
   * @inheritdoc
   */
  static isCapable(capabilities) {
    return capabilities.hasCapability("subaddress");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/subaddress/templates/SieveAddressPartDetail.html";
  }
}

SieveDesigner.register2(SieveUserPartUI);
SieveDesigner.register2(SieveDetailPartUI);
