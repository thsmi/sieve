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

import "./../logic/SieveVacation.mjs";

import { SieveDesigner } from "./../../../toolkit/SieveDesigner.mjs";

import { SieveActionDialogBoxUI } from "./../../../toolkit/widgets/Boxes.mjs";

import {
  SieveStringListWidget,
  SieveOverlayItemWidget,
  SieveOverlayWidget
} from "./../../../toolkit/widgets/Widgets.mjs";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.mjs";
import { SieveI18n } from "../../../toolkit/utils/SieveI18n.mjs";


const MAX_QUOTE_LEN = 240;

/**
 * Provides an UI for the vacation action
 */
class SieveVacationUI extends SieveActionDialogBoxUI {

  /**
   * Gets the reason for the vacation message.
   *
   * @returns {SieveString}
   *   the vacation message.
   */
  reason() {
    return this.getSieve().getElement("reason");
  }

  /**
   * Gets the subject which should be used for the vacation message.
   *
   * @returns {SieveString}
   *   the subject
   */
  subject() {
    return this.getSieve().getElement("subject").getElement("subject");
  }

  /**
   * Gets the address which is used as sender for the vacation messages.
   *
   * @returns {SieveString}
   *   the sender address
   */
  from() {
    return this.getSieve().getElement("from").getElement("from");
  }

  /**
   * Gets the unique handle for the vacation message.
   * Handles are for tracking messages.
   *
   * @returns {SieveString}
   *   the handle
   */
  handle() {
    return this.getSieve().getElement("handle").getElement("handle");
  }

  /**
   * The additional addresses which should trigger a the vacation message.
   *
   * @returns {SieveStringList}
   *   a list with additional addresses
   */
  addresses() {
    return this.getSieve().getElement("addresses").getElement("addresses");
  }

  /**
   * Gets the status of optional elements and optionally enables and disables them.
   * Elements are addressed by their id.
   *
   * @param {string} id
   *   the element id.
   * @param {boolean} [status]
   *   the optional new status. If omitted the status will not be changed.
   * @returns {boolean}
   *   true in case the element is enabled otherwise false.
   */
  enable(id, status) {
    return this.getSieve().enable(id, status);
  }

  /**
   * Called whenever the addresses field changed.
   */
  onAddressChanged() {

    const addresses = (new SieveStringListWidget("#sivAddresses")).items();
    let text = "";

    for (const address of addresses) {
      text += (text.length ? "," : "") + address.value;
    }

    const elm = document.querySelector('#vacationAddressesDesc');
    elm.textContent = text;

    if (text.length) {
      elm.parentElement.classList.add("d-flex");
      elm.parentElement.classList.remove("d-none");
    } else {
      elm.parentElement.classList.remove("d-flex");
      elm.parentElement.classList.add("d-none");
    }
  }

  /**
   * Called whenever the from field changed.
   */
  onFromChanged() {

    const checked = (document.querySelector("input[type='radio'][name='from']:checked").value === "true");

    // Update the From Field
    if (checked) {
      document.querySelector('#vacationFromDesc').textContent
        = document.querySelector("#sivVacationFrom").value;

      document.querySelector('#vacationFromDesc').classList.remove("d-none");
      document.querySelector('#vacationFromDescDefault').classList.add("d-none");
    } else {
      document.querySelector('#vacationFromDesc').classList.add("d-none");
      document.querySelector('#vacationFromDescDefault').classList.remove("d-none");
    }
  }

  /**
   * Called whenever the subject field changed.
   */
  onSubjectChanged() {
    if (document.querySelector("input[type='radio'][name='subject']:checked").value !== "true") {
      document.querySelector('#vacationSubjectDesc').classList.add("d-none");
      document.querySelector('#vacationSubjectDescDefault').classList.remove("d-none");

      return;
    }

    document.querySelector('#vacationSubjectDesc').textContent
      = document.querySelector("#sivVacationSubject").value;

    document.querySelector('#vacationSubjectDesc').classList.remove("d-none");
    document.querySelector('#vacationSubjectDescDefault').classList.add("d-none");
  }

  /**
   * Called when one of the envelope elements are changed.
   */
  onEnvelopeChanged() {

    this.onAddressChanged();
    this.onFromChanged();
    this.onSubjectChanged();
  }

  /**
   * @inheritdoc
   */
  onLoad() {

    (new SieveOverlayWidget("action/vacation/interval/", "#sivVacationIntervalOverlay"))
      .init(this.getSieve());

    document.querySelector('a[data-bs-toggle="tab"][href="#sieve-widget-envelope"]')
      .addEventListener('hide.bs.tab', () => {
        this.onEnvelopeChanged();
      });

    document.querySelector("#vacationEnvelopeEdit").addEventListener("click", () => {
      document
        .querySelector(`a[data-bs-toggle="tab"][href="#sieve-widget-envelope"]`)
        .click();
    });

    document
      .querySelector(`input[type="radio"][name="subject"][value="${this.enable("subject")}"]`).checked = true;
    document
      .querySelector(`input[type="radio"][name="from"][value="${this.enable("from")}"]`).checked = true;
    document
      .querySelector(`input[type="radio"][name="mime"][value="${this.enable("mime")}"]`).checked = true;
    document
      .querySelector(`input[type="radio"][name="handle"][value="${this.enable("handle")}"]`).checked = true;

    // In case the user focuses into a text field the radio button should be changed...
    document.querySelector("#sivVacationFrom").addEventListener("focus", () => {
      document.querySelector('input[type="radio"][name="from"][value="true"]').checked = true;
    });

    document.querySelector("#sivVacationSubject").addEventListener("focus", () => {
      document.querySelector('input[type="radio"][name="subject"][value="true"]').checked = true;
    });

    document.querySelector("#sivVacationHandle").addEventListener("focus", () => {
      document.querySelector('input[type="radio"][name="handle"][value="true"]').checked = true;
    });

    document.querySelector("#sivVacationReason").value = this.reason().value();

    if (this.enable("subject"))
      document.querySelector("#sivVacationSubject").value = this.subject().value();

    if (this.enable("from"))
      document.querySelector("#sivVacationFrom").value = this.from().value();

    if (this.enable("handle"))
      document.querySelector("#sivVacationHandle").value = this.handle().value();


    const addresses = (new SieveStringListWidget("#sivAddresses"))
      .init();

    if (this.enable("addresses")) {
      addresses.values(this.addresses().values());
    }

    // trigger reloading the envelope fields...
    this.onEnvelopeChanged();
  }

