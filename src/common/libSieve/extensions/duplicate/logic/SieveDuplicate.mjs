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
  stringField, numericField, parameters,
  tag, tags, token, id
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

const DEFAULT_TIMEOUT = 600;

/* Usage: "duplicate" [":handle" <handle: string>]
[":header" <header-name: string> /
    ":uniqueid" <value: string>]
[":seconds" <timeout: number>] [":last"] */

SieveGrammar.addTest(
  id("test/duplicate", "test", "duplicate"),
  token("duplicate"),
  tags(
    tag("handle", "test/duplicate/handle"),
    tag("unique", "test/duplicate/unique"),
    tag("seconds", "test/duplicate/seconds"),
    tag("last", "test/duplicate/last")));

SieveGrammar.addTag(
  id("test/duplicate/last", "test/duplicate/", "duplicate"),
  token(":last")
);

// ":handle" <handle: string>
SieveGrammar.addTag(
  id("test/duplicate/handle", "test/duplicate/", "duplicate"),

  token(":handle"),
  parameters(
    stringField("handle"))
);


// uniqueid/header
SieveGrammar.addTag(
  id("test/duplicate/unique/header", "test/duplicate/unique/", "duplicate"),

  token(":header"),
  parameters(
    stringField("header"))
);

// uniqueid/id
SieveGrammar.addTag(
  id("test/duplicate/unique/id", "test/duplicate/unique/", "duplicate"),

  token(":uniqueid"),
  parameters(
    stringField("uniqueid"))
);


SieveGrammar.addGroup(
  id("test/duplicate/unique")
);

// seconds
SieveGrammar.addTag(
  id("test/duplicate/seconds", "test/duplicate/seconds/", "duplicate"),

  token(":seconds"),
  parameters(
    numericField("timeout", DEFAULT_TIMEOUT))
);
