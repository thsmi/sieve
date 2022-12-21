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
  tags, parameters,
  stringList, string, optional, tag,
  insert, before
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

// Flags and keywords are defined in http://tools.ietf.org/html/rfc5788

// Inject :flags into  fileinto
// :flags" <list-of-flags: string-list>
SieveGrammar.addTag(
  id("action/fileinto/flags", "@action/fileinto/", "imap4flags"),

  token(":flags"),
  parameters(
    stringList("flags", ["\\\\Flagged"]))
);

SieveGrammar.extendAction(
  "action/fileinto",
  insert(
    tags(tag("flags", "action/fileinto/flags", "imap4flags")),
    before(parameters()))
);

// Inject :flags into keep
SieveGrammar.addTag(
  id("action/keep/flags", "@action/keep/", "imap4flags"),

  token(":flags"),
  parameters(
    stringList("flags", ["\\\\Flagged"]))
);

SieveGrammar.extendAction(
  "action/keep",
  insert(
    tags(tag("flags", "action/keep/flags", "imap4flags")),
    before(parameters()))
);

// Usage:   setflag [<variablename: string>]  <list-of-flags: string-list>
SieveGrammar.addAction(
  id("action/setflag", "@action", "imap4flags"),

  token("setflag"),
  parameters(
    optional(stringList("variable"), "variables"),
    stringList("flags", ["\\\\Flagged"]))
);

//     Usage:   addflag [<variablename: string>]
//            <list-of-flags: string-list>
SieveGrammar.addAction(
  id("action/addflag", "@action", "imap4flags"),

  token("addflag"),
  parameters(
    optional(string("variable"), "variables"),
    stringList("flags", ["\\\\Flagged"]))
);


//  Usage:   removeflag [<variablename: string>]
//         <list-of-flags: string-list>

SieveGrammar.addAction(
  id("action/removeflag", "@action", "imap4flags"),

  token("removeflag"),

  parameters(
    optional(string("variable"), "variables"),
    stringList("flags", ["\\\\Flagged"]))
);


//     Usage: hasflag [MATCH-TYPE] [COMPARATOR]
//          [<variable-list: string-list>]
//          <list-of-flags: string-list>
SieveGrammar.addTest(
  id("test/hasflag", "@test", "imap4flags"),

  token("hasflag"),
  tags(
    tag("match-type"),
    tag("comparator")),
  parameters(
    optional(stringList("variables"), "variables"),
    stringList("flags", ["\\\\Flagged"]))
);
