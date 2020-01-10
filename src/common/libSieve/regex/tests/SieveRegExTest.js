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
    suite.log("Reg Ex unit tests...");
  });


  suite.add(function () {
    suite.log("Parse :regex match-type with single import");

    const script =
      'require "regex";\r\n'
      + 'if header :regex "Sender" "owner-ietf-mta-filters@imc.org" \r\n'
      + '{\r\n'
      + '  keep; \r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["regex"]);
  });

  suite.add(function () {

    suite.log("Parse :regex match-type with multiple import");

    const script =
      'require ["regex", "fileinto"];\r\n'
      + 'if address :comparator "i;ascii-casemap" :regex ["to", "cc"] "j(i|la).*@mydomain.com"\r\n'
      + '{\r\n'
      + '  fileinto "INBOX";\r\n'
      + '  stop;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["regex", "fileinto"]);
  });

})();

