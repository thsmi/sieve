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
  /* global SieveStringListWidget */
  /* global SieveMatchTypeWidget */
  /* global SieveComparatorWidget */

  /**
   * Provides a UI for th add header action
   */
  class SieveAddHeaderUI extends SieveActionDialogBoxUI {

    name(value) {
      return this.getSieve().getElement("name").value(value);
    }

    value(value) {
      return this.getSieve().getElement("value").value(value);
    }

    enable(id, status) {
      return this.getSieve().enable(id, status);
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./editheader/templates/SieveAddHeaderActionUI.html";
    }

    /**
     * @inheritDoc
     */
    onSave() {

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
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      $("#sivNewHeaderName").val(this.name());
      $("#sivNewHeaderValue").val(this.value());

      $('input:radio[name="last"][value="' + this.enable("last") + '"]').prop('checked', true);
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      return $("<div/>")
        .html("Add a header "
          + $('<em/>').text(this.name()).html()
          + " with a value "
          + $('<em/>').text(this.value()).html());
    }
  }


  /**
   * Provides an UI for thee Delete Header action
   */
  class SieveDeleteHeaderUI extends SieveActionDialogBoxUI {

    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    comparator() {
      return this.getSieve().getElement("comparator");
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./editheader/templates/SieveDeleteHeaderActionUI.html";
    }

    /**
     * @inheritDoc
     */
    onSave() {

      (new SieveMatchTypeWidget("#sivDeleteHeaderMatchTypes"))
        .save(this.matchtype());
      (new SieveComparatorWidget("#sivDeleteHeaderComparator"))
        .save(this.comparator());

      (new SieveStringListWidget("#sivHeaderKeyList"))
        .init(this.save());

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
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      debugger;
      // ( new SieveStringListWidget( "#sivHeaderHeaderList" ) )
      //    .init( this.headers() );
      // .defaults(["Subject","Date","Message-ID","Content-Type"]);

      (new SieveMatchTypeWidget("#sivDeleteHeaderMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivDeleteHeaderComparator"))
        .init(this.comparator());

      (new SieveStringListWidget("#sivHeaderKeyList"))
        .init(this.keys());

      /* $( "#sivNewHeaderName" ).val( this.name() );
      $( "#sivNewHeaderValue" ).val( this.value() );

      $( 'input:radio[name="last"][value="' + this.enable( "last" ) + '"]' ).prop( 'checked', true );*/
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      return $("<div/>")
        .html("Remove a header "
          // + $( '<em/>' ).text( this.name() ).html()
          + " with a value "
          // + $( '<em/>' ).text( this.value() ).html()
        );
    }
  }


  if (!SieveDesigner)
    throw new Error("Could not register add header Widgets");

  SieveDesigner.register("action/addheader", SieveAddHeaderUI);
  SieveDesigner.register("action/deleteheader", SieveDeleteHeaderUI);
})(window);
