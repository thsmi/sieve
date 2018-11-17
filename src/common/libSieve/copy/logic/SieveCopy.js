/*
 * The contents of this file are licenced. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

/* global window */

(function () {

  "use strict";

  /* global SieveGrammar */

  if (!SieveGrammar)
    throw new Error("Could not register copy");

  // "fileinto" [":copy"] <folder: string>
  let fileintocopy = {
    node: "action/fileinto/copy",
    type: "action/fileinto/",

    requires: "copy",

    token: ":copy"
  };

  SieveGrammar.addTag(fileintocopy);

  let fileinto = {
    extends: "action/fileinto",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "copy",
        type: "action/fileinto/copy",
        requires: "copy"
      }]
    }]
  };

  SieveGrammar.extendAction(fileinto);

  // "redirect" [":copy"] <address: string>
  let redirectcopy = {
    node: "action/redirect/copy",
    type: "action/redirect/",

    requires: "copy",

    token: ":copy"
  };

  SieveGrammar.addTag(redirectcopy);

  let redirect = {
    extends: "action/redirect",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "copy",
        type: "action/redirect/copy",
        requires: "copy"
      }]
    }]
  };

  SieveGrammar.extendAction(redirect);

})(window);
