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


/* global net */

const suite = net.tschmid.yautt.test;

if (!suite)
  throw new Error("Could not initialize test suite");

suite.description("RFC5228 unit tests...");

suite.add("Test header constructors", () => {

  const snippet = 'header "Subject" "Example"';
  suite.expectValidSnippet("test/header", snippet);
});

// :comparator "i;ascii-casemap"
