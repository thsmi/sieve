/*
 * The contents of this file are licenced. You may obtain a copy of
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
  /* global SieveRadioGroupItemWidget */
  /* global SieveRadioGroupWidget */

  /**
   *
   */
  class SieveComparatorWidget extends SieveRadioGroupWidget {

    /**
     * @inheritDoc
     */
    constructor(selector) {
      super("comparator/", selector);
    }
  }


  /**
   * An Abstract Comparator UI implementation.
   */
  class SieveAbstractComparatorUI extends SieveRadioGroupItemWidget {

    /**
     * @inheritDoc
     */
    static nodeType() {
      return "comparator/";
    }

    /**
     * @inheritDoc
     */
    getName() {
      return "sieve-comparator";
    }
  }

  /**
   * Provides an UI for the contains match type
   */
  class SieveOctetComparatorUI extends SieveAbstractComparatorUI {

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "comparator/i;octet";
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveComparatorOctet.html";
    }
  }

  /**
   * Provides an UI for the contains match type
   */
  class SieveAsciiCasemapComparatorUI extends SieveAbstractComparatorUI {

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "comparator/i;ascii-casemap";
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveComparatorAsciiCasemap.html";
    }
  }


  /**
   * Provides an UI for the contains match type
   */
  class SieveAsciiNumericComparatorUI extends SieveAbstractComparatorUI {

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "comparator/i;ascii-numeric";
    }

    /**
     * @inheritDoc
     */
    static isCapable(capabilities) {
      return capabilities.hasCapability("comparator-i;ascii-numeric");
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveComparatorAsciiNumeric.html";
    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register String Widgets");

  SieveDesigner.register2(SieveOctetComparatorUI);
  SieveDesigner.register2(SieveAsciiCasemapComparatorUI);
  SieveDesigner.register2(SieveAsciiNumericComparatorUI);

  exports.SieveComparatorWidget = SieveComparatorWidget;

})(window);
