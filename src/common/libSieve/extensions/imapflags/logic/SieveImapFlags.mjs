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
  stringListField, stringField,
  parameters, optional,
  tag, tags, id, token
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

// Flags and keywords are defined in http://tools.ietf.org/html/rfc5788

// Inject :flags into  fileinto
// :flags" <list-of-flags: string-list>
SieveGrammar.addTag(
  id("action/fileinto/flags", "action/fileinto/", "imap4flags"),

  token(":flags"),
  parameters(
    stringListField("flags", ["\\\\Flagged"]))
);

SieveGrammar.extendAction({
  extends: "action/fileinto",

  properties: [
    tags(
      tag("flags", "action/fileinto/flags", "imap4flags"))
  ]
});

// Inject :flags into keep
SieveGrammar.addTag(
  id("action/keep/flags", "action/keep/", "imap4flags"),

  token(":flags"),
  parameters(
    stringListField("flags", ["\\\\Flagged"]))
);

SieveGrammar.extendAction({
  extends: "action/keep",

  properties: [
    tags(
      tag("flags", "action/keep/flags", "imap4flags"))
  ]
});

// Usage:   setflag [<variablename: string>]  <list-of-flags: string-list>
SieveGrammar.addAction(
  id("action/setflag", "action", "imap4flags"),

  token("setflag"),
  parameters(
    optional(stringListField("variablename"), "variables"),
    stringListField("flags", ["\\\\Flagged"]))
);

//     Usage:   addflag [<variablename: string>]
//            <list-of-flags: string-list>
SieveGrammar.addAction(
  id("action/addflag", "action", "imap4flags"),

  token("addflag"),
  parameters(
    optional(stringField("variablename"), "variables"),
    stringListField("flags", ["\\\\Flagged"]))
);


//  Usage:   removeflag [<variablename: string>]
//         <list-of-flags: string-list>

SieveGrammar.addAction(
  id("action/removeflag", "action", "imap4flags"),

  token("removeflag"),

  parameters(
    optional(stringField("variablename"), "variables"),
    stringListField("flags", ["\\\\Flagged"]))
);


//     Usage: hasflag [MATCH-TYPE] [COMPARATOR]
//          [<variable-list: string-list>]
//          <list-of-flags: string-list>
SieveGrammar.addTest(
  id("test/hasflag", "test", "imap4flags"),

  token("hasflag"),
  tags(
    tag("match-type"),
    tag("comparator")),
  parameters(
    optional(stringListField("variables"), "variables"),
    stringListField("flags", ["\\\\Flagged"])));
