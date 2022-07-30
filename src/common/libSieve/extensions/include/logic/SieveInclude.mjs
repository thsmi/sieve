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
  parameters, stringListField, stringField,
  tags, tag, id, token
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";


SieveGrammar.addAction(
  id("action/return", "action", "include"),
  token("return")
);

// global <value: string-list>
SieveGrammar.addAction(
  id("action/global", "action", { all: ["include", "variables"] }),

  token("global"),
  parameters(
    stringListField("variables", "Example")));


SieveGrammar.addTag(
  id("action/include/once", "action/include/once", "include"),
  token(":once"));


SieveGrammar.addTag(
  id("action/include/optional", "action/include/optional", "include"),
  token(":optional"));


SieveGrammar.addTag(
  id("tag/location-type/global", "tag/location-type/", "include"),
  token(":global")
);

SieveGrammar.addTag(
  id("tag/location-type/personal", "tag/location-type/", "include"),
  token(":personal"));


SieveGrammar.addGroup(
  id("tag/location-type"),
  { value: ":personal" }
);


// include [LOCATION] [":once"] [":optional"] <value: string>

SieveGrammar.addAction(
  id("action/include", "action", "include"),

  token("include"),
  tags(
    tag("location", "tag/location-type"),
    tag("once", "action/include/once"),
    tag("optional", "action/include/optional")),
  parameters(
    stringField("script", "Example")));
