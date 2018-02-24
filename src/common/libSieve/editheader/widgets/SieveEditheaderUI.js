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
  /* global SieveDesigner */
  /* global SieveActionDialogBoxUI */
  /* global SieveTabWidget */

  function SieveAddHeaderUI(elm) {
    SieveActionDialogBoxUI.call(this, elm);
  }

  SieveAddHeaderUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
  SieveAddHeaderUI.prototype.constructor = SieveAddHeaderUI;


  SieveAddHeaderUI.prototype.name
    = function (value) {

      return this.getSieve().getElement("name").value(value);
    };

  SieveAddHeaderUI.prototype.value
    = function (value) {

      return this.getSieve().getElement("value").value(value);
    };

  SieveAddHeaderUI.prototype.enable
    = function (id, status) {
      return this.getSieve().enable(id, status);
    };


  SieveAddHeaderUI.prototype.getTemplate
    = function () {
      return "./editheader/templates/SieveAddHeaderActionUI.html #sivAddHeaderDialog";
    };

  SieveAddHeaderUI.prototype.onSave
    = function () {

      let name = $("#sivNewHeaderName").val();

      if (name.trim() === "") {
        window.alert("Header name is empty");
        return false;
      }

      let value = $("#sivNewHeaderValue").val();

      if (value.trim() === "") {
        window.alert("Header value is empty");
        return false;
      }

      this.name(name);
      this.value(value);

      let last = ($("input[type='radio'][name='last']:checked").val() === "true");

      this.enable("last", last);
      return true;
    };

  SieveAddHeaderUI.prototype.onLoad
    = function () {
      (new SieveTabWidget()).init();
      $("#sivNewHeaderName").val(this.name());
      $("#sivNewHeaderValue").val(this.value());

      $('input:radio[name="last"][value="' + this.enable("last") + '"]').prop('checked', true);
    };

  SieveAddHeaderUI.prototype.getSummary
    = function () {
      return $("<div/>")
        .html("Add a header "
          + $('<em/>').text(this.name()).html()
          + " with a value "
          + $('<em/>').text(this.value()).html());
    };



  function SieveDeleteHeaderUI(elm) {
    SieveActionDialogBoxUI.call(this, elm);
  }

  SieveDeleteHeaderUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
  SieveDeleteHeaderUI.prototype.constructor = SieveDeleteHeaderUI;



  SieveDeleteHeaderUI.prototype.matchtype
    = function () {

      return this.getSieve().getElement("match-type");
    };

  SieveDeleteHeaderUI.prototype.comparator
    = function () {

      return this.getSieve().getElement("comparator");
    };

  SieveDeleteHeaderUI.prototype.getTemplate
    = function () {
      return "./editheader/templates/SieveDeleteHeaderActionUI.html #sivDeleteHeaderDialog";
    };

  SieveDeleteHeaderUI.prototype.onSave
    = function () {

      /* var name = $( "#sivNewHeaderName" ).val();

      if ( name.trim() === "" ) {
          window.alert( "Header name is empty" );
          return false;
      }

      var value = $( "#sivNewHeaderValue" ).val();

      if ( value.trim() === "" ) {
          window.alert( "Header value is empty" );
          return false;
      }

      this.name( name );
      this.value( value );

      var last = ( $( "input[type='radio'][name='last']:checked" ).val() === "true" );

      this.enable( "last", last );*/
      return true;
    };

  SieveDeleteHeaderUI.prototype.onLoad
    = function () {
      (new SieveTabWidget()).init();

      debugger;
      // ( new SieveStringListWidget( "#sivHeaderHeaderList" ) )
      //    .init( this.headers() );
      // .defaults(["Subject","Date","Message-ID","Content-Type"]);

      let matchtype = new SieveMatchTypeUI(this.matchtype());
      $("#sivDeleteHeaderMatchTypes")
        .append(matchtype.html());

      let comparator = new SieveComparatorUI(this.comparator());
      $("#sivDeleteHeaderComparator")
        .append(comparator.html());

      (new SieveStringListWidget("#sivHeaderKeyList"))
        .init(this.keys());

      /* $( "#sivNewHeaderName" ).val( this.name() );
      $( "#sivNewHeaderValue" ).val( this.value() );

      $( 'input:radio[name="last"][value="' + this.enable( "last" ) + '"]' ).prop( 'checked', true );*/
    };

  SieveDeleteHeaderUI.prototype.getSummary
    = function () {
      return $("<div/>")
        .html("Add a header "
          // + $( '<em/>' ).text( this.name() ).html()
          + " with a value "
          // + $( '<em/>' ).text( this.value() ).html()
        );
    };


  if (!SieveDesigner)
    throw new Error("Could not register add header Widgets");

  SieveDesigner.register("action/addheader", SieveAddHeaderUI);
  SieveDesigner.register("action/deleteheader", SieveDeleteHeaderUI);
})(window);
