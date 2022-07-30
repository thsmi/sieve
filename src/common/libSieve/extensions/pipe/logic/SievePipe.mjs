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
  tags, tag, id, token, all, optional,
  parameters, stringListField, stringField, optionals
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";
import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

// Usage: "pipe" [":try"] <program-name: string> [<arguments: string-list>]
// Usage: "pipe" [":copy"] [":try"] <program-name: string> [<arguments: string-list>]

SieveGrammar.addTag(
  id("action/pipe/try", "action/pipe/", "vnd.dovecot.pipe"),
  token(":try"));

SieveGrammar.addTag(
  id("action/pipe/copy", "action/pipe/", all("copy", "vnd.dovecot.pipe")),
  token(":copy"));

SieveGrammar.addAction(
  id("action/pipe", "action", "vnd.dovecot.pipe"),

  token("pipe"),
  tags(
    tag("copy", "action/pipe/copy"),
    tag("try", "action/pipe/try")),
  parameters(
    stringField("program", "example")),
  optionals("arguments",
    stringListField("arguments")));

// Usage: "filter" <program-name: string> [<arguments: string-list>]
SieveGrammar.addAction(
  id("action/filter", "action", "vnd.dovecot.filter"),

  token("filter"),
  parameters(
    stringField("program", "example"),
    optional(stringListField("arguments")))
);

// Usage: "filter" <program-name: string> [<arguments: string-list>]
SieveGrammar.addTest(
  id("test/filter", "test", "vnd.dovecot.filter"),

  token("filter"),
  parameters(
    stringField("program", "example"),
    optional(stringListField("arguments")))
);



SieveGrammar.addTag(
  id("execute/input/pipe", "execute/input/"),
  token(":pipe")
);

SieveGrammar.addTag(
  id("execute/input/input", "execute/input/", "vnd.dovecot.execute"),

  token(":input"),
  parameters(
    stringField("data"))
);

SieveGrammar.addGroup(
  id("execute/input")
);

SieveGrammar.addTag(
  id("execute/output", "execute/", all("variables", "vnd.dovecot.execute")),

  token(":output"),
  parameters(
    stringField("name")));

// Usage: "execute"
//  [":input" <input-data: string> / ":pipe"]
//  [":output" <varname: string>]
//  <program-name: string> [<arguments: string-list>]

SieveGrammar.addAction(
  id("action/execute", "action", "vnd.dovecot.execute"),

  token("execute"),
  tags(
    tag("input", "execute/input"),
    tag("output", "execute/output")),
  parameters(
    stringField("program", "example")),
  optionals("arguments",
    stringListField("arguments")));

SieveGrammar.addTest(
  id("test/execute", "test", "vnd.dovecot.execute"),

  token("execute"),
  tags(
    tag("input", "execute/input"),
    tag("output", "execute/output")),
  parameters(
    stringField("program", "example")),
  optionals("arguments",
    stringListField("arguments")));
