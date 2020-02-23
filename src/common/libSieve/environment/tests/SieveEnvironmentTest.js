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

  /* global net */

  const suite = net.tschmid.yautt.test;

  if (!suite)
    throw new Error("Could not initialize test suite");

  suite.add(function () {
    suite.log("Environment Tests...");
  });

  suite.add(function () {

    suite.log("Example 1");

    const script = ''
      + 'require "environment";\r\n'
      + 'if environment :contains "item" "" { keep; }';

    suite.expectValidScript(script, ["environment"]);
  });

  suite.add(function () {

    suite.log("Example 2");

    const script = ''
      + 'require "environment";\r\n'
      + 'if environment :matches "remote-host" "*.example.com" { keep; }';

    suite.expectValidScript(script, ["environment"]);
  });

  suite.add(function () {
    suite.log("Validate environment test constructor");

    const snippet = 'environment "domain" "imap.example.com"';
    suite.expectValidSnippet("test/environment", snippet, ["environment"]);
  });
})();
