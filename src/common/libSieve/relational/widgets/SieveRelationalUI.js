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

(function() {

  "use strict";

  /* global SieveDesigner */
  /* global SieveAbstractMatchTypeUI */

  /**
   * Provides an UI for the Sieve Count Match Type
   */
  class SieveCountMatchUI extends SieveAbstractMatchTypeUI {

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "match-type/count";
    }

    /**
     * @inheritDoc
     */
    static isCapable(capabilities) {
      if (!capabilities.relational)
        return false;

      return true;
    }

    /**
     * @inheritDoc
     */
    onLoad(sivElement, item) {
      super.onLoad(sivElement, item);

      item.find(".sieve-matchtype-count-relational").val(
        ":count " + sivElement._element.current.getElement("relational-match").operator);
    }

    /**
     * @inheritDoc
     */
    onSave(sivElement, item) {
      sivElement.setValue(
        item.find(".sieve-matchtype-count-relational").val());
    }


    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./relational/templates/SieveMatchTypeCountUI.html";
    }

  }

  /**
   * Provides a UI for the value match type
   */
  class SieveValueMatchUI extends SieveAbstractMatchTypeUI {

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "match-type/value";
    }

    /**
     * @inheritDoc
     */
    static isCapable(capabilities) {
      if (!capabilities.relational)
        return false;

      return true;
    }

    /**
     * @inheritDoc
     */
    onLoad(sivElement, item) {
      super.onLoad(sivElement, item);

      item.find(".sieve-matchtype-value-relational").val(
        ":value " + sivElement._element.current.getElement("relational-match").operator);
    }

    /**
     * @inheritDoc
     */
    onSave(sivElement, item) {
      sivElement.setValue(
        item.find(".sieve-matchtype-value-relational").val());
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./relational/templates/SieveMatchTypeValueUI.html";
    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register String Widgets");

  SieveDesigner.register2(SieveValueMatchUI);
  SieveDesigner.register2(SieveCountMatchUI);

})(window);
