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

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.js";

const vacationSeconds = {
  extends: "action/vacation",
  requires: { any: ["vacation-seconds", "vacation"] }
};

SieveGrammar.extendAction(vacationSeconds);

SieveGrammar.addTag({
  node: "action/vacation/interval/seconds",
  type: "action/vacation/interval/",

  token: ":seconds",

  requires: "vacation-seconds",

  properties: [{
    id: "parameters",

    elements: [{
      id: "seconds",
      type: "number",
      value: '1800'
    }]
  }]
});
