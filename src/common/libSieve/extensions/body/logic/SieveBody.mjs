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
  tags, stringListField, parameters, tag
} from "./../../../toolkit/logic/SieveGrammarHelper.mjs";

// "body" [COMPARATOR] [MATCH-TYPE] [BODY-TRANSFORM] <key-list: string-list>

SieveGrammar.addTest(
  id("test/body", "@test", "body"),
  token("body"),
  tags(
    tag("body-transform"),
    tag("match-type"),
    tag("comparator")),
  parameters(
    stringListField("keys", 'Example'))
);

// -------------------------------------------------------------------------//

SieveGrammar.addTag(
  id("body-transform/raw", "@body-transform/", "body"),

  token(":raw")
);

SieveGrammar.addTag(
  id("body-transform/content", "@body-transform/", "body"),

  token(":content"),
  parameters(
    stringListField("contentType"))
);

SieveGrammar.addTag(
  id("body-transform/text", "@body-transform/", "body"),

  token(":text")
);

// ----------------------------------------------------------------------------

SieveGrammar.addGroup(
  id("body-transform"),
  { value: ":text" }
);

