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
  string, stringList, tag,
  parameters, tags
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

// Usage:   environment [COMPARATOR] [MATCH-TYPE] <name: string> <key-list: string-list>

SieveGrammar.addTest(
  id("test/environment", "@test", "environment"),
  token("environment"),
  tags(
    tag("match-type"),
    tag("comparator")),
  parameters(
    string("name", "domain"),
    stringList("keys", "imap.example.com")));
