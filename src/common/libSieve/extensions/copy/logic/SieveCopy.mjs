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
  tags, tag, id, token, parameters, insert, before
} from "./../../../toolkit/logic/SieveGrammarHelper.mjs";

// "fileinto" [":copy"] <folder: string>
SieveGrammar.addTag(
  id("action/fileinto/copy", "@action/fileinto/", "copy"),
  token(":copy")
);

SieveGrammar.extendAction(
  "action/fileinto",
  insert(
    tags(tag("copy", "action/fileinto/copy", "copy")),
    before(parameters()))
);

// "redirect" [":copy"] <address: string>
SieveGrammar.addTag(
  id("action/redirect/copy", "@action/redirect/", "copy"),
  token(":copy")
);

SieveGrammar.extendAction(
  "action/redirect",
  insert(
    tags(tag("copy", "action/redirect/copy", "copy")),
    before(parameters()))
);
