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

import { id, token, parameters, string } from "../../../toolkit/logic/SieveGrammarHelper.mjs";
import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";


SieveGrammar.addAction(
  id("action/reject", "@action", "reject"),

  token("reject"),
  parameters(
    // FIXME initialize this with a multi line string...
    string("reason"))
);


SieveGrammar.addAction(
  id("action/ereject", "@action", "ereject"),

  token("ereject"),
  parameters(
    // FIXME initialize this with a multi line string...
    string("reason"))
);
