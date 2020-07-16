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

// Usage:  foreverypart [":name" string] block

// Usage:  break [":name" string];

// The definition of [MIMEOPTS] is:
// Syntax:  ":type" / ":subtype" / ":contenttype" / ":param" <param-list: string-list>

SieveGrammar.addTag({
  node: "mimeopts/type",
  type: "mimeopts/",

  // fixme
  requires: "body",

  token: ":type"
});

SieveGrammar.addTag({
  node: "mimeopts/subtype",
  type: "mimeopts/",

  // fixme
  requires: "body",

  token: ":subtype"
});

SieveGrammar.addTag({
  node: "mimeopts/contenttype",
  type: "mimeopts/",

  // fixme
  requires: "body",

  token: ":contenttype"
});

SieveGrammar.addTag({
  node: "mimeopts/param",
  type: "mimeopts/",

  // fixme
  requires: "body",

  token: ":param",

  properties: [{
    id: "parameters",

    elements: [{
      id: "time-zone",
      type: "string",

      value: '"+0100"'
    }]
  }]
});

SieveGrammar.addGroup({
  node: "mimeopts",
  type: "mimeopts",

  // fixme what is the default
  value: ":text",

  items: ["mimeopts/"]
});

// Usage:  header [":mime"] [":anychild"] [MIMEOPTS]
// [COMPARATOR] [MATCH-TYPE]
// <header-names: string-list> <key-list: string-list>

SieveGrammar.extendTest({
  extends: "test/header",

  properties: [{
    id: "tags",
    optional: true,

    elements: [{
    }]
  }]
});

// Usage:  address [":mime"] [":anychild"] [COMPARATOR]
// [ADDRESS-PART] [MATCH-TYPE]
// <header-list: string-list> <key-list: string-list>

SieveGrammar.extendTest({
  extends: "test/address",

  properties: [{
    id: "tags",
    optional: true,

    elements: [{
    }]
  }]
});


// Usage:  exists [":mime"] [":anychild"] <header-names: string-list>
SieveGrammar.extendTest({
  extends: "test/exists",

  properties: [{
    id: "tags",
    optional: true,

    elements: [{
    }]
  }]
});

// Usage:  replace [":mime"] [":subject" string] [":from" string]
// <replacement: string>

// Usage:  enclose <:subject string> <:headers string-list> string

// Usage:  extracttext [MODIFIER] [":first" number] <varname: string>

