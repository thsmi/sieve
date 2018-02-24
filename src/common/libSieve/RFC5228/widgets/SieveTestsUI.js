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

( function (/*exports*/ ) {

  "use strict";

  /* global $: false */
  /* global SieveDesigner */
  /* global SieveStringListUI */
  /* global SieveTestBoxUI */
  /* global SieveTestDialogBoxUI */
  /* global SieveMatchTypeUI */
  /* global SieveAddressPartUI */
  /* global SieveComparatorUI */
  /* global SieveStringListWidget */
  /* global SieveTabWidget */

  //testunary .append() -> testunary in anyof wrapen  SieveTestUI einführen...
  //testmultary.append -> an entsprechender stelle einfügen SieveTestListUI...

  //****************************************************************************//

  function SieveSizeTestUI( elm ) {
    SieveTestBoxUI.call( this, elm );
  }

  SieveSizeTestUI.prototype = Object.create( SieveTestDialogBoxUI.prototype );
  SieveSizeTestUI.prototype.constructor = SieveSizeTestUI;

  SieveSizeTestUI.prototype.onValidate
    = function () {


      return true;
    };

  SieveSizeTestUI.prototype.onSave
    = function () {
      let sieve = this.getSieve();

      sieve
        .isOver( $( "input[type='radio'][name='over']:checked" ).val() === "true" )
        .getSize()
        .value( $( "#sivSizeTestValue" ).val() )
        .unit( $( "#sivSizeTestUnit" ).val() );

      return true;
    };

  SieveSizeTestUI.prototype.getTemplate
    = function () {
      return "./RFC5228/templates/SieveSizeTestUI.html #sivSieveDialog";
    };

  SieveSizeTestUI.prototype.onLoad
    = function () {
      ( new SieveTabWidget() ).init();

      $( 'input:radio[name="over"][value="' + this.getSieve().isOver() + '"]' ).prop( 'checked', true );

      $( "#sivSizeTestValue" ).val( "" + this.getSieve().getSize().value() );
      $( "#sivSizeTestUnit" ).val( "" + this.getSieve().getSize().unit() );

    };

  SieveSizeTestUI.prototype.getSummary
    = function () {
      return $( "<div/>" )
        .text( "message is " + ( this.getSieve().isOver() ? "larger" : "smaller" )
        + " than " + this.getSieve().getSize().toScript() );
    };


  //****************************************************************************//

  function SieveBooleanTestUI( elm ) {
    SieveTestBoxUI.call( this, elm );
  }

  SieveBooleanTestUI.prototype = Object.create( SieveTestBoxUI.prototype );
  SieveBooleanTestUI.prototype.constructor = SieveBooleanTestUI;

  SieveBooleanTestUI.prototype.onValidate
    = function () {

      if ($("#BooleanTestValue" + this.id()).val() === "true")
        this.getSieve().value = true;
      else
        this.getSieve().value = false;

      return true;
    };

  SieveBooleanTestUI.prototype.initEditor
    = function () {
      return $( "<div/>" )
        .append( $( "<span/>" )
          .text( "is" ) )
        .append( $( "<select/>" )
          .attr( "id", "BooleanTestValue" + this.id() )
          .append( $( "<option/>" )
            .text( "true" ).val( "true" ) )
          .append( $( "<option/>" )
            .text( "false" ).val( "false" ) )
          .val( "" + this.getSieve().value ) );
    };

  SieveBooleanTestUI.prototype.initSummary
    = function () {
      return $( "<div/>" )
        .text( "is " + ( this.getSieve().value ) );
    };

  //****************************************************************************//

  function SieveExistsUI( elm ) {
    SieveTestBoxUI.call( this, elm );
  }

  SieveExistsUI.prototype = Object.create( SieveTestBoxUI.prototype );
  SieveExistsUI.prototype.constructor = SieveExistsUI;

  SieveExistsUI.prototype.headers
    = function () {

      return this.getSieve().getElement( "headers" );
    };

  SieveExistsUI.prototype.initEditor
    = function () {
      return $( "<div/>" ).text( "all of the following header exist:" )
        .append(
        ( new SieveStringListUI( this.headers() ) )
          .defaults( ["To", "From", "Cc", "Bcc", "Reply-To", "Subject", "Date", "Message-ID", "Content-Type"] )
          .html() );
    };

  SieveExistsUI.prototype.initSummary
    = function () {
      return $( "<div/>" )
        .html( "the following header(s) exist:"
        + "<em>" + $( '<div/>' ).text( this.headers().toScript() ).html() + "</em>" );
    };

  //****************************************************************************//
  function SieveHeaderUI( elm ) {
    SieveTestDialogBoxUI.call( this, elm );
  }

  SieveHeaderUI.prototype = Object.create( SieveTestDialogBoxUI.prototype );
  SieveHeaderUI.prototype.constructor = SieveHeaderUI;

  SieveHeaderUI.prototype.keys
    = function ( values ) {

      return this.getSieve().getElement( "keys" ).values( values );
    };

  SieveHeaderUI.prototype.headers
    = function ( values ) {

      return this.getSieve().getElement( "headers" ).values( values );
    };

  SieveHeaderUI.prototype.matchtype
    = function () {

      return this.getSieve().getElement( "match-type" );
    };

  SieveHeaderUI.prototype.comparator
    = function () {

      return this.getSieve().getElement( "comparator" );
    };

  SieveHeaderUI.prototype.onSave
    = function () {

      this.keys(( new SieveStringListWidget( "#sivHeaderKeyList" ) ).values() );
      this.headers(( new SieveStringListWidget( "#sivHeaderHeaderList" ) ).values() );

      return true;
    };

  SieveHeaderUI.prototype.getTemplate
    = function () {

      return "./RFC5228/templates/SieveHeaderTestUI.html #sivSieveDialog";
    };

  SieveHeaderUI.prototype.onLoad
    = function () {

      ( new SieveTabWidget() ).init();

      ( new SieveStringListWidget( "#sivHeaderHeaderList" ) )
        .init( this.headers() );
      //.defaults(["Subject","Date","Message-ID","Content-Type"]);

      var matchtype = new SieveMatchTypeUI( this.matchtype() );
      $( "#sivHeaderMatchTypes" )
        .append( matchtype.html() );

      var comparator = new SieveComparatorUI( this.comparator() );
      $( "#sivHeaderComparator" )
        .append( comparator.html() );

      ( new SieveStringListWidget( "#sivHeaderKeyList" ) )
        .init( this.keys() );
    };

  SieveHeaderUI.prototype.getSummary
    = function () {
      return $( "<div/>" )
        .html( " header " + $( '<em/>' ).text( this.headers() ).html()
        + " " + this.matchtype().getValue() + " "
        + $( '<em/>' ).text( this.keys() ).html() );
    };

  //****************************************************************************//

  function SieveAddressUI( elm ) {
    SieveTestBoxUI.call( this, elm );
  }

  SieveAddressUI.prototype = Object.create( SieveTestBoxUI.prototype );
  SieveAddressUI.prototype.constructor = SieveAddressUI;

  SieveAddressUI.prototype.addresspart
    = function () {

      return this.getSieve().getElement( "address-part" );
    };

  SieveAddressUI.prototype.comparator
    = function () {

      return this.getSieve().getElement( "comparator" );
    };

  SieveAddressUI.prototype.matchtype
    = function () {

      return this.getSieve().getElement( "match-type" );
    };

  SieveAddressUI.prototype.headers
    = function () {

      return this.getSieve().getElement( "headers" );
    };

  SieveAddressUI.prototype.keys
    = function () {

      return this.getSieve().getElement( "keys" );
    };

  SieveAddressUI.prototype.onValidate
    = function () {
      return true;
    };

  SieveAddressUI.prototype.initHelp
    = function () {
      return $( "<div/>" )
        .html( '<h1>Compares headers against E-Mail addresses.</h1>'
        + '<p>You typically use test with headers like "to", "from", "cc" etc. </p>'
        + '<p>As this test is aware of e-mail addresses containing display names. '
        + "A header containing  '\"roadrunner\" &lt;roadrunner@acme.example.com&gt;'"
        + " is considered to be equivalent to \"'roadrunner@acme.example.com\"</p>"
        + '<p>If the header should be matched against a string use the header test.</p>' );
    };

  SieveAddressUI.prototype.initEditor
    = function () {

      /*From, To, Cc, Bcc, Sender, Resent-From, Resent-To*/
      return $( "<div/>" )
        .append( $( "<h1/>" ).text( "Any of the following header ..." ) )
        .append(( new SieveStringListUI( this.headers() ) )
          .defaults( ["To", "From", "Cc", "Bcc", "Reply-To"] ).html() )
        .append(( new SieveMatchTypeUI( this.matchtype() ) ).html() )
        .append(( new SieveAddressPartUI( this.addresspart() ) ).html() )
        .append( $( "<h1/>" ).text( "... any of the keyword(s)" ) )
        .append(( new SieveStringListUI( this.keys() ) ).html() )
        .append(( new SieveComparatorUI( this.comparator() ) ).html() );
    };

  SieveAddressUI.prototype.initSummary
    = function () {
      // case- insensitive is the default so skip it...
      return $( "<div/>" )
        .html( " address <em>" + $( '<div/>' ).text( this.headers().toScript() ).html() + "</em>"
        + " " + this.matchtype().getValue()
        + " " + ( ( this.addresspart().getValue() !== ":all" ) ? this.addresspart().getValue() : "" )
        + " <em>" + $( '<div/>' ).text( this.keys().toScript() ).html() + "</em>" );
    };


  function SieveEnvelopeUI( elm ) {
    SieveTestBoxUI.call( this, elm );
  }

  SieveEnvelopeUI.prototype = Object.create( SieveTestBoxUI.prototype );
  SieveEnvelopeUI.prototype.constructor = SieveEnvelopeUI;

  SieveEnvelopeUI.prototype.addresspart
    = function () {

      return this.getSieve().getElement( "address-part" );
    };

  SieveEnvelopeUI.prototype.comparator
    = function () {

      return this.getSieve().getElement( "comparator" );
    };

  SieveEnvelopeUI.prototype.matchtype
    = function () {

      return this.getSieve().getElement( "match-type" );
    };

  SieveEnvelopeUI.prototype.envelopes
    = function () {

      return this.getSieve().getElement( "envelopes" );
    };

  SieveEnvelopeUI.prototype.keys
    = function () {

      return this.getSieve().getElement( "keys" );
    };

  SieveEnvelopeUI.prototype.initHelp
    = function () {

      return $( "<div/>" )
        .html( '<h1>Compares fields against the envelope</h1>'
        + '<p>The envelop is equivalent to the mail delivery protocol. So it ' +
        'does not test against a real header. Instead uses trace information' +
        'from the mail delivery protocol for specific values.</p>' +
        '<p>A "to" tests the SMTP sender field "RCPT TO" a "from" the recipient' +
        ' "MAIL FROM". </p>' +
        '<p>It\'s the most reliant way to test from which address a message ' +
        'was send to or received.</p>' );
    };

  SieveEnvelopeUI.prototype.initEditor
    = function () {

      /*envelope [COMPARATOR] [ADDRESS-PART] [MATCH-TYPE]
                <envelope-part: string-list> <key-list: string-list>*/
      /*From, To, Cc, Bcc, Sender, Resent-From, Resent-To*/
      return $( "<div/>" )
        .append( $( "<h1/>" ).text( "Any of the following envelope fields ..." ) )
        .append(( new SieveStringListUI( this.envelopes() ) )
          .defaults( ["From", "To"] ).html() )
        .append(( new SieveMatchTypeUI( this.matchtype() ) ).html() )
        .append(( new SieveAddressPartUI( this.addresspart() ) ).html() )
        .append( $( "<h1/>" ).text( "... any of the keyword(s)" ) )
        .append(( new SieveStringListUI( this.keys() ) ).html() )
        .append(( new SieveComparatorUI( this.comparator() ) ).html() );
    };

  SieveEnvelopeUI.prototype.initSummary
    = function () {
      return $( "<div/>" )
        .html( " envelope " + $( '<em/>' ).text( this.envelopes().toScript() ).html() 
        + " " + this.matchtype().getValue()
        + " " + ( ( this.addresspart().getValue() !== ":all" ) ? this.addresspart().getValue() : "" )
        + " " + $( '<em/>' ).text( this.keys().toScript() ).html() + "" );
    };


  if ( !SieveDesigner )
    throw new Error("Could not register Action Widgets");


  SieveDesigner.register( "test/address", SieveAddressUI );
  SieveDesigner.register( "test/boolean", SieveBooleanTestUI );
  SieveDesigner.register( "test/envelope", SieveEnvelopeUI );
  SieveDesigner.register( "test/exists", SieveExistsUI );
  SieveDesigner.register( "test/header", SieveHeaderUI );
  SieveDesigner.register( "test/size", SieveSizeTestUI );

})( window );
