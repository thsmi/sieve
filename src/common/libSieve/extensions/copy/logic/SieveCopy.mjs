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

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

import {
  tags, tag, id, token
} from "./../../../toolkit/logic/SieveGrammarHelper.mjs";

// "fileinto" [":copy"] <folder: string>
SieveGrammar.addTag(
  id("action/fileinto/copy", "@action/fileinto/", "copy"),
  token(":copy")
);

const fileinto = {
  extends: "action/fileinto",

  properties: [
    tags(
      tag("copy", "action/fileinto/copy", "copy"))
  ]
};

SieveGrammar.extendAction(fileinto);

// "redirect" [":copy"] <address: string>
SieveGrammar.addTag(
  id("action/redirect/copy", "@action/redirect/", "copy"),
  token(":copy")
);

const redirect = {
  extends: "action/redirect",

  properties: [
    tags(
      tag("copy", "action/redirect/copy", "copy"))
  ]
};

SieveGrammar.extendAction(redirect);
