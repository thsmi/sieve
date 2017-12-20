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

  /* global SieveGrammar */

  if ( !SieveGrammar )
    throw new Error("Could not register default Actions");

  var _discard = {
    node: "action/discard",
    type: "action",
    token: "discard"
  };

  SieveGrammar.addAction( _discard );

  var _stop = {
    node: "action/stop",
    type: "action",
    token: "stop"
  };

  SieveGrammar.addAction( _stop );

  var _keep = {
    node: "action/keep",
    type: "action",
    token: "keep"
  };

  SieveGrammar.addAction( _keep );

  var redirect = {
    node: "action/redirect",
    type: "action",
    token: "redirect",

    properties: [{
      id: "parameters",

      elements: [{
        id: "address",

        type: "string",
        value: "\"username@example.com\""
      }]
    }]
  };

  SieveGrammar.addAction( redirect );

  // <"fileinto"> <string> <";">
  var fileinto = {
    node: "action/fileinto",
    type: "action",
    token: "fileinto",

    requires: "fileinto",

    properties: [{
      id: "parameters",

      elements: [{
        id: "path",

        type: "string",
        value: "\"INBOX\""
      }]
    }]
  };

  SieveGrammar.addAction( fileinto );

})( window );