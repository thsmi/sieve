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
  id, token,
  string, parameters
} from "./../../../toolkit/logic/SieveGrammarHelper.mjs";

// Usage: debug_log <message: string>

SieveGrammar.addAction(
  id("action/debug_log", "@action", "vnd.dovecot.debug"),
  token("debug_log"),
  parameters(
    string("message"))
);
