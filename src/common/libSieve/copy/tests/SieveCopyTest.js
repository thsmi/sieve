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

  let suite = net.tschmid.yautt.test;

  if (!suite)
    throw new Error("Could not initialize test suite");

  suite.add(function () {
    suite.log("Copy Unit Tests...");
  });

  suite.add(function () {

    suite.log("RFC 3894 - Example I");

    let script = ""
      + 'require ["copy", "fileinto"];\r\n'
      + 'fileinto :copy "incoming";\r\n';

    suite.expectValidScript(script, ["copy", "fileinto"]);
  });

  suite.add(function () {

    suite.log("RFC 3894 - Example Ia");

    let script = ""
      + 'require ["fileinto"];\r\n'
      + 'fileinto :copy "incoming";\r\n';

    suite.expectInvalidScript(script, 'Error: Unknown or incompatible type >>string/<< at >>:copy "inc', ["fileinto"]);
  });

})();
