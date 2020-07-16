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

const _return = {
  node: "action/return",
  type: "action",
  token: "return",

  requires: "include"
};

SieveGrammar.addAction(_return);


const _global = {
  node: "action/global",
  type: "action",
  token: "global",

  requires: { all: ["include", "variables"] },

  properties: [{
    id: "parameters",

    elements: [{
      id: "variables",

      type: "stringlist",
      value: '"Example"'
    }]
  }]
};

SieveGrammar.addAction(_global);


const _once = {
  node: "action/include/once",
  type: "action/include/once",

  requires: "include",

  token: ":once"
};

SieveGrammar.addTag(_once);


const _optional = {
  node: "action/include/optional",
  type: "action/include/optional",

  requires: "include",

  token: ":optional"
};

SieveGrammar.addTag(_optional);


const globallocation = {
  node: "tag/location-type/global",
  type: "tag/location-type/",

  token: ":global"
};

SieveGrammar.addTag(globallocation);


const personallocation = {
  node: "tag/location-type/personal",
  type: "tag/location-type/",

  token: ":personal"
};

SieveGrammar.addTag(personallocation);


SieveGrammar.addGroup({
  node: "tag/location-type",
  type: "tag/location-type",

  value: ":personal",

  items: ["tag/location-type/"]
});


const _include = {
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

SieveGrammar.addAction(_include);
