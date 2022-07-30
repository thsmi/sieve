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

import { numericField, parameters, id, token } from "../../../toolkit/logic/SieveGrammarHelper.mjs";
import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

// A "vacation-seconds" implies "vacation", and a script with "vacation-seconds"
// in a "require" list can omit "vacation" from that list.
// This means we have to make the vacation action accept both "requires"

const vacationSeconds = {
  extends: "action/vacation",
  requires: { any: ["vacation-seconds", "vacation"] }
};

SieveGrammar.extendAction(vacationSeconds);

SieveGrammar.addTag(
  id("action/vacation/interval/seconds", "action/vacation/interval/", "vacation-seconds"),
  token(":seconds"),
  parameters(
    numericField("seconds", 1000))
);
