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
  tags, items, parameters,
  tag, string, stringList
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

// set [MODIFIER] <name: string> <value: string>

SieveGrammar.addAction(
  id("action/set", "@action", "variables"),

  token("set"),
  tags(
    tag("modifier/10"),
    tag("modifier/20"),
    tag("modifier/30"),
    tag("modifier/40")),
  parameters(
    string("name", "variable"),
    string("value")));

// string [MATCH-TYPE] [COMPARATOR] <source: string-list> <key-list: string-list>
SieveGrammar.addTest(
  id("test/string", "@test", "variables"),

  token("string"),
  tags(
    tag("match-type"),
    tag("comparator")),
  parameters(
    stringList("sources", "${somevariable}"),
    stringList("keys", "some value"))
);


SieveGrammar.addTag(
  id("modifier/40/lower", "@modifier/40/", "variables"),
  token(":lower")
);

SieveGrammar.addTag(
  id("modifier/40/upper", "@modifier/40/", "variables"),
  token(":upper")
);

SieveGrammar.addGroup(
  id("modifier/40", "@modifier/"),
  items("@modifier/40/")
);


SieveGrammar.addTag(
  id("modifier/30/lowerfirst", "@modifier/30/", "variables"),
  token(":lowerfirst")
);

SieveGrammar.addTag(
  id("modifier/30/upperfirst", "@modifier/30/", "variables"),
  token(":upperfirst")
);

SieveGrammar.addGroup(
  id("modifier/30", "@modifier/"),
  items("@modifier/30/")
);

SieveGrammar.addTag(
  id("modifier/20/quotewildcard", "@modifier/20/", "variables"),
  token(":quotewildcard")
);

SieveGrammar.addGroup(
  id("modifier/20", "@modifier/"),
  items("@modifier/20/")
);


SieveGrammar.addTag(
  id("modifier/10/length", "@modifier/10/", "variables"),
  token(":length")
);

SieveGrammar.addGroup(
  id("modifier/10", "@modifier/"),
  items("@modifier/10/")
);


SieveGrammar.addGroup(
  id("modifier", "@modifier"),
  items("@modifier/")
);
