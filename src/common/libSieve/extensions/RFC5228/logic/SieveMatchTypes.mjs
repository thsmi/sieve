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

import { id, items, token, value } from "../../../toolkit/logic/SieveGrammarHelper.mjs";
import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

// TODO match-type items (matchtype/) should not eat trailing whitespaces...
// this should be done my the match-type group

SieveGrammar.addTag(
  id("match-type/is", "@match-type/"),
  token(":is")
);

SieveGrammar.addTag(
  id("match-type/matches", "@match-type/"),
  token(":matches")
);

SieveGrammar.addTag(
  id("match-type/contains", "@match-type/"),
  token(":contains")
);

SieveGrammar.addGroup(
  id("match-type"),
  items("@match-type/"),
  value(":is")
);
