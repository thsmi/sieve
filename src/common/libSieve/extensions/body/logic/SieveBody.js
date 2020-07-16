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


import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.js";

// "body" [COMPARATOR] [MATCH-TYPE] [BODY-TRANSFORM] <key-list: string-list>

SieveGrammar.addTest({
  node: "test/body",
  type: "test",

  requires: "body",

  token: "body",

  properties: [{
    id: "tags",
    optional: true,

    elements: [{
      id: "body-transform",
      type: "body-transform"
    }, {
      id: "match-type",
      type: "match-type"
    }, {
      id: "comparator",
      type: "comparator"

    }]
  }, {
    id: "parameters",
    elements: [{
      id: "keys",
      type: "stringlist",
      value: '"Example"'
    }]
  }]
});

// -------------------------------------------------------------------------//

SieveGrammar.addTag({
  node: "body-transform/raw",
  type: "body-transform/",

  requires: "body",

  token: ":raw"
});

SieveGrammar.addTag({
  node: "body-transform/content",
  type: "body-transform/",

  requires: "body",

  token: ":content",


  properties: [{
    id: "parameters",

    elements: [{
      id: "contentType",
      type: "stringlist",
      value: '""'
    }]
  }]

});

SieveGrammar.addTag({
  node: "body-transform/text",
  type: "body-transform/",

  requires: "body",

  token: ":text"
});

// ----------------------------------------------------------------------------

SieveGrammar.addGroup({
  node: "body-transform",
  type: "body-transform",

  value: ":text",

  items: ["body-transform/"]
});

