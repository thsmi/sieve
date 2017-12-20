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

  /* global SieveDesigner */
  /* global SieveAbstractAddressPartUI */

  //   :user "+" :detail "@" :domain
  // \----:local-part----/ 

  //************************************************************************************

  function SieveUserPartUI( id ) {
    SieveAbstractAddressPartUI.call( this, id );
  }

  SieveUserPartUI.prototype = Object.create( SieveAbstractAddressPartUI.prototype );
  SieveUserPartUI.prototype.constructor = SieveUserPartUI;

  SieveUserPartUI.nodeName = function () {
    return "address-part/user";
  };

  SieveUserPartUI.nodeType = function () {
    return "address-part/";
  };

  SieveUserPartUI.isCapable = function ( capabilities ) {
    return !!capabilities["subaddress"];
  };

  SieveUserPartUI.prototype.html
    = function ( callback ) {

      return SieveAbstractAddressPartUI.prototype.html.call(
        this, ":user", "... a user sub-part with ...",
        'Everything before the + sign or between the -- sequence and the @sign. <br>'
        + 'The localpart part is case sensitive.<br>'
        + 'e.g.: "user+detail@example.com" or "detail--user@example.com" is stripped to "user"',
        callback );
    };

  //************************************************************************************

  function SieveDetailPartUI( id ) {
    SieveAbstractAddressPartUI.call( this, id );
  }

  SieveDetailPartUI.prototype = Object.create( SieveAbstractAddressPartUI.prototype );
  SieveDetailPartUI.prototype.constructor = SieveDetailPartUI;

  SieveDetailPartUI.nodeName = function () {
    return "address-part/detail";
  };

  SieveDetailPartUI.nodeType = function () {
    return "address-part/";
  };

  SieveDetailPartUI.isCapable = function ( capabilities ) {
    return !!capabilities["subaddress"];
  };

  SieveDetailPartUI.prototype.html
    = function ( callback ) {

      return SieveAbstractAddressPartUI.prototype.html.call(
        this, ":detail", "... a detail sub-part with ...",
        'Everything between the + sign and the @ sign, or before a -- sequence.<br>'
        + 'The localpart part is case sensitive.<br>'
        + 'e.g.: "user+detail@example.com" or "detail--user@example.com" is stripped to "detail"',
        callback );
    };


  //************************************************************************************

  if ( !SieveDesigner )
    throw new Error( "Could not register String Widgets" );

  SieveDesigner.register2( SieveUserPartUI );
  SieveDesigner.register2( SieveDetailPartUI );

})( window );
