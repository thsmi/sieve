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

(function () {

  "use strict";

  /* global $: false */
  /* global SieveOverlayItemWidget */
  /* global SieveDesigner */

  /**
   * Implements the create overlay for the fileinto action.
   */
  class SieveVacationIntervalSeconds extends SieveOverlayItemWidget {

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "action/vacation/interval/";
    }
    /**
     * @inheritdoc
     */
    static nodeName() {
      return "action/vacation/interval/seconds";
    }

    /**
     * @inheritdoc
     */
    static isCapable(capabilities) {
      return capabilities.hasCapability("vacation-seconds");
    }

    /**
     * @inheritdoc
     **/
    getTemplate() {
      return "./vacation-seconds/template/SieveVacationIntervalSecondsUI.html";
    }

    /**
     * @inheritdoc
     */
    load(sivElement) {

      $("#txtVacationIntervalSeconds").focus(() => { $('#cbxVacationIntervalSeconds').prop('checked', true); });

      let elm = sivElement.getElement("interval");

      if (!elm.isNode(this.constructor.nodeName()))
        return;

      $("#cbxVacationIntervalSeconds").prop("checked", true);
      // FIXME: we ignore the unit here., instead we should use a numeric control
      $("#txtVacationIntervalSeconds").val(elm.getElement("seconds").getValue());
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {

      if (!$("#cbxVacationIntervalSeconds").prop("checked"))
        return;

      sivElement.getElement("interval").setElement(
        ":seconds " + $("#txtVacationIntervalSeconds").val());
    }

  }

  if (!SieveDesigner)
    throw new Error("Could not register Vacation Extension");

  SieveDesigner.register2(SieveVacationIntervalSeconds);

})(window);
