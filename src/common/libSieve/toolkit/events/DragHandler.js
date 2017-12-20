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
  /* global SieveDataTransfer */

  function SieveDragHandler( flavour ) {
    if ( typeof ( flavour ) !== "undefined" )
      this._flavour = flavour;
  }

  SieveDragHandler.prototype._owner = null;
  SieveDragHandler.prototype._flavour = "sieve/action";

  SieveDragHandler.prototype.flavour
    = function ( flavour ) {
      if ( typeof ( flavour ) === 'undefined' )
        return this._flavour;

      this._flavour = flavour;

      return this;
    };

  SieveDragHandler.prototype.onDragStart
    = function ( event ) {

      if ( !this.onDrag )
        return false;

      this.onDrag( event.originalEvent );

      event = event.originalEvent;

      event.dataTransfer.setDragImage( this.owner().html().get( 0 ),
        event.pageX - this.owner().html().offset().left,
        event.pageY - this.owner().html().offset().top );

      //event.preventDefault();
      event.stopPropagation();

      return true;
    };

  SieveDragHandler.prototype.document
    = function () {
      if ( !this._owner )
        throw new Error( "Owner for this Drop Handler" );

      return this._owner.document();
    };

  SieveDragHandler.prototype.bind
    = function ( owner ) {
      this._owner = owner;
    };

  SieveDragHandler.prototype.owner
    = function ( /*owner*/ ) {
      return this._owner;
    };

  SieveDragHandler.prototype.attach
    = function ( html ) {
      var that = this;

      html.attr( "sivtype", this.flavour() )
        .attr( "draggable", "true" )
        .on( "dragstart", function ( event ) { that.onDragStart( event ); return true; })
        .on( "dragend", function () { return false; });
    };

  SieveDragHandler.prototype.onDrag
    = function ( event ) {
      var dt = new SieveDataTransfer( event.dataTransfer );

      dt.clear();

      dt.setData( "application/sieve", this.getScript() );
      dt.setData( this.flavour(), this.getMetaInfo() );
    };

  /**
   * The Sieve script which should be transfered.
   * 
   * @return {String} the sieve script as plain text
   */
  SieveDragHandler.prototype.getScript
    = function () {
      throw new Error( "Implement me" );
    };

  /**
   * The meta information for this sieve script.
   * 
   * @return {String} the meta information about the drag element
   */
  SieveDragHandler.prototype.getMetaInfo
    = function () {
      throw new Error( "Implement me" );
    };

  //****************************************************************************//

  function SieveMoveDragHandler( flavour ) {
    SieveDragHandler.call( this, flavour );
  }

  SieveMoveDragHandler.prototype = Object.create( SieveDragHandler.prototype );
  SieveMoveDragHandler.prototype.constructor = SieveMoveDragHandler;

  /**
   * @inheritdoc
   */
  SieveMoveDragHandler.prototype.getScript
    = function () {
      return "" + this.owner().getSieve().toScript();
    };

  /**
   * @inheritdoc
   */
  SieveMoveDragHandler.prototype.getMetaInfo
    = function () {
      return JSON.stringify( { id: this.owner().id(), action: "move" });
    };

  //****************************************************************************//

  function SieveCreateDragHandler( flavour ) {
    SieveDragHandler.call( this, flavour );
  }

  SieveCreateDragHandler.prototype = Object.create( SieveDragHandler.prototype );
  SieveCreateDragHandler.prototype.constructor = SieveCreateDragHandler;

  /**
   * @inheritdoc
   */
  SieveCreateDragHandler.prototype.getScript
    = function () {
      return "" + this.owner().toScript();
    };

  /**
   * @inheritdoc
   */
  SieveCreateDragHandler.prototype.getMetaInfo
    = function () {
      return JSON.stringify( { type: this.owner()._elmType, action: "create" });
    };

  exports.SieveDragHandler = SieveDragHandler;
  exports.SieveMoveDragHandler = SieveMoveDragHandler;
  exports.SieveCreateDragHandler = SieveCreateDragHandler;

})( window );

