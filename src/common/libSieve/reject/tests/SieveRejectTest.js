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
    suite.log("Sieve Reject (RFC5429) unit tests...");
  });

  suite.add(function () {

    suite.log("Example 1");

    const script =
      'require ["ereject"];\r\n'
      + '\r\n'
      + 'if address "from" "someone@example.com" {\r\n'
      + '    ereject "I no longer accept mail from this address";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["ereject"]);
  });

  suite.add(function () {

    suite.log("Example 2");

    const script =
      'require ["reject"];\r\n'
      + '\r\n'
      + 'if size :over 100K {\r\n'
      + '  reject text:\r\n'
      + 'Your message is too big.  If you want to send me a big attachment,\r\n'
      + 'put it on a public web site and send me a URL.\r\n'
      + '.\r\n'
      + ';\r\n'
      + '}\r\n';


    suite.expectValidScript(script, ["reject"]);
  });


  suite.add(function () {

    suite.log("Example 3");

    const script =
      'require ["reject"];\r\n'
      + '\r\n'
      + 'if header :contains "from" "coyote@desert.example.org" {\r\n'
      + '    reject text:\r\n'
      + 'I am not taking mail from you, and I don\'t\r\n'
      + 'want your birdseed, either!\r\n'
      + '.\r\n'
      + ';\r\n'
      + '}\r\n';


    suite.expectValidScript(script, ["reject"]);
  });

})();
