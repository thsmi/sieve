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

(function (exports) {

  "use strict";

  /* global SieveDesigner */
  /* global SieveDropDownWidget */
  /* global SieveDropDownItemWidget */

  /**
   * Provides a widget for the address part widget
   */
  class SieveAddressPartWidget extends SieveDropDownWidget {

    /**
     * @inheritDoc
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
     * @inheritDoc
     */
    static nodeType() {
      return "address-part/";
    }

    /**
     * @inheritDoc
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
     * @inheritDoc
     */
    static nodeName() {
      return "address-part/all";
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveAddressPartAll.html";
    }
  }


  /**
   * Provides an UI for the domain part
   */
  class SieveDomainPartUI extends SieveAbstractAddressPartUI {

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "address-part/domain";
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveAddressPartDomain.html";
    }
  }


  /**
   * Provides an UI for the local part
   */
  class SieveLocalPartUI extends SieveAbstractAddressPartUI {

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "address-part/local";
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveAddressPartLocal.html";
    }
  }


  // ************************************************************************************

  if (!SieveDesigner)
    throw new Error("Could not register address part Widgets");

  SieveDesigner.register2(SieveAllPartUI);
  SieveDesigner.register2(SieveDomainPartUI);
  SieveDesigner.register2(SieveLocalPartUI);

  exports.SieveAbstractAddressPartUI = SieveAbstractAddressPartUI;
  exports.SieveAddressPartWidget = SieveAddressPartWidget;

})(window);
