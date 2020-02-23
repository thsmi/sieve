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
    throw new Error("Could not register MatchTypes");

  SieveGrammar.addTag({
    node: "match-type/regex",
    type: "match-type/",

    requires: "regex",

    token: ":regex"
  });

})(window);
