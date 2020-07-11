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

(function (exports) {

  "use strict";

  /* global SieveDesigner */
  /* global SieveDropDownItemWidget */
  /* global SieveDropDownWidget */

  /**
   * Provides a widget for the matchtype element
   */
  class SieveMatchTypeWidget extends SieveDropDownWidget {

    /**
     * @inheritdoc
     */
    constructor(selector) {
      super("match-type/", selector);
    }
  }

  /**
   * An Abstract Matchtype UI implementation.
   */
  class SieveAbstractMatchTypeUI extends SieveDropDownItemWidget {

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "match-type/";
    }

    /**
     * @inheritdoc
     */
    getName() {
      return "sieve-matchtype";
    }
  }


  /**
   * Provides an UI for the contains match type
   */
  class SieveContainsMatchUI extends SieveAbstractMatchTypeUI {

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "match-type/contains";
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveMatchTypeContainsUI.html";
    }
  }


  /**
   * Provides a UI for the is match type.
   */
  class SieveIsMatchUI extends SieveAbstractMatchTypeUI {

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "match-type/is";
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveMatchTypeIsUI.html";
    }
  }


  /**
   * Provides a UI for the matches match type
   */
  class SieveMatchesMatchUI extends SieveAbstractMatchTypeUI {

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "match-type/matches";
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveMatchTypeMatchesUI.html";
    }

  }


  if (!SieveDesigner)
    throw new Error("Could not register String Widgets");

  SieveDesigner.register2(SieveIsMatchUI);
  SieveDesigner.register2(SieveContainsMatchUI);
  SieveDesigner.register2(SieveMatchesMatchUI);

  exports.SieveAbstractMatchTypeUI = SieveAbstractMatchTypeUI;
  exports.SieveMatchTypeWidget = SieveMatchTypeWidget;

})(window);
