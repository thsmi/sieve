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
  /* global SieveOperatorBoxUI */
  /* global SieveMultaryDropHandler */
  /* global SieveDropBoxUI */
  /* global SieveEditableBoxUI */

  function SieveNotUI( elm ) {
    SieveOperatorBoxUI.call( this, elm );
  }

  SieveNotUI.prototype = Object.create( SieveOperatorBoxUI.prototype );
  SieveNotUI.prototype.constructor = SieveNotUI;

  SieveNotUI.prototype.initSummary
    = function () {
      return $( "<div/>" )
        .text( "does not match:" )
        .append( this.getSieve().test().html() );
    };


  //****************************************************************************//

  function SieveAnyOfAllOfUI( elm ) {
    SieveOperatorBoxUI.call( this, elm );
  }

  SieveAnyOfAllOfUI.prototype = Object.create( SieveOperatorBoxUI.prototype );
  SieveAnyOfAllOfUI.prototype.constructor = SieveAnyOfAllOfUI;

  SieveAnyOfAllOfUI.prototype.onValidate
    = function () {

      if ($("#AnyOfAllOfValue" + this.id()).val() === "true")
        this.getSieve().isAllOf = true;
      else
        this.getSieve().isAllOf = false;

      return true;
    };

  SieveAnyOfAllOfUI.prototype.initEditor
    = function () {
      return $( "<div/>" )
        .append( $( "<select/>" )
          .attr( "id", "AnyOfAllOfValue" + this.id() )
          .append( $( "<option/>" )
            .text( "All of the following" ).val( "true" ) )
          .append( $( "<option/>" )
            .text( "Any of the following" ).val( "false" ) )
          .val( "" + this.getSieve().isAllOf ) );
    };

  SieveAnyOfAllOfUI.prototype.initSummary
    = function () {
      return $( "<div/>" )
        .text(( this.getSieve().isAllOf ) ? "All of the following:" : "Any of the following:" );
    };

  SieveAnyOfAllOfUI.prototype.createHtml
    = function ( parent ) {

      let item = $("<div/>")
        .addClass( "sivOperator" );

      for (let i = 0; i < this.getSieve().tests.length; i++)
        item
          .append(( new SieveDropBoxUI( this ) )
            .drop( new SieveMultaryDropHandler(), this.getSieve().tests[i][1] )
            .html()
            .addClass( "sivOperatorSpacer" ) )
          .append(
          $( "<div/>" ).append( this.getSieve().tests[i][1].html() )
            .addClass( "sivOperatorChild" ) );

      item
        .append(( new SieveDropBoxUI( this ) )
          .drop( new SieveMultaryDropHandler() )
          .html()
          .addClass( "sivOperatorSpacer" ) );

      return SieveEditableBoxUI.prototype.createHtml.call( this, parent )
        .append( item );

    };

  SieveAnyOfAllOfUI.prototype.showSummary
    = function () {
      SieveEditableBoxUI.prototype.showSummary.call( this );
      this.html().children( ".sivSummaryContent" ).after( this.html().children( ".sivOperator" ) );
    };

  SieveAnyOfAllOfUI.prototype.showEditor
    = function () {
      SieveEditableBoxUI.prototype.showEditor.call( this );
      this.html().children( ".sivEditorContent" ).after( this.html().children( ".sivOperator" ) );
    };

  if ( !SieveDesigner )
    throw new Error( "Could not register operator Widgets" );

  SieveDesigner.register( "operator/not", SieveNotUI );
  SieveDesigner.register( "operator/anyof", SieveAnyOfAllOfUI );

})( window );
