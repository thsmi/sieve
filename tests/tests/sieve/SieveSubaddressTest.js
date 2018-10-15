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

  let suite = net.tschmid.yautt.test;

  if (!suite)
    throw new Error("Could not initialize test suite");

  suite.add(function () {
    suite.log("Subaddress Unit Tests...");
  });

  suite.add(function () {

    suite.log("Parse Subaddress Example 1");

    let script = ''
      + 'require ["envelope", "subaddress", "fileinto"];\r\n'
      + '\r\n'
      + '\r\n'
      + '# In this example the same user account receives mail for both\r\n'
      + '# "ken@example.com" and "postmaster@example.com"\r\n'
      + '\r\n'
      + '# File all messages to postmaster into a single mailbox,\r\n'
      + '# ignoring the :detail part.\r\n'
      + 'if envelope :user "to" "postmaster" {\r\n'
      + '    fileinto "inbox.postmaster";\r\n'
      + '    stop;\r\n'
      + '}\r\n'
      + '\r\n'
      + '# File mailing list messages (subscribed as "ken+mta-filters").\r\n'
      + 'if envelope :detail "to" "mta-filters" {\r\n'
      + '    fileinto "inbox.ietf-mta-filters";\r\n'
      + '}\r\n'
      + '\r\n'
      + '# Redirect all mail sent to "ken+foo".\r\n'
      + 'if envelope :detail "to" "foo" {\r\n'
      + '    redirect "ken@example.net";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, { "subaddress": true, "envelope": true, "fileinto": true });
  });


})();
