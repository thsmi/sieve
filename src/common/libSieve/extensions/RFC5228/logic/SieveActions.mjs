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

import { parameters, stringField, id, token } from "../../../toolkit/logic/SieveGrammarHelper.mjs";
import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

SieveGrammar.addAction(
  id("action/discard", "action"),
  token("discard")
);

SieveGrammar.addAction(
  id("action/stop", "action"),
  token("stop")
);

SieveGrammar.addAction(
  id("action/keep", "action"),
  token("keep")
);

SieveGrammar.addAction(
  id("action/redirect", "action"),

  token("redirect"),
  parameters(
    stringField("address", "username@example.com"))
);

// <"fileinto"> <string> <";">
SieveGrammar.addAction(
  id("action/fileinto", "action", "fileinto"),

  token("fileinto"),
  parameters(
    stringField("path", "INBOX"))
);
