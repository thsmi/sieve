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
    throw new Error("Could not register EditHeaders");

  SieveGrammar.addTag({
    node: "action/addheader/last",
    type: "action/addheader/",

    requires: "editheader",

    token: ":last"
  });

  // "addheader"[":last"] < field - name: string > <value: string>
  SieveGrammar.addAction({
    node: "action/addheader",
    type: "action",

    requires: "editheader",

    token: "addheader",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "last",
        type: "action/addheader/last"
      }]
    }, {
      id: "parameters",

      elements: [{
        id: "name",
        type: "string",
        value: '"X-Header"'
      }, {
        id: "value",
        type: "string",
        value: '"Some Value"'
      }]
    }]
  });

  // ":index" <fieldno: number> [":last"]
  SieveGrammar.addTag({
    node: "action/deleteheader/index",
    type: "action/deleteheader/",

    requires: "editheader",

    token: ":index",

    properties: [{
      id: "field",

      elements: [{
        id: "name",
        type: "number",
        value: '1'
      }]
    }, {
      id: "last",
      optional: true,

      elements: [{
        id: "last",
        type: "action/addheader/last"
      }]
    }]
  });

  // "deleteheader" [":index" <fieldno: number> [":last"]]
  //                   [COMPARATOR] [MATCH-TYPE]
  //                   <field-name: string>
  //                   [<value-patterns: string-list>]

  SieveGrammar.addAction({
    node: "action/deleteheader",
    type: "action",

    requires: "editheader",

    token: "deleteheader",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "index",
        type: "action/deleteheader/index"
      }, {
        id: "match-type",
        type: "match-type"
      }, {
        id: "comparator",
        type: "comparator"
      }]
    }, {
      id: "parameter",

      elements: [{
        id: "name",
        type: "string",
        value: '""'
      }]
    }, {
      id: "parameter2",
      optional: true,
      elements: [{
        id: "values",
        type: "stringlist",
        value: '""'
      }]
    }]
  });

})(window);
