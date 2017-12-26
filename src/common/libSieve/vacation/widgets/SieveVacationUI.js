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

"use strict";

(function (exports) {

  /* global $: false */
  /* global SieveStringListWidget */
  /* global SieveActionDialogBoxUI */
  /* global SieveTabWidget */
  /* global SieveDesigner */

  function SieveVacationUI(elm) {
    SieveActionDialogBoxUI.call(this, elm);
  }

  SieveVacationUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
  SieveVacationUI.prototype.constructor = SieveVacationUI;


  SieveVacationUI.prototype.onEnvelopeChanged
    = function () {
      let addresses = (new SieveStringListWidget("#sivAddresses")).items();
      let text = "";

      addresses.each(function (index) {
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

    };

  SieveVacationUI.prototype.onLoad
    = function () {
      let that = this;

      (new SieveTabWidget()).init();

      $("#vacationEnvelopeEdit").click(function () {
        $("#sivEditMain").hide();
        $("#vacationEnvelopePage").show();
      });

      $("#vacationEnvelopeBack").click(function () {

        that.onEnvelopeChanged();

        $("#sivEditMain").show();
        $("#vacationEnvelopePage").hide();

      });

      let state = this.getSieve().state();

      $('input:radio[name="days"][value="' + !!state["days"] + '"]').prop('checked', true);
      $('input:radio[name="subject"][value="' + !!state["subject"] + '"]').prop('checked', true);
      $('input:radio[name="from"][value="' + !!state["from"] + '"]').prop('checked', true);
      $('input:radio[name="addresses"][value="' + !!state["addresses"] + '"]').prop('checked', true);
      $('input:radio[name="mime"][value="' + !!state["mime"] + '"]').prop('checked', true);
      $('input:radio[name="handle"][value="' + !!state["handle"] + '"]').prop('checked', true);

      // In case the user focuses into a textfield the radio button should be changed...
      $("#sivVacationFrom").focus(function () { $('input:radio[name="from"][value="true"]').prop('checked', true); });
      $("#sivVacationSubject").focus(function () { $('input:radio[name="subject"][value="true"]').prop('checked', true); });
      $("#sivVacationDays").focus(function () { $('input:radio[name="days"][value="true"]').prop('checked', true); });
      $("#sivVacationHandle").focus(function () { $('input:radio[name="handle"][value="true"]').prop('checked', true); });

      $("#sivVacationReason").val(this.getSieve().reason());


      if (state["subject"])
        $("#sivVacationSubject").val(this.getSieve().subject());

      if (state["days"])
        $("#sivVacationDays").val(this.getSieve().days());

      if (state["from"])
        $("#sivVacationFrom").val(this.getSieve().from());

      if (state["handle"])
        $("#sivVacationHandle").val(this.getSieve().handle());


      let addresses = (new SieveStringListWidget("#sivAddresses")).init();

      if (state["addresses"])
        addresses.values(this.getSieve().addresses());

      // trigger reloading the envelope fields...
      this.onEnvelopeChanged();
    };

  SieveVacationUI.prototype.onSave
    = function () {

      let state = {};

      // $("#myform input[type='radio']:checked").val();

      // Update the states...
      state["subject"] = ($("input[type='radio'][name='subject']:checked").val() === "true");
      state["days"] = ($("input[type='radio'][name='days']:checked").val() === "true");
      state["from"] = ($("input[type='radio'][name='from']:checked").val() === "true");
      state["mime"] = ($("input[type='radio'][name='mime']:checked").val() === "true");
      state["handle"] = ($("input[type='radio'][name='handle']:checked").val() === "true");


      let addresses = (new SieveStringListWidget("#sivAddresses")).values();
      state["addresses"] = !!addresses.length;

      // TODO Catch exceptions...
      // ... then update the fields...

      let sieve = this.getSieve();

      try {
        if (state["from"] && (!$("#sivVacationFrom")[0].checkValidity()))
          throw new Error("From contains an invalid mail address");


        if (state["subject"])
          sieve.subject($("#sivVacationSubject").val());

        if (state["days"])
          sieve.days($("#sivVacationDays").val());

        if (state["from"])
          sieve.from($("#sivVacationFrom").val());

        if (state["handle"])
          sieve.handle($("#sivVacationHandle").val());

        if (state["addresses"]) {
          sieve.addresses()
            .clear()
            .append(addresses);
        }

        this.getSieve().reason($("#sivVacationReason").val());
      }
      catch (ex) {
        alert(ex);
        return false;
      }

      this.getSieve().state(state);
      return true;
    };

  SieveVacationUI.prototype.getTemplate
    = function () {
      return "./vacation/widgets/SieveVacationUI.html";
    };


  SieveVacationUI.prototype.getSummary
    = function () {
      return $("<div/>")
        .html("Send a vacation/an out of office message:" +
        "<div><em>" +
        $('<div/>').text(this.getSieve().reason().substr(0, 240)).html() +
        ((this.getSieve().reason().length > 240) ? "..." : "") +
        "</em></div>");
    };

  if (!SieveDesigner)
    throw new Error("Could not register Body Extension");

  SieveDesigner.register("action/vacation", SieveVacationUI);

})(window);
