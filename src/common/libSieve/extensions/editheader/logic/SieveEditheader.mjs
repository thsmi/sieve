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
  tag, attribute, string, stringList, number,
  optionals, parameters, fields, tags
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

SieveGrammar.addTag(
  id("action/addheader/last", "@action/addheader/", "editheader"),
  token(":last")
);

// "addheader" [":last"] <field-name: string> <value: string>
SieveGrammar.addAction(
  id("action/addheader", "@action", "editheader"),

  token("addheader"),
  tags(
    tag("last", "action/addheader/last")),
  parameters(
    string("name", "X-Header"),
    string("value", "Some Value"))
);

// ":index" <fieldno: number> [":last"]
SieveGrammar.addTag(
  id("action/deleteheader/index", "@action/deleteheader/", "editheader"),

  token(":index"),
  // FIXME: should be a parameter instead of a custom field.
  // parameters(
  //   numericField("name", "1"),
  //   optional(tag("last","action/addheader/last")))
  fields("field",
    number("name", "1")),
  optionals(
    attribute("last", "action/addheader/last")
  )
);

// "deleteheader" [":index" <fieldno: number> [":last"]]
//                   [COMPARATOR] [MATCH-TYPE]
//                   <field-name: string>
//                   [<value-patterns: string-list>]

SieveGrammar.addAction(
  id("action/deleteheader", "@action", "editheader"),

  token("deleteheader"),
  tags(
    tag("index", "action/deleteheader/index"),
    tag("match-type", "match-type"),
    tag("comparator", "comparator")),
  parameters(
    string("name", "X-Header")),
  optionals("parameters2",
    stringList("values", ""))
);
