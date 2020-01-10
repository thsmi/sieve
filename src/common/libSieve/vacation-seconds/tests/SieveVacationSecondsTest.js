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
    suite.log("Vacation Seconds Unit Tests...");
  });

  suite.add(function () {
    suite.log("Parse Vacation Seconds Example 1");

    const script = ''
      + 'require ["vacation-seconds"];\r\n'
      + 'vacation :addresses ["tjs@example.edu", "ts4z@landru.example.edu"]\r\n'
      + '         :seconds 1800\r\n'
      + '         "I am in a meeting, and do not have access to email.";\r\n';

    suite.expectValidScript(script, ["vacation-seconds"]);
  });

  suite.add(function () {
    suite.log("Parse Vacation Seconds Example 2");

    const script = ''
      + 'require ["vacation-seconds"];\r\n'
      + '\r\n'
      + 'vacation :handle "auto-resp" :seconds 0\r\n'
      + '    "Your request has been received.  A service\r\n'
      + '     representative will contact you as soon as\r\n'
      + '     possible, usually within one business day.";\r\n';

    suite.expectValidScript(script, ["vacation-seconds"]);
  });

})();
