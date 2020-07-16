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
import { SieveOverlayItemWidget } from "./../../../toolkit/widgets/Widgets.js";

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

    document.querySelector("#txtVacationIntervalSeconds").addEventListener("focus", () => {
      document.querySelector('#cbxVacationIntervalSeconds').checked = true;
    });

    const elm = sivElement.getElement("interval");

    if (!elm.isNode(this.constructor.nodeName()))
      return;

    document.querySelector("#cbxVacationIntervalSeconds").checked = true;
    // FIXME: we ignore the unit here., instead we should use a numeric control
    document.querySelector("#txtVacationIntervalSeconds").value = elm.getElement("seconds").getValue();
  }

  /**
   * @inheritdoc
   */
  save(sivElement) {

    if (!document.querySelector("#cbxVacationIntervalSeconds").checked)
      return;

    const seconds = document.querySelector("#txtVacationIntervalSeconds").value;

    sivElement.getElement("interval").setElement(`:seconds ${seconds}`);
  }

}

SieveDesigner.register2(SieveVacationIntervalSeconds);
