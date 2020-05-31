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

  /* global $: false */
  /* global SieveStringListWidget */
  /* global SieveActionDialogBoxUI */
  /* global SieveOverlayItemWidget */
  /* global SieveDesigner */
  /* global SieveOverlayWidget */
  /* global SieveTemplate */

  const MAX_QUOTE_LEN = 240;

  /**
   * Provides an UI for the vacation action
   */
  class SieveVacationUI extends SieveActionDialogBoxUI {

    /**
     * @returns
     */
    reason() {
      return this.getSieve().getElement("reason");
    }

    /**
     * @returns
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
     * @returns
     */
    handle() {
      return this.getSieve().getElement("handle").getElement("handle");
    }

    /**
     * @returns
     */
    addresses() {
      return this.getSieve().getElement("addresses").getElement("addresses");
    }

    /**
     *
     * @param {string} id
     * @param {*} status
     */
    enable(id, status) {
      return this.getSieve().enable(id, status);
    }

    /**
     *
     */
    onEnvelopeChanged() {

      const addresses = (new SieveStringListWidget("#sivAddresses")).items();
      let text = "";

      addresses.each(function () {
        text += (text.length ? ", " : "") + $(this).val();
      });

      document.querySelector('#vacationAddressesDesc').textContent = text;

      if (text.length)
        document.querySelector('#vacationAddressesDesc').parentElement.style.display = "";
      else
        document.querySelector('#vacationAddressesDesc').parentElement.style.display = "none";

      // Update the From Field
      if ($("input[type='radio'][name='from']:checked").val() === "true")
        document.querySelector('#vacationFromDesc').textContent = $("#sivVacationFrom").val();
      else
        $('#vacationFromDesc').text("Address of the sieve script owner");

      if ($("input[type='radio'][name='subject']:checked").val() === "true")
        $('#vacationSubjectDesc').text($("#sivVacationSubject").val());
      else
        document.querySelector('#vacationSubjectDesc').textContent = "Server's default Subject";
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      (new SieveOverlayWidget("action/vacation/interval/", "#sivVacationIntervalOverlay"))
        .init(this.getSieve());

      $('a[data-toggle="tab"][href="#sieve-widget-envelope"]').on('hide.bs.tab', () => {
        this.onEnvelopeChanged();
      });

      document.querySelector("#vacationEnvelopeEdit").addEventListener("click", () => {
        $('a[data-toggle="tab"][href="#sieve-widget-envelope"]')
          .tab('show');
      });

      document
        .querySelector(`input[type="radio"][name="subject"][value="${this.enable("subject")}"]`).checked = true;
      document
        .querySelector(`input[type="radio"][name="from"][value="${this.enable("from")}"]`).checked = true;
      document
        .querySelector(`input[type="radio"][name="addresses"][value="${this.enable("addresses")}"]`).checked = true;
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

      // $("#myform input[type='radio']:checked").val();

      // Update the states...
      state["subject"] = ($("input[type='radio'][name='subject']:checked").val() === "true");
      state["from"] = ($("input[type='radio'][name='from']:checked").val() === "true");
      state["mime"] = ($("input[type='radio'][name='mime']:checked").val() === "true");
      state["handle"] = ($("input[type='radio'][name='handle']:checked").val() === "true");

      const addresses = (new SieveStringListWidget("#sivAddresses")).values();
      state["addresses"] = !!addresses.length;

      // TODO Catch exceptions...
      // ... then update the fields...

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
      return "./vacation/template/SieveVacationUI.html";
    }

    /**
     * @inheritdoc
     */
    getSummary() {

      const FRAGMENT =
        `<div>
           <div data-i18n="vacation.summary"></div>
           <div><em class="sivVacationReason"></em></div>
         </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
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
      return "./vacation/template/SieveVacationIntervalDaysUI.html";
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
      document.querySelector("#txtVacationIntervalDays").value = elm.getElement("days").getValue();
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
      return "./vacation/template/SieveVacationIntervalDefaultUI.html";
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

  if (!SieveDesigner)
    throw new Error("Could not register Vacation Extension");

  SieveDesigner.register("action/vacation", SieveVacationUI);

  SieveDesigner.register2(SieveVacationIntervalDefault);
  SieveDesigner.register2(SieveVacationIntervalDays);

})(window);
