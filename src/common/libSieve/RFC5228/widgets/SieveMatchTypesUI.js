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
  /* global SieveAbstractRadioGroupWidget */
  /* global SieveRadioGroupWidget */

  /**
   * Provides a widget for the matchtype element
   */
  class SieveMatchTypeWidget extends SieveRadioGroupWidget{

    /**
     * @inheritDoc
     */
    constructor(selector) {
      super("match-type/", selector);
    }
  }

  /**
   * An Abstract Matchtype UI implementation.
   */
  class SieveAbstractMatchTypeUI extends SieveAbstractRadioGroupWidget {

    /**
     * @inheritDoc
     */
    static nodeType() {
      return "match-type/";
    }

    /**
     * @inheritDoc
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
     * @inheritDoc
     */
    static nodeName() {
      return "match-type/contains";
    }

    /**
     * @inheritDoc
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
     * @inheritDoc
     */
    static nodeName() {
      return "match-type/is";
    }

    /**
     * @inheritDoc
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
     * @inheritDoc
     */
    static nodeName() {
      return "match-type/matches";
    }

    /**
     * @inheritDoc
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
