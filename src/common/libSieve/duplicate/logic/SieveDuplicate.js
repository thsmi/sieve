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

(function () {

  "use strict";

  /* global SieveGrammar */

  if (!SieveGrammar)
    throw new Error("Could not register Duplicate");


  /* Usage: "duplicate" [":handle" <handle: string>]
  [":header" <header-name: string> /
      ":uniqueid" <value: string>]
  [":seconds" <timeout: number>] [":last"] */

  let duplicate = {
    node: "test/duplicate",
    type: "test",

    requires: "duplicate",

    token: "duplicate",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "handle",
        type: "test/duplicate/handle"
      },
      {
        id: "unique",
        type: "test/duplicate/unique"
      },
      {
        id: "seconds",
        type: "test/duplicate/seconds"
      },
      {
        id: "last",
        type: "test/duplicate/last"
      }]
    }]
  };

  SieveGrammar.addTest(duplicate);

  SieveGrammar.addTag({
    node: "test/duplicate/last",
    type: "test/duplicate/",

    requires: "duplicate",

    token: ":last"
  });

  // handle
  SieveGrammar.addTag({
    node: "test/duplicate/handle",
    type: "test/duplicate/",

    token: ":handle",

    requires: "duplicate",

    properties: [{
      id: "parameters",

      elements: [{
        id: "handle",
        type: "string",

        value: '""'
      }]
    }]
  });


  // uniqueid/header
  SieveGrammar.addTag({
    node: "test/duplicate/unique/header",
    type: "test/duplicate/unique/",

    token: ":header",

    requires: "duplicate",

    properties: [{
      id: "parameters",

      elements: [{
        id: "header",
        type: "string",

        value: '""'
      }]
    }]
  });

  // uniqueid/id
  SieveGrammar.addTag({
    node: "test/duplicate/unique/id",
    type: "test/duplicate/unique/",

    token: ":uniqueid",

    requires: "duplicate",

    properties: [{
      id: "parameters",

      elements: [{
        id: "uniqueid",
        type: "string",
        value: '""'
      }]
    }]
  });



  SieveGrammar.addGroup({
    node: "test/duplicate/unique",
    type: "test/duplicate/unique",

    items: ["test/duplicate/unique/"]
  });


  // seconds
  SieveGrammar.addTag({
    node: "test/duplicate/seconds",
    type: "test/duplicate/seconds/",

    token: ":seconds",

    requires: "duplicate",

    properties: [{
      id: "parameters",

      elements: [{
        id: "timeout",
        type: "number"
      }]
    }]
  });

})(window);
