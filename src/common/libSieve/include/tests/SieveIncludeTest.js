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
    suite.log("Sieve Include (RFC6609) unit tests...");
  });

  suite.add(function () {

    suite.log("return test");

    const script =
      'require "include";\r\n'
      + 'return;\r\n';

    suite.expectValidScript(script, ["include"]);
  });

  suite.add(function () {

    suite.log("include ambigious location ");

    const script =
      'require ["include"];\r\n'
      + '\r\n'
      + 'include :personal :global "always_allow";\r\n';

    const exception = "Error: Unknown or incompatible type >>string/<< at >>:global";

    suite.expectInvalidScript(script, exception, ["include"]);
  });


  suite.add(function () {

    suite.log("include multiple scripts");

    const script =
      'require ["include"];\r\n'
      + '\r\n'
      + 'include :personal "always_allow";\r\n'
      + 'include :global "spam_tests";\r\n'
      + 'include :personal "spam_tests";\r\n'
      + 'include :personal "mailing_lists";\r\n';

    suite.expectValidScript(script, ["include"]);
  });

  suite.add(function () {

    suite.log("include test2");

    const script =
      'require [ "include", "variables" ];\r\n'
      + 'global "test";\r\n'
      + 'global "test_mailbox";\r\n'
      + '\r\n'
      + '#set "test" "$$";\r\n'
      + 'include "subject_tests";\r\n'
      + '\r\n'
      + '#set "test" "Make money";\r\n'
      + 'include "subject_tests";\r\n'
      + '\r\n'
      + '#if string :count "eq" "${test_mailbox}" "1"\r\n'
      + '#{\r\n'
      + '#    fileinto "${test_mailbox}";\r\n'
      + '    stop;\r\n'
      + '#}\r\n';

    suite.expectValidScript(script, ["include", "variables"]);
  });

  suite.add(function () {

    suite.log("multiple globals");

    const script =
      'require ["include", "variables"];\r\n'
      + 'global ["test", "test_mailbox"];\r\n'
      + '\r\n'
      + 'if header :contains "Subject" "${test}"\r\n'
      + '{\r\n'
      + '#    set "test_mailbox" "spam-${test}";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["include", "variables"]);
  });


  suite.add(function () {

    suite.log("single global");

    const script =
      'require ["variables", "include" /*, "vacation"*/];\r\n'
      + 'global "i_am_on_vacation";\r\n'
      + '\r\n'
      + '#set "global.i_am_on_vacation" "1";\r\n'
      + '\r\n'
      + '#if string :is "${i_am_on_vacation}" "1"\r\n'
      + '#{\r\n'
      + ' #   vacation "It\'s true, I am on vacation.";\r\n'
      + '#}\r\n';

    suite.expectValidScript(script, ["include", "variables"]);
  });

})();
