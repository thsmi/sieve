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
    throw new Error("Could not register default Actions");

  SieveGrammar.addAction({
    node: "action/discard",
    type: "action",
    token: "discard"
  });

  SieveGrammar.addAction({
    node: "action/stop",
    type: "action",
    token: "stop"
  });

  SieveGrammar.addAction({
    node: "action/keep",
    type: "action",
    token: "keep"
  });

  SieveGrammar.addAction({
    node: "action/redirect",
    type: "action",
    token: "redirect",

    properties: [{
      id: "parameters",

      elements: [{
        id: "address",

        type: "string",
        value: "\"username@example.com\""
      }]
    }]
  });

  // <"fileinto"> <string> <";">
  SieveGrammar.addAction({
    node: "action/fileinto",
    type: "action",
    token: "fileinto",

    requires: "fileinto",

    properties: [{
      id: "parameters",

      elements: [{
        id: "path",

        type: "string",
        value: "\"INBOX\""
      }]
    }]
  });

})(window);
