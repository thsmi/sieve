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

/* global window */

(function () {

  "use strict";

  /* global SieveDesigner */
  /* global SieveAbstractAddressPartUI */

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
      return "./subaddress/templates/SieveAddressPartUser.html";
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
      return "./subaddress/templates/SieveAddressPartDetail.html";
    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register String Widgets");

  SieveDesigner.register2(SieveUserPartUI);
  SieveDesigner.register2(SieveDetailPartUI);

})(window);
