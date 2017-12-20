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

( function ( exports ) {

  "use strict";

  /* global $: false */
  /* global SieveAbstractBoxUI */

  //****************************************************************************//

  // split into object like matchtypes
  function SieveComparatorUI( elm ) {
    SieveAbstractBoxUI.call( this, elm );
  }

  SieveComparatorUI.prototype = Object.create( SieveAbstractBoxUI.prototype );
  SieveComparatorUI.prototype.constructor = SieveComparatorUI;

  SieveComparatorUI.prototype.onSelect
    = function () {

      var value = $( "input[name='rgComparator" + this.id() + "']:checked" ).val();
      this.getSieve().setValue( value );
    };

  SieveComparatorUI.prototype.createHtml
    = function () {

      var value = this.getSieve().getValue();

      var that = this;

      return $( "<div/>" )
        .addClass( "sivComparator" )
        .append( $( "<h1/>" ).text( "Compare" ) )
        .append( $( "<div/>" )
          .append( $( "<input/>" )
            .attr( "type", "radio" )
            .attr( "name", "rgComparator" + this.id() )
            .attr( "value", '"i;ascii-casemap"' )
            .change( function () { that.onSelect(); }) )
          .append( $( "<span/>" ).text( "Case insensitive ASCII String (default)" ) ) )
        .append( $( "<div/>" )
          .append( $( "<input/>" )
            .attr( "type", "radio" )
            .attr( "name", "rgComparator" + this.id() )
            .attr( "value", '"i;octet"' )
            .change( function () { that.onSelect(); }) )
          .append( $( "<span/>" ).text( "Case sensitive byte by byte" ) ) )
        .append( $( "<div/>" )
          .append( $( "<input/>" )
            .attr( "type", "radio" )
            .attr( "name", "rgComparator" + this.id() )
            .attr( "value", '"i;ascii-numeric"' )
            .change( function () { that.onSelect(); }) )
          .append( $( "<span/>" ).text( "Convert the ascii string to an integer and do a numeric compare" ) ) )
        .find( "input[name='rgComparator" + this.id() + "'][value='" + value + "']" )
        .attr( "checked", "checked" )
        .end();
    };

  exports.SieveComparatorUI = SieveComparatorUI;

})( window );