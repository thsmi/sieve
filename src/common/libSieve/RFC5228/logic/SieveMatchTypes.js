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

  let _is = {
    node: "match-type/is",
    type: "match-type/",

    token: ":is"
  };

  // TODO match-type items (matchtype/) should not eat tailing whitespaces...
  // they this should be done my the match-type goup

  SieveGrammar.addTag(_is);

  let _matches = {
    node: "match-type/matches",
    type: "match-type/",

    token: ":matches"
  };

  SieveGrammar.addTag(_matches);

  let _contains = {
    node: "match-type/contains",
    type: "match-type/",

    token: ":contains"
  };

  SieveGrammar.addTag(_contains);

  let matchtype = {
    node: "match-type",
    type: "match-type",

    value: ":is",

    items: ["match-type/"]
  };

  SieveGrammar.addGroup(matchtype);

})(window);
