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

  parameters, tags, items,
  tag, string, stringList,

  insert,
  all
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

// Usage:  notify
//           [":from" string]
//           [":importance" <"1" / "2" / "3">]
//           [":options" string-list]
//           [":message" string]
//           <method: string>

SieveGrammar.addAction(
  id("action/notify", "@action", "enotify"),

  token("notify"),
  tags(
    tag("from", "action/notify/from"),
    tag("importance", "action/notify/importance"),
    tag("options", "action/notify/options"),
    tag("message", "action/notify/message")),
  parameters(
    string("method"))
);

SieveGrammar.addTag(
  id("action/notify/from", "@action/notify/from"),

  token(":from"),
  parameters(
    string("from")));

SieveGrammar.addTag(
  id("action/notify/importance", "@action/notify/importance"),

  token(":importance"),
  parameters(
    string("importance", "2")));

SieveGrammar.addTag(
  id("action/notify/options", "@action/notify/options"),

  token(":options"),
  parameters(
    stringList("options")));

SieveGrammar.addTag(
  id("action/notify/message", "@action/notify/message"),

  token(":message"),

  parameters(
    string("message")));

// Test valid_notify_method
// Usage:  valid_notify_method
//           <notification-uris: string-list>
SieveGrammar.addTest(
  id("test/valid_notify_method", "@test", "enotify"),

  token("valid_notify_method"),
  parameters(
    stringList("uris", "stringlist", "Example")));

// Test notify_method_capability
// Usage:  notify_method_capability
//            [COMPARATOR] [MATCH-TYPE]
//            <notification-uri: string>
//            <notification-capability: string>
//            <key-list: string-list>

SieveGrammar.addTest(
  id("test/notify_method_capability", "@test", "enotify"),

  token("notify_method_capability"),
  tags(
    tag("match-type", "comparator")),
  parameters(
    string("uri"),
    string("capability", "online"),
    stringList("keys", "yes")));


//  Usage:  ":encodeurl"
//
// :encodeurl modifier to the 'set' Action
//
// requires variables and enotify and has a
// has precedence of 15.

SieveGrammar.addTag(
  id("modifier/15/encodeurl", "@modifier/15/", all("variables", "enotify")),
  token(":encodeurl")
);

SieveGrammar.addGroup(
  id("modifier/15", "@modifier/"),
  items("@modifier/15/")
);

SieveGrammar.extendAction(
  "action/set",
  insert(tags(tag("modifier/15")))
);
