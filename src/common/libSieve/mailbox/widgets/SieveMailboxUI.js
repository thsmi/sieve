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

( function ( /*exports*/ ) {

  "use strict";

  /* global $: false */
  /* global SieveTestDialogBoxUI */
  /* global SieveTabWidget */
  /* global SieveStringListWidget */
  /* global SieveDesigner */
  /* global SieveMatchTypeUI */
  /* global SieveComparatorUI */

  function SieveMailboxExistsTestUI( elm ) {
    SieveTestDialogBoxUI.call( this, elm );
  }

  SieveMailboxExistsTestUI.prototype = Object.create( SieveTestDialogBoxUI.prototype );
  SieveMailboxExistsTestUI.prototype.constructor = SieveMailboxExistsTestUI;

  SieveMailboxExistsTestUI.prototype.mailboxes
    = function ( values ) {
      return this.getSieve().getElement( "mailboxes" ).values( values );
    };


  SieveMailboxExistsTestUI.prototype.onLoad
    = function () {

      ( new SieveTabWidget() ).init();

      ( new SieveStringListWidget( "#sivMailboxNamesList" ) )
        .init( this.mailboxes() );
    };

  SieveMailboxExistsTestUI.prototype.onSave
    = function () {

      this.mailboxes(( new SieveStringListWidget( "#sivMailboxNamesList" ) ).values() );
      return true;
    };

  SieveMailboxExistsTestUI.prototype.getTemplate
    = function () {
      return "./mailbox/templates/SieveMailboxExistsTest.html #sivMailboxDialog";
    };

  SieveMailboxExistsTestUI.prototype.getSummary
    = function () {
      // case- insensitive is the default so skip it...
      return $( "<div/>" )
        .html( " Mailbox(es) "
        + $( '<em/>' ).text( this.mailboxes() ).html() + " exist" );
    };

  //****************************************************************************

  function SieveMetaDataExistsTestUI( elm ) {
    SieveTestDialogBoxUI.call( this, elm );
  }

  SieveMetaDataExistsTestUI.prototype = Object.create( SieveTestDialogBoxUI.prototype );
  SieveMetaDataExistsTestUI.prototype.constructor = SieveMetaDataExistsTestUI;


  SieveMetaDataExistsTestUI.prototype.mailbox
    = function ( value ) {
      return this.getSieve().getElement( "mailbox" ).value( value );
    };

  SieveMetaDataExistsTestUI.prototype.annotations
    = function ( values ) {
      return this.getSieve().getElement( "annotations" ).values( values );
    };

  SieveMetaDataExistsTestUI.prototype.onLoad
    = function () {

      ( new SieveTabWidget() ).init();

      $( "#sivMailboxName" ).val( this.mailbox() );

      ( new SieveStringListWidget( "#sivMailboxAnnotationsList" ) )
        .init( this.annotations() );
    };

  SieveMetaDataExistsTestUI.prototype.onSave
    = function () {

      this.mailbox( $( "#sivMailboxName" ).val() );
      this.annotations(( new SieveStringListWidget( "#sivMailboxAnnotationsList" ) ).values() );


      return true;
    };

  SieveMetaDataExistsTestUI.prototype.getTemplate
    = function () {
      return "./mailbox/templates/SieveMetaDataExistsTest.html #sivMailboxDialog";
    };

  SieveMetaDataExistsTestUI.prototype.getSummary
    = function () {

      // case- insensitive is the default so skip it...
      return $( "<div/>" )
        .html( " Mailbox " + $( '<em/>' ).text( this.mailbox() ).html()
        + " has all annotations "
        + $( '<em/>' ).text( this.annotations() ).html() );
    };

  //****************************************************************************

  function SieveMetaDataTestUI( elm ) {
    SieveTestDialogBoxUI.call( this, elm );
  }

  SieveMetaDataTestUI.prototype = Object.create( SieveTestDialogBoxUI.prototype );
  SieveMetaDataTestUI.prototype.constructor = SieveMetaDataTestUI;

  SieveMetaDataTestUI.prototype.mailbox
    = function ( value ) {
      return this.getSieve().getElement( "mailbox" ).value( value );
    };

  SieveMetaDataTestUI.prototype.annotation
    = function ( value ) {
      return this.getSieve().getElement( "annotation" ).value( value );
    };

  SieveMetaDataTestUI.prototype.keys
    = function ( values ) {
      return this.getSieve().getElement( "keys" ).values( values );
    };

  SieveMetaDataTestUI.prototype.matchtype
    = function () {
      return this.getSieve().getElement( "match-type" );
    };

  SieveMetaDataTestUI.prototype.comparator
    = function () {
      return this.getSieve().getElement( "comparator" );
    };

  SieveMetaDataTestUI.prototype.onLoad
    = function () {

      ( new SieveTabWidget() ).init();

      $( "#sivMailboxName" ).val( this.mailbox() );
      $( "#sivAnnotationName" ).val( this.annotation() );

      ( new SieveStringListWidget( "#sivMailboxKeys" ) )
        .init( this.keys() );

      var matchtype = new SieveMatchTypeUI( this.matchtype() );
      $( "#sivMailboxMatchTypes" )
        .append( matchtype.html() );

      var comparator = new SieveComparatorUI( this.comparator() );
      $( "#sivMailboxComparator" )
        .append( comparator.html() );
    };

  SieveMetaDataTestUI.prototype.onSave
    = function () {

      this.mailbox( $( "#sivMailboxName" ).val() );

      this.annotation( $( "#sivAnnotationName" ).val() );

      this.keys(( new SieveStringListWidget( "#sivMailboxKeys" ) ).values() );

      return true;
    };

  SieveMetaDataTestUI.prototype.getTemplate
    = function () {
      return "./mailbox/templates/SieveMetaDataTest.html #sivMailboxDialog";
    };

  SieveMetaDataTestUI.prototype.getSummary
    = function () {
      // case- insensitive is the default so skip it...
      return $( "<div/>" )
        .html( "Annotation " + this.annotation()
        + " in folder " + this.mailbox()
        + " has a value which " + this.matchtype().getValue()
        + " any of " + this.keys() );
    };

  //****************************************************************************

  function SieveServerMetaDataExistsTestUI( elm ) {
    SieveTestDialogBoxUI.call( this, elm );
  }

  SieveServerMetaDataExistsTestUI.prototype = Object.create( SieveTestDialogBoxUI.prototype );
  SieveServerMetaDataExistsTestUI.prototype.constructor = SieveServerMetaDataExistsTestUI;

  SieveServerMetaDataExistsTestUI.prototype.annotations
    = function ( values ) {
      return this.getSieve().getElement( "annotations" ).values( values );
    };

  SieveServerMetaDataExistsTestUI.prototype.onLoad
    = function () {

      ( new SieveTabWidget() ).init();

      ( new SieveStringListWidget( "#sivMailboxAnnotationsList" ) )
        .init( this.annotations() );
    };

  SieveServerMetaDataExistsTestUI.prototype.onSave
    = function () {
      this.annotations( new SieveStringListWidget( "#sivMailboxAnnotationsList" ).values() );
      return true;
    };

  SieveServerMetaDataExistsTestUI.prototype.getTemplate
    = function () {
      return "./mailbox/templates/SieveServerMetaDataExistsTest.html #sivMailboxDialog";
    };

  SieveServerMetaDataExistsTestUI.prototype.getSummary
    = function () {
      // case- insensitive is the default so skip it...
      return $( "<div/>" )
        .html( " The server supports all annotations "
        + $( '<em/>' ).text( this.annotations() ).html() );
    };

  //****************************************************************************

  function SieveServerMetaDataTestUI( elm ) {
    SieveTestDialogBoxUI.call( this, elm );
  }

  SieveServerMetaDataTestUI.prototype = Object.create( SieveTestDialogBoxUI.prototype );
  SieveServerMetaDataTestUI.prototype.constructor = SieveServerMetaDataTestUI;

  SieveServerMetaDataTestUI.prototype.annotation
    = function ( value ) {
      return this.getSieve().getElement( "annotation" ).value( value );
    };

  SieveServerMetaDataTestUI.prototype.keys
    = function ( values ) {
      return this.getSieve().getElement( "keys" ).values( values );
    };

  SieveServerMetaDataTestUI.prototype.matchtype
    = function () {
      return this.getSieve().getElement( "match-type" );
    };

  SieveServerMetaDataTestUI.prototype.comparator
    = function () {
      return this.getSieve().getElement( "comparator" );
    };

  SieveServerMetaDataTestUI.prototype.onLoad
    = function () {

      ( new SieveTabWidget() ).init();

      $( "#sivAnnotationName" ).val( this.annotation() );

      ( new SieveStringListWidget( "#sivMailboxKeys" ) )
        .init( this.keys() );

      var matchtype = new SieveMatchTypeUI( this.matchtype() );
      $( "#sivMailboxMatchTypes" )
        .append( matchtype.html() );

      var comparator = new SieveComparatorUI( this.comparator() );
      $( "#sivMailboxComparator" )
        .append( comparator.html() );
    };

  SieveServerMetaDataTestUI.prototype.onSave
    = function () {

      this.annotation( $( "#sivAnnotationName" ).val() );

      this.keys(( new SieveStringListWidget( "#sivMailboxKeys" ) ).values() );

      return true;
    };

  SieveServerMetaDataTestUI.prototype.getTemplate
    = function () {
      return "./mailbox/templates/SieveServerMetaDataTest.html #sivMailboxDialog";
    };

  SieveServerMetaDataTestUI.prototype.getSummary
    = function () {
      // case- insensitive is the default so skip it...
      return $( "<div/>" )
        .html( "Server annotation " + this.annotation()
        + " has a value which " + this.matchtype().getValue()
        + " any of " + this.keys() );
    };

  //************************************************************************************

  if ( !SieveDesigner )
    throw new Error( "Could not register Mailbox Extension" );

  SieveDesigner.register( "test/mailboxexists", SieveMailboxExistsTestUI );
  SieveDesigner.register( "test/metadataexists", SieveMetaDataExistsTestUI );
  SieveDesigner.register( "test/metadata", SieveMetaDataTestUI );
  SieveDesigner.register( "test/servermetadataexists", SieveServerMetaDataExistsTestUI );
  SieveDesigner.register( "test/servermetadata", SieveServerMetaDataTestUI );

})( window );
