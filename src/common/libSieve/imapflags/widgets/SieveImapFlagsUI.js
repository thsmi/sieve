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

( function ( /*exports*/ ) {

  "use strict";

  /* global $: false */
  /* global SieveDesigner */
  /* global SieveActionDialogBoxUI */

  /* global SieveTabWidget */
  /* global SieveStringListWidget */

  /* global SieveActionDialogBoxUI */
  /* global SieveTestDialogBoxUI */

  /* global SieveComparatorUI */
  /* global SieveMatchTypeUI */

  function SieveAbstractFlagUI( elm ) {
    SieveActionDialogBoxUI.call( this, elm );
  }

  SieveAbstractFlagUI.prototype = Object.create( SieveActionDialogBoxUI.prototype );
  SieveAbstractFlagUI.prototype.constructor = SieveAbstractFlagUI;

  SieveAbstractFlagUI.prototype.getFlags = function () {
    return this.getSieve().getElement( "flags" ).values();
  };

  SieveAbstractFlagUI.prototype.setFlags = function ( values ) {
    this.getSieve().getElement( "flags" ).values( values );
  };

  SieveAbstractFlagUI.prototype.onSave
    = function () {

      var values = ( new SieveStringListWidget( "#sivFlagKeywordList" ) ).values();

      if ( !values || !values.length ) {
        window.alert( "Flag keyword list is empty" );
        return false;
      }

      this.setFlags( values );

      return true;
    };

  SieveAbstractFlagUI.prototype.onLoad
    = function () {

      ( new SieveTabWidget() ).init();

      ( new SieveStringListWidget( "#sivFlagKeywordList" ) )
        .init( this.getFlags() );
    };


  function SieveSetFlagUI( elm ) {
    SieveAbstractFlagUI.call( this, elm );
  }

  SieveSetFlagUI.prototype = Object.create( SieveAbstractFlagUI.prototype );
  SieveSetFlagUI.prototype.constructor = SieveSetFlagUI;

  SieveSetFlagUI.prototype.getTemplate
    = function () {
      return "./imapflags/templates/SieveSetFlagActionUI.html #sivDialogSetFlag";
    };

  SieveSetFlagUI.prototype.getSummary
    = function () {
      return $( "<div/>" )
        .text( "Set IMAP flag(s) " + this.getFlags().join( ", " ) );
    };


  function SieveAddFlagUI( elm ) {
    SieveAbstractFlagUI.call( this, elm );
  }

  SieveAddFlagUI.prototype = Object.create( SieveAbstractFlagUI.prototype );
  SieveAddFlagUI.prototype.constructor = SieveAddFlagUI;

  SieveAddFlagUI.prototype.getTemplate
    = function () {
      return "./imapflags/templates/SieveAddFlagActionUI.html #sivDialogAddFlag";
    };

  SieveAddFlagUI.prototype.getSummary
    = function () {

      return $( "<div/>" )
        .text( "Add IMAP flag(s) " + this.getFlags().join( ", " ) );
    };


  function SieveRemoveFlagUI( elm ) {
    SieveAbstractFlagUI.call( this, elm );
  }

  SieveRemoveFlagUI.prototype = Object.create( SieveAbstractFlagUI.prototype );
  SieveRemoveFlagUI.prototype.constructor = SieveRemoveFlagUI;

  SieveRemoveFlagUI.prototype.getTemplate
    = function () {
      return "./imapflags/templates/SieveRemoveFlagActionUI.html #sivDialogRemoveFlag";
    };

  SieveRemoveFlagUI.prototype.getSummary
    = function () {
      return $( "<div/>" )
        .text( "Remove IMAP flag(s) " + this.getFlags().join( ", " ) );
    };


  /**
   * Implements controls to edit a sieve body test
   * 
   * "body" [COMPARATOR] [MATCH-TYPE] [BODY-TRANSFORM]  <key-list: string-list>
   *
   * @constructor
   * @param {Object} elm - The sieve element which should be rendered.
   */
  function SieveHasFlagUI( elm ) {
    SieveTestDialogBoxUI.call( this, elm );
  }

  SieveHasFlagUI.prototype = Object.create( SieveTestDialogBoxUI.prototype );
  SieveHasFlagUI.prototype.constructor = SieveHasFlagUI;

  SieveHasFlagUI.prototype.matchtype
    = function () {
      return this.getSieve().getElement( "match-type" );
    };

  SieveHasFlagUI.prototype.comparator
    = function () {
      return this.getSieve().getElement( "comparator" );
    };

  SieveHasFlagUI.prototype.flags
    = function ( values ) {
      return this.getSieve().getElement( "flags" ).values( values );
    };

  SieveHasFlagUI.prototype.onLoad
    = function () {

      ( new SieveTabWidget() ).init();

      var matchtype = new SieveMatchTypeUI( this.matchtype() );
      $( "#sivHasFlagMatchTypes" )
        .append( matchtype.html() );

      var comparator = new SieveComparatorUI( this.comparator() );
      $( "#sivHasFlagComparator" )
        .append( comparator.html() );

      ( new SieveStringListWidget( "#sivHasFlagKeyList" ) ).init( this.flags() );

    };

  SieveHasFlagUI.prototype.onSave
    = function () {

      this.flags(( new SieveStringListWidget( "#sivHasFlagKeyList" ) ).values() );
      return true;
    };

  SieveHasFlagUI.prototype.getTemplate
    = function () {
      return "./imapflags/templates/SieveHasFlagTestUI.html #sivHasFlagDialog";
    };

  SieveHasFlagUI.prototype.getSummary
    = function () {

      // case- insensitive is the default so skip it...
      return $( "<div/>" )
        .html( " has IMAP flags(s) <em> "
        + this.matchtype().getValue() + " "
        + $( '<div/>' ).text( this.flags() ).html() + "</em>" );
    };


  if ( !SieveDesigner )
    throw new Error( "Could not register IMAP Flags Widgets" );

  SieveDesigner.register( "action/setflag", SieveSetFlagUI );
  SieveDesigner.register( "action/addflag", SieveAddFlagUI );
  SieveDesigner.register( "action/removeflag", SieveRemoveFlagUI );

  SieveDesigner.register( "test/hasflag", SieveHasFlagUI );

} )( window );
