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

(function () {

  "use strict";

  /* global SieveAbstractMatchTypeUI */
  /* global SieveDesigner */

  /**
   * Provides an UI for the RegEx match type.
   */
  class SieveRegExMatchUI extends SieveAbstractMatchTypeUI {

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "match-type/regex";
    }

    /**
     * @inheritdoc
     */
    static isCapable(capabilities) {
      return capabilities.hasCapability("regex");
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./regex/templates/SieveMatchTypeRegExUI.html";
    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register Regex Widgets");

  SieveDesigner.register2(SieveRegExMatchUI);

})(window);
