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

  function SieveStringListWidget( selector ) {
    this._selector = selector;
    this._min = 0;
  }

  SieveStringListWidget.prototype.addItem
    = function ( value ) {

      var that = this;
      if ( typeof ( value ) === "undefined" )
        value = "";

      var elm = this.template().clone();

      $( $( this._selector ).attr( "data-list-new" ) ).before( elm );

      elm.find( "input[type=text], input[type=email]" ).val( value ).focus();
      elm.find( "button" ).click( function () {
        if ( that._min >= that.items().length )
          return;
        elm.remove();
      }
      );

      return this;
    };

  SieveStringListWidget.prototype.init
    = function ( values ) {

      var that = this;

      $( $( this._selector ).attr( "data-list-new" ) )
        .click( function () { that.addItem(); });

      this._min = parseInt( $( this._selector ).attr( "data-list-min" ), 10 );

      if ( isNaN( this._min ) )
        this._min = 0;

      // init values if possible      
      if ( this.values !== null && typeof ( values ) !== "undefined" )
        this.values( values );

      return this;
    };

  SieveStringListWidget.prototype.template
    = function () {
      return $( $( this._selector ).attr( "data-list-template" ) ).children().first();
    };

  SieveStringListWidget.prototype.items
    = function () {
      var id = ( $( this._selector ).attr( "data-list-items" ) );

      return $( id + " input[type='text']," + id + " input[type='email']" );
    };

  /**
   * Gets and/or sets the string lists values.
   *
   * @param  {string[]} [values]
   *   an optional array of string which should be sets
   *
   * @returns {string[]}
   *   the string lists elements as array.
   **/
  SieveStringListWidget.prototype.values
    = function ( values ) {

      if ( typeof ( values ) !== "undefined" ) {

        if ( Array.isArray( values ) === false )
          throw new Error( "Values is not an array" );

        values.forEach( function ( value ) {
          this.addItem( value );
        }, this );

      }

      // Convert the items into a string array...
      var result = [];

      this.items().each( function ( ) {
        result.push( $( this ).val() );
      });

      return result;
    };

  function SieveTabWidget() {
    this._tabs = "div.dialog-tab";
    this._content = ".dialog-tab-content";
  }

  SieveTabWidget.prototype.init
    = function ( /*tabs, content*/) {

      var that = this;

      $( this._tabs + ' > div' ).click( function () {
        that.onTabChange( this );
      });
    };

  SieveTabWidget.prototype.onTabChange
    = function ( elm ) {

      $( this._tabs + ' > div' ).removeClass( 'tab-active' );
      $( this._content + ' > div' ).removeClass( 'tab-active' );

      $( elm ).addClass( 'tab-active' );

      var id = $( elm ).attr( 'data-tab-content' );
      $( "#" + id ).addClass( 'tab-active' );
    };

  exports.SieveTabWidget = SieveTabWidget;
  exports.SieveStringListWidget = SieveStringListWidget;

})( window );
