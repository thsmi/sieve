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

import {
  id, token,
  tags, parameters,
  tag, string,
  insert
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";
import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

// spamtest [":percent"] [COMPARATOR] [MATCH-TYPE] <value: string>
SieveGrammar.addTest(

  // spamtestplus implies spamtest...
  // ... this means we prefer spamtestplus, but
  // if we endup with spamtest it is also ok.

  id("test/spamtest", "@test", { any: ["spamtestplus", "spamtest"] }),

  token("spamtest"),
  tags(
    tag("comparator"),
    tag("match-type")),
  parameters(
    string("value", "1"))
);

SieveGrammar.addTag(
  id("test/spamtestplus/percent", "@test/spamtestplus/percent", "spamtestplus"),
  token(":percent")
);

// TODO no need to extend this here could be done directly in add test...
SieveGrammar.extendTest(
  "test/spamtest",
  insert(
    tags(tag("percent", "test/spamtestplus/percent", "spamtestplus")))
);

// virustest [COMPARATOR] [MATCH-TYPE] <value: string>
SieveGrammar.addTest(
  id("test/virustest", "@test", "virustest"),

  token("virustest"),
  tags(
    tag("comparator"),
    tag("match-type")),
  parameters(
    string("value", "1"))
);

