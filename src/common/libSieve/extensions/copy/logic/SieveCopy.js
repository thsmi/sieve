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

// "fileinto" [":copy"] <folder: string>
const fileintocopy = {
  node: "action/fileinto/copy",
  type: "action/fileinto/",

  requires: "copy",

  token: ":copy"
};

SieveGrammar.addTag(fileintocopy);

const fileinto = {
  extends: "action/fileinto",

  properties: [{
    id: "tags",
    optional: true,

    elements: [{
      id: "copy",
      type: "action/fileinto/copy",
      requires: "copy"
    }]
  }]
};

SieveGrammar.extendAction(fileinto);

// "redirect" [":copy"] <address: string>
const redirectcopy = {
  node: "action/redirect/copy",
  type: "action/redirect/",

  requires: "copy",

  token: ":copy"
};

SieveGrammar.addTag(redirectcopy);

const redirect = {
  extends: "action/redirect",

  properties: [{
    id: "tags",
    optional: true,

    elements: [{
      id: "copy",
      type: "action/redirect/copy",
      requires: "copy"
    }]
  }]
};

SieveGrammar.extendAction(redirect);
