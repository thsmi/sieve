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
  tags, parameters, items,
  tag, number, stringList, string
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

const DEFAULT_DAYS = 7;

SieveGrammar.addAction(
  id("action/vacation", "@action", "vacation"),

  token("vacation"),
  tags(
    tag("interval", "action/vacation/interval"),
    tag("subject", "action/vacation/subject"),
    tag("from", "action/vacation/from"),
    tag("addresses", "action/vacation/addresses"),
    tag("mime", "action/vacation/mime"),
    tag("handle", "action/vacation/handle")),
  parameters(
    string("reason"))
);


SieveGrammar.addTag(
  id("action/vacation/interval/days", "@action/vacation/interval/"),

  token(":days"),
  parameters(
    number("days", DEFAULT_DAYS))
);

SieveGrammar.addGroup(
  id("action/vacation/interval"),
  items("@action/vacation/interval/")
);

SieveGrammar.addTag(
  id("action/vacation/subject", "@action/vacation/subject"),

  token(":subject"),
  parameters(
    string("subject"))
);

SieveGrammar.addTag(
  id("action/vacation/from", "@action/vacation/from"),

  token(":from"),
  parameters(
    string("from"))
);

SieveGrammar.addTag(
  id("action/vacation/addresses", "@action/vacation/addresses"),

  token(":addresses"),
  parameters(
    stringList("addresses"))
);

SieveGrammar.addTag(
  id("action/vacation/mime", "@action/vacation/mime"),
  token(":mime")
);

SieveGrammar.addTag(
  id("action/vacation/handle", "@action/vacation/handle"),

  token(":handle"),
  parameters(
    string("handle"))
);
