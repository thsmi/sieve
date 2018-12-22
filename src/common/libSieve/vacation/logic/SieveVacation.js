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

(function () {

  "use strict";

  /* global SieveGrammar */

  if (!SieveGrammar)
    throw new Error("Could not register Vacation");

  SieveGrammar.addAction({
    node: "action/vacation",
    type: "action",

    requires: "vacation",

    token: "vacation",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "interval",
        type: "action/vacation/interval"
      },
      {
        id: "subject",
        type: "action/vacation/subject"
      },
      {
        id: "from",
        type: "action/vacation/from"
      },
      {
        id: "addresses",
        type: "action/vacation/addresses"
      },
      {
        id: "mime",
        type: "action/vacation/mime"
      },
      {
        id: "handle",
        type: "action/vacation/handle"
      }]
    }, {
      id: "parameters",

      elements: [{
        id: "reason",
        type: "string",
        value: '""'
      }]
    }]
  });


  SieveGrammar.addTag({
    node: "action/vacation/interval/days",
    type: "action/vacation/interval/",

    // requires: "vacation",

    token: ":days",

    properties: [{
      id: "parameters",

      elements: [{
        id: "days",
        type: "number",
        value: '7'
      }]
    }]
  });

  SieveGrammar.addGroup({
    node: "action/vacation/interval",
    type: "action/vacation/interval",

    items: ["action/vacation/interval/"]
  });

  SieveGrammar.addTag({
    node: "action/vacation/subject",
    type: "action/vacation/subject",

    token: ":subject",

    properties: [{
      id: "parameters",

      elements: [{
        id: "subject",
        type: "string"
      }]
    }]
  });

  SieveGrammar.addTag({
    node: "action/vacation/from",
    type: "action/vacation/from",

    token: ":from",

    properties: [{
      id: "parameters",

      elements: [{
        id: "from",
        type: "string"
      }]
    }]
  });

  SieveGrammar.addTag({
    node: "action/vacation/addresses",
    type: "action/vacation/addresses",

    token: ":addresses",

    properties: [{
      id: "parameters",

      elements: [{
        id: "addresses",
        type: "stringlist"
      }]
    }]
  });

  SieveGrammar.addTag({
    node: "action/vacation/mime",
    type: "action/vacation/mime",

    token: ":mime"
  });

  SieveGrammar.addTag({
    node: "action/vacation/handle",
    type: "action/vacation/handle",

    token: ":handle",

    properties: [{
      id: "parameters",

      elements: [{
        id: "handle",
        type: "string"
      }]
    }]
  });

})(window);
