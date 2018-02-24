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
  
  /* global SieveGrammar */

  if ( !SieveGrammar )
    throw new Error("Could not register Include Grammar");

  var _return = {
    node: "action/return",
    type: "action",
    token: "return",

    requires: "include"
  };

  SieveGrammar.addAction( _return );

  
  var _global = {
    node: "action/global",
    type: "action",
    token: "global",

    requires: ["include", "variables"],

    properties: [{
      id: "parameters",

      elements: [{
        id: "variables",

        type: "stringlist",
        value: '"Example"'
      }]
    }]
  };

  SieveGrammar.addAction( _global );

  
  var _once = {
    node: "action/include/once",
    type: "action/include/once",

    requires: "include",

    token: ":once"
  };

  SieveGrammar.addTag( _once );

  
  var _optional = {
    node: "action/include/optional",
    type: "action/include/optional",

    requires: "include",

    token: ":optional"
  };

  SieveGrammar.addTag( _optional );

  
  var globallocation = {
    node: "tag/location-type/global",
    type: "tag/location-type/",

    token: ":global"
  };

  SieveGrammar.addTag( globallocation );


  var personallocation = {
    node: "tag/location-type/personal",
    type: "tag/location-type/",

    token: ":personal"
  };

  SieveGrammar.addTag( personallocation );


  var _location = {
    node: "tag/location-type",
    type: "tag/location-type",
    value: ":personal",

    items: ["tag/location-type/"]
  };

  SieveGrammar.addGroup( _location );


  var _include = {
    node: "action/include",
    type: "action",

    token: "include",

    requires: "include",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "location",
        type: "tag/location-type"
      }, {
        id: "once",
        type: "action/include/once"
      }, {
        id: "optional",
        type: "action/include/optional"
      }]
    }, {
      id: "parameters",

      elements: [{
        id: "script",
        type: "string",

        value: '"Example"'
      }]
    }]
  };

  SieveGrammar.addAction( _include );

})( window );
