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

/* global window */

(function () {

  "use strict";

  /* global SieveGrammar */

  if (!SieveGrammar)
    throw new Error("Could not register MatchTypes");

  // TODO match-type items (matchtype/) should not eat tailing whitespaces...
  // they this should be done my the match-type goup

  SieveGrammar.addTag({
    node: "match-type/is",
    type: "match-type/",

    token: ":is"
  });

  SieveGrammar.addTag({
    node: "match-type/matches",
    type: "match-type/",

    token: ":matches"
  });

  SieveGrammar.addTag({
    node: "match-type/contains",
    type: "match-type/",

    token: ":contains"
  });

  SieveGrammar.addGroup({
    node: "match-type",
    type: "match-type",

    value: ":is",

    items: ["match-type/"]
  });

})(window);
