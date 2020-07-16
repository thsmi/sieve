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

// spamtest [":percent"] [COMPARATOR] [MATCH-TYPE] <value: string>
SieveGrammar.addTest({
  node: "test/spamtest",
  type: "test",

  // spamtestplus implies spamtest...
  // ... this means we prefer spamtestplus, but
  // if we endup with spamtest it is also ok.

  requires: { any: ["spamtestplus", "spamtest"] },

  token: "spamtest",

  properties: [{
    id: "tags",
    optional: true,

    elements: [{
      id: "comparator",
      type: "comparator"
    }, {
      id: "match-type",
      type: "match-type"
    }]
  }, {
    id: "parameters",

    elements: [{
      id: "value",
      type: "string",
      value: '"1"'
    }]
  }]
});

SieveGrammar.addTag({
  node: "test/spamtestplus/percent",
  type: "test/spamtestplus/percent",

  requires: "spamtestplus",

  token: ":percent"
});

SieveGrammar.extendTest({
  extends: "test/spamtest",

  properties: [{
    id: "tags",
    optional: true,

    elements: [{
      id: "percent",
      type: "test/spamtestplus/percent",

      requires: "spamtestplus"
    }]
  }]
});

// virustest [COMPARATOR] [MATCH-TYPE] <value: string>
SieveGrammar.addTest({
  node: "test/virustest",
  type: "test",

  requires: "virustest",

  token: "virustest",

  properties: [{
    id: "tags",
    optional: true,

    elements: [{
      id: "comparator",
      type: "comparator"
    }, {
      id: "match-type",
      type: "match-type"
    }]
  }, {
    id: "parameters",

    elements: [{
      id: "value",
      type: "string",
      value: '"1"'
    }]
  }]
});

