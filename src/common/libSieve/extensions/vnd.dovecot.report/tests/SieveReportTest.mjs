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

suite.description("Report Unit Tests...");

suite.add("Report Example I", () => {


  const script = ''
    + 'require ["environment", "vnd.dovecot.report"];\r\n'
    + '\r\n'
    + 'report "abuse" "This spam message slipped through."\r\n'
    + '  "spam-report@example.org";\r\n'
    + '\r\n';

  suite.expectValidScript(script, ["environment", "vnd.dovecot.report"]);
});


suite.add("Report Example II", () => {


  const script = ''
    + 'require ["environment", "vnd.dovecot.report"];\r\n'
    + '\r\n'
    + 'if allof(\r\n'
    + '    environment "imap.mailbox" "Spam Report",\r\n'
    + '    environment "imap.cause" "COPY",\r\n'
    + '    header "x-spam-status" "not spam") {\r\n'
    + '    report "abuse" "This spam message slipped through."\r\n'
    + '    "spam-report@example.org";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["environment", "vnd.dovecot.report"]);
});