  /**
   * @inheritdoc
   */
  onSave() {

    const state = {};

    // Update the states...
    state["subject"] = (document.querySelector("input[type='radio'][name='subject']:checked").value === "true");
    state["from"] = (document.querySelector("input[type='radio'][name='from']:checked").value === "true");
    state["mime"] = (document.querySelector("input[type='radio'][name='mime']:checked").value === "true");
    state["handle"] = (document.querySelector("input[type='radio'][name='handle']:checked").value === "true");

    const addresses = (new SieveStringListWidget("#sivAddresses")).values();
    state["addresses"] = !!addresses.length;

    // TODO Catch exceptions...
    // ... then update the fields...

    // TODO use html validation while typing....
    // ... an djump to tab

    try {
      if (state["from"] && (!document.querySelector("#sivVacationFrom").checkValidity()))
        throw new Error("From contains an invalid mail address");

      if (state["subject"])
        this.subject().value(document.querySelector("#sivVacationSubject").value);


      (new SieveOverlayWidget("action/vacation/interval/", "#sivVacationIntervalOverlay"))
        .save(this.getSieve());

      if (state["from"])
        this.from().value(document.querySelector("#sivVacationFrom").value);

      if (state["handle"])
        this.handle().value(document.querySelector("#sivVacationHandle").value);

      if (state["addresses"])
        this.addresses().values(addresses);

      this.reason().value(document.querySelector("#sivVacationReason").value);

    } catch (ex) {
      alert(ex);
      return false;
    }

    this.enable("subject", state["subject"]);
    this.enable("from", state["from"]);
    this.enable("addresses", state["addresses"]);
    this.enable("mime", state["mime"]);
    this.enable("handle", state["handle"]);

    return true;
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/vacation/template/SieveVacationUI.html";
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const msg = SieveI18n.getInstance().getString("vacation.summary")
      .replace("${reason}", '<div><em class="sivVacationReason"></em></div>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);

    elm.querySelector(".sivVacationReason").textContent
      = this.reason().quote(MAX_QUOTE_LEN);
    return elm;
  }
}

/**
 * Implements the create overlay for the fileinto action.
 */
class SieveVacationIntervalDays extends SieveOverlayItemWidget {

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
    return "action/vacation/interval/days";
  }

  /**
   * @inheritdoc
   */
  static isCapable(capabilities) {
    return capabilities.hasCapability("vacation");
  }

  /**
   * @inheritdoc
   **/
  getTemplate() {
    return "./extensions/vacation/template/SieveVacationIntervalDaysUI.html";
  }

  /**
   * @inheritdoc
   */
  load(sivElement) {

    document.querySelector("#txtVacationIntervalDays").addEventListener("focus", () => {
      document.querySelector('#cbxVacationIntervalDays').checked = true;
    });

    const elm = sivElement.getElement("interval");

    if (!elm.isNode(this.constructor.nodeName()))
      return;

    document.querySelector("#cbxVacationIntervalDays").checked = true;
    // FIXME: we ignore the unit here. Instead we should use a numeric control
    document.querySelector("#txtVacationIntervalDays").value
      = elm.getElement("days").getValue();
  }

  /**
   * @inheritdoc
   */
  save(sivElement) {

    if (!(document.querySelector("#cbxVacationIntervalDays").checked))
      return;

    sivElement.getElement("interval").setElement(
      ":days " + document.querySelector("#txtVacationIntervalDays").value);
  }

}

/**
 * Implements the create overlay for the fileinto action.
 */
class SieveVacationIntervalDefault extends SieveOverlayItemWidget {

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
    return "action/vacation/interval/default";
  }

  /**
   * @inheritdoc
   */
  static isCapable(capabilities) {
    return capabilities.hasCapability("vacation");
  }

  /**
   * @inheritdoc
   **/
  getTemplate() {
    return "./extensions/vacation/template/SieveVacationIntervalDefaultUI.html";
  }

  /**
   * @inheritdoc
   */
  load(sivElement) {

    if (sivElement.getElement("interval").hasElement())
      return;

    document.querySelector("#cbxVacationIntervalDefault").checked = true;
  }

  /**
   * @inheritdoc
   */
  save(sivElement) {
    if (!(document.querySelector("#cbxVacationIntervalDefault").checked))
      return;

    sivElement.getElement("interval").setElement();
  }

}

SieveDesigner.register("action/vacation", SieveVacationUI);

SieveDesigner.register2(SieveVacationIntervalDefault);
SieveDesigner.register2(SieveVacationIntervalDays);
