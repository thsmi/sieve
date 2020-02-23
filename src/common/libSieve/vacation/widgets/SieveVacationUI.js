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

  const MAX_QUOTE_LEN = 240;

  /**
   * Provides an UI for the vacation action
   */
  class SieveVacationUI extends SieveActionDialogBoxUI {

    reason() {
      return this.getSieve().getElement("reason");
    }

    subject() {
      return this.getSieve().getElement("subject").getElement("subject");
    }

    from() {
      return this.getSieve().getElement("from").getElement("from");
    }

    handle() {
      return this.getSieve().getElement("handle").getElement("handle");
    }

    addresses() {
      return this.getSieve().getElement("addresses").getElement("addresses");
    }


    enable(id, status) {
      return this.getSieve().enable(id, status);
    }


    onEnvelopeChanged() {

      const addresses = (new SieveStringListWidget("#sivAddresses")).items();
      let text = "";

      addresses.each(function () {
        text += (text.length ? ", " : "") + $(this).val();
      });

      $('#vacationAddressesDesc').text(text);

      if (text.length)
        $('#vacationAddressesDesc').parent().show();
      else
        $('#vacationAddressesDesc').parent().hide();

      // Update the From Field
      if ($("input[type='radio'][name='from']:checked").val() === "true")
        $('#vacationFromDesc').text($("#sivVacationFrom").val());
      else
        $('#vacationFromDesc').text("Address of the sieve script owner");

      if ($("input[type='radio'][name='subject']:checked").val() === "true")
        $('#vacationSubjectDesc').text($("#sivVacationSubject").val());
      else
        $('#vacationSubjectDesc').text("Server's default Subject");

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

      $("#vacationEnvelopeEdit").click(() => {
        $('a[data-toggle="tab"][href="#sieve-widget-envelope"]')
          .tab('show');
      });

      $('input:radio[name="subject"][value="' + this.enable("subject") + '"]').prop('checked', true);
      $('input:radio[name="from"][value="' + this.enable("from") + '"]').prop('checked', true);
      $('input:radio[name="addresses"][value="' + this.enable("addresses") + '"]').prop('checked', true);
      $('input:radio[name="mime"][value="' + this.enable("mime") + '"]').prop('checked', true);
      $('input:radio[name="handle"][value="' + this.enable("handle") + '"]').prop('checked', true);

      // In case the user focuses into a textfield the radio button should be changed...
      $("#sivVacationFrom").focus(function () { $('input:radio[name="from"][value="true"]').prop('checked', true); });
      $("#sivVacationSubject").focus(function () { $('input:radio[name="subject"][value="true"]').prop('checked', true); });
      $("#sivVacationHandle").focus(function () { $('input:radio[name="handle"][value="true"]').prop('checked', true); });

      $("#sivVacationReason").val(this.reason().value());


      if (this.enable("subject"))
        $("#sivVacationSubject").val(this.subject().value());

      if (this.enable("from"))
        $("#sivVacationFrom").val(this.from().value());

      if (this.enable("handle"))
        $("#sivVacationHandle").val(this.handle().value());


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
        if (state["from"] && (!$("#sivVacationFrom")[0].checkValidity()))
          throw new Error("From contains an invalid mail address");

        if (state["subject"])
          this.subject().value($("#sivVacationSubject").val());


        (new SieveOverlayWidget("action/vacation/interval/", "#sivVacationIntervalOverlay"))
          .save(this.getSieve());

        if (state["from"])
          this.from().value($("#sivVacationFrom").val());

        if (state["handle"])
          this.handle().value($("#sivVacationHandle").val());

        if (state["addresses"])
          this.addresses().values(addresses);

        this.reason().value($("#sivVacationReason").val());
      }
      catch (ex) {
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
      return $("<div/>")
        .append($("<div/>")
          .text("Send a vacation/an out of office message:"))
        .append($("<div/>")
          .append($('<em/>')
            .text(this.reason().quote(MAX_QUOTE_LEN))));
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

      $("#txtVacationIntervalDays").focus(() => { $('#cbxVacationIntervalDays').prop('checked', true); });

      const elm = sivElement.getElement("interval");

      if (!elm.isNode(this.constructor.nodeName()))
        return;

      $("#cbxVacationIntervalDays").prop("checked", true);
      // FIXME: we ignore the unit here. Instead we should use a numeric control
      $("#txtVacationIntervalDays").val(elm.getElement("days").getValue());
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {

      if (!$("#cbxVacationIntervalDays").prop("checked"))
        return;

      sivElement.getElement("interval").setElement(
        ":days " + $("#txtVacationIntervalDays").val());
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

      $("#cbxVacationIntervalDefault").prop("checked", true);
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {
      if (!$("#cbxVacationIntervalDefault").prop("checked"))
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
