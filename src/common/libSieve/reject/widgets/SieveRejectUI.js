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

( function (/*exports*/ ) {

  "use strict";

  /* global $: false */
  /* global SieveActionDialogBoxUI */
  /* global SieveTabWidget */
  /* global SieveDesigner */

  function SieveRejectActionUI( elm ) {
    SieveActionDialogBoxUI.call( this, elm );
  }

  SieveRejectActionUI.prototype = Object.create( SieveActionDialogBoxUI.prototype );
  SieveRejectActionUI.prototype.constructor = SieveRejectActionUI;

  SieveRejectActionUI.prototype.getTemplate
    = function () {
      return "./reject/templates/SieveRejectActionUI.html #sivDialogReject";
    };

  /**
   *  Gets and/or Sets the reason why the mail should be rejected
   *
   *  @param  {string} [reason]
   *    optional the new reason which should be set. 
   *
   *  @returns {string} the current reason
   */
  SieveRejectActionUI.prototype.reason
    = function ( reason ) {

      return this.getSieve().getElement( "reason" ).value( reason );
    };

  SieveRejectActionUI.prototype.onSave
    = function () {
      this.reason( $( "#sivRejectReason" ).val() );

      return true;
    };

  SieveRejectActionUI.prototype.onLoad
    = function () {
      ( new SieveTabWidget() ).init();

      $( "#sivRejectReason" ).val( this.reason() );
    };

  SieveRejectActionUI.prototype.getSummary
    = function () {
      return $( "<div/>" )
        .html( "Reject incomming messages and reply the following reason:" +
        "<div>" +
        $( '<em/>' ).text( this.reason().substr( 0, 240 ) ).html() +
        ( ( this.reason().length > 240 ) ? "..." : "" ) +
        "</div>" );
    };

  //*************************************************************************************//

  function SieveExtendedRejectActionUI( elm ) {
    SieveActionDialogBoxUI.call( this, elm );
  }

  SieveExtendedRejectActionUI.prototype = Object.create( SieveActionDialogBoxUI.prototype );
  SieveExtendedRejectActionUI.prototype.constructor = SieveExtendedRejectActionUI;

  SieveExtendedRejectActionUI.prototype.getTemplate
    = function () {
      return "./reject/templates/SieveExtendedRejectActionUI.html #sivDialogExtendedReject";
    };

  /**
   *  Gets and/or Sets the reason why the mail should be rejected
   *
   *  @param  {string} [reason]
   *    optional the new reason which should be set. 
   *
   *  @returns {string} the current reason
   */
  SieveExtendedRejectActionUI.prototype.reason
    = function ( reason ) {

      return this.getSieve().getElement( "reason" ).value( reason );
    };

  SieveExtendedRejectActionUI.prototype.onSave
    = function () {
      this.reason( $( "#sivExtendedRejectReason" ).val() );
      return true;
    };

  SieveExtendedRejectActionUI.prototype.onLoad
    = function () {
      ( new SieveTabWidget() ).init();

      $( "#sivExtendedRejectReason" ).val( this.reason() );
    };

  SieveExtendedRejectActionUI.prototype.getSummary
    = function () {
      return $( "<div/>" )
        .html( "Reject incomming messages and reply the following reason:" +
        "<div>" +
        $( '<em/>' ).text( this.reason().substr( 0, 240 ) ).html() +
        ( ( this.reason().length > 240 ) ? "..." : "" ) +
        "</div>" );
    };

  if ( !SieveDesigner )
    throw new Error( "Could not register Reject Widgets" );


  SieveDesigner.register( "action/reject", SieveRejectActionUI );
  SieveDesigner.register( "action/ereject", SieveExtendedRejectActionUI );

})( window );