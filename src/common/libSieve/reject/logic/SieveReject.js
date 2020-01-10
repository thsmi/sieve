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

(function () {

  "use strict";

  /* global SieveGrammar */

  if (!SieveGrammar)
    throw new Error("Could not register Reject Grammar");

  const reject = {
    node: "action/reject",
    type: "action",
    token: "reject",

    requires: "reject",

    properties: [{
      id: "parameters",

      elements: [{
        id: "reason",
        type: "string",
        value: "text:\r\n.\r\n"
      }]
    }]
  };

  SieveGrammar.addAction(reject);


  const ereject = {
    node: "action/ereject",
    type: "action",
    token: "ereject",

    requires: "ereject",

    properties: [{
      id: "parameters",

      elements: [{
        id: "reason",
        type: "string",
        value: "text:\r\n.\r\n"
      }]
    }]
  };

  SieveGrammar.addAction(ereject);

})(window);
