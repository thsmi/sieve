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

import {
  SieveDropDownWidget,
  SieveDropDownItemWidget
} from "./../../../toolkit/widgets/Widgets.js";

/**
 * Provides a widget for the address part widget
 */
class SieveAddressPartWidget extends SieveDropDownWidget {

  /**
   * @inheritdoc
   */
  constructor(selector) {
    super("address-part/", selector);
  }
}

/**
 * An Abstract Address Part UI.
 */
class SieveAbstractAddressPartUI extends SieveDropDownItemWidget {

  /**
   * @inheritdoc
   */
  static nodeType() {
    return "address-part/";
  }

  /**
   * @inheritdoc
   */
  getName() {
    return "sieve-addresspart";
  }
}


/**
 * Provides an UI for the all address part
 */
class SieveAllPartUI extends SieveAbstractAddressPartUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "address-part/all";
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveAddressPartAll.html";
  }
}


/**
 * Provides an UI for the domain part
 */
class SieveDomainPartUI extends SieveAbstractAddressPartUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "address-part/domain";
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveAddressPartDomain.html";
  }
}


/**
 * Provides an UI for the local part
 */
class SieveLocalPartUI extends SieveAbstractAddressPartUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "address-part/local";
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveAddressPartLocal.html";
  }
}

SieveDesigner.register2(SieveAllPartUI);
SieveDesigner.register2(SieveDomainPartUI);
SieveDesigner.register2(SieveLocalPartUI);

export {
  SieveAbstractAddressPartUI,
  SieveAddressPartWidget
};
