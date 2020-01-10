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

(function () {

  "use strict";

  /* global net */

  const suite = net.tschmid.yautt.test;

  if (!suite)
    throw new Error("Could not initialize test suite");

  suite.add(function () {
    suite.log("RFC5228 unit tests...");
  });

  suite.add(function () {
    suite.log("Test header constructors");

    const snipplet = 'header "Subject" "Example"';
    suite.expectValidSnipplet("test/header", snipplet);
  });

  // :comparator "i;ascii-casemap"

})();

