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
        id: "days",
        type: "action/vacation/days"
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
    node: "action/vacation/days",
    type: "action/vacation/days",

    requires: "vacation",

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

  SieveGrammar.addTag({
    node: "action/vacation/subject",
    type: "action/vacation/subject",

    requires: "vacation",

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

    requires: "vacation",

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

    requires: "vacation",

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

    requires: "vacation",

    token: ":mime"
  });

  SieveGrammar.addTag({
    node: "action/vacation/handle",
    type: "action/vacation/handle",

    requires: "vacation",

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
