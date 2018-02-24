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
  /* global SieveStringListWidget */
  /* global SieveActionDialogBoxUI */
  /* global SieveTabWidget */
  /* global SieveDesigner */

  const MAX_QUOTE_LEN = 240;

  function SieveVacationUI(elm) {
    SieveActionDialogBoxUI.call(this, elm);
  }

  SieveVacationUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
  SieveVacationUI.prototype.constructor = SieveVacationUI;

  SieveVacationUI.prototype.reason
    = function () {
      return this.getSieve().getElement( "reason" );
    };

  SieveVacationUI.prototype.subject
    = function () {
      return this.getSieve().getElement( "subject" ).getElement( "subject" );
    };

  SieveVacationUI.prototype.days
    = function () {
      return this.getSieve().getElement( "days" ).getElement( "days" );
    };

  SieveVacationUI.prototype.from
    = function () {
      return this.getSieve().getElement( "from" ).getElement( "from" );
    };

  SieveVacationUI.prototype.handle
    = function () {
      return this.getSieve().getElement( "handle" ).getElement( "handle" );
    };

  SieveVacationUI.prototype.addresses
    = function () {
      return this.getSieve().getElement( "addresses" ).getElement( "addresses" );
    };


  SieveVacationUI.prototype.enable
    = function ( id, status ) {
      return this.getSieve().enable( id, status );
    };


  SieveVacationUI.prototype.onEnvelopeChanged
    = function () {

      let addresses = (new SieveStringListWidget("#sivAddresses")).items();
      let text = "";

      addresses.each( function ( ) {
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


      $( 'input:radio[name="days"][value="' + this.enable( "days" ) + '"]' ).prop( 'checked', true );
      $( 'input:radio[name="subject"][value="' + this.enable( "subject" ) + '"]' ).prop( 'checked', true );
      $( 'input:radio[name="from"][value="' + this.enable( "from" ) + '"]' ).prop( 'checked', true );
      $( 'input:radio[name="addresses"][value="' + this.enable( "addresses" ) + '"]' ).prop( 'checked', true );
      $( 'input:radio[name="mime"][value="' + this.enable( "mime" ) + '"]' ).prop( 'checked', true );
      $( 'input:radio[name="handle"][value="' + this.enable( "handle" ) + '"]' ).prop( 'checked', true );

      // In case the user focuses into a textfield the radio button should be changed...
      $("#sivVacationFrom").focus(function () { $('input:radio[name="from"][value="true"]').prop('checked', true); });
      $("#sivVacationSubject").focus(function () { $('input:radio[name="subject"][value="true"]').prop('checked', true); });
      $("#sivVacationDays").focus(function () { $('input:radio[name="days"][value="true"]').prop('checked', true); });
      $("#sivVacationHandle").focus(function () { $('input:radio[name="handle"][value="true"]').prop('checked', true); });

      $( "#sivVacationReason" ).val( this.reason().value() );


      if ( this.enable( "subject" ) )
        $( "#sivVacationSubject" ).val( this.subject().value() );

      if ( this.enable( "days" ) )
        $( "#sivVacationDays" ).val( this.days().value() );

      if ( this.enable( "from" ) )
        $( "#sivVacationFrom" ).val( this.from().value() );

      if ( this.enable( "handle" ) )
        $( "#sivVacationHandle" ).val( this.handle().value() );


      let addresses = ( new SieveStringListWidget( "#sivAddresses" ) )
        .init();

      if ( this.enable( "addresses" ) ) {
        addresses.values( this.addresses().values() );
      }

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

      try {
        if (state["from"] && (!$("#sivVacationFrom")[0].checkValidity()))
          throw new Error("From contains an invalid mail address");

        if (state["subject"])
          this.subject().value( $( "#sivVacationSubject" ).val() );

        if (state["days"])
          this.days().value( $( "#sivVacationDays" ).val() );

        if (state["from"])
          this.from().value( $( "#sivVacationFrom" ).val() );

        if (state["handle"])
          this.handle().value( $( "#sivVacationHandle" ).val() );

        if ( state["addresses"] )
          this.addresses().values( addresses );

        this.reason().value( $( "#sivVacationReason" ).val() );
      }
      catch (ex) {
        alert(ex);
        return false;
      }


      this.enable( "days", state["days"] );
      this.enable( "subject", state["subject"] );
      this.enable( "from", state["from"] );
      this.enable( "addresses", state["addresses"] );
      this.enable( "mime", state["mime"] );
      this.enable( "handle", state["handle"] );

      return true;
    };

  SieveVacationUI.prototype.getTemplate
    = function () {
      return "./vacation/template/SieveVacationUI.html #sivVacationDialog";
    };


  SieveVacationUI.prototype.getSummary
    = function () {
      return $("<div/>")
        .html("Send a vacation/an out of office message:" +
        "<div><em>" +
        $( '<div/>' ).text( this.reason().value().substr( 0, MAX_QUOTE_LEN ) ).html() +
        ( ( this.reason().value().length > MAX_QUOTE_LEN ) ? "..." : "" ) +
        "</em></div>");
    };

  if (!SieveDesigner)
    throw new Error("Could not register Vacation Extension");

  SieveDesigner.register("action/vacation", SieveVacationUI);

})(window);
