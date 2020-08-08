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
import { SieveAbstractMatchTypeUI } from "./../../../extensions/RFC5228/widgets/SieveMatchTypesUI.mjs";

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
    return "./extensions/regex/templates/SieveMatchTypeRegExUI.html";
  }
}

SieveDesigner.register2(SieveRegExMatchUI);
