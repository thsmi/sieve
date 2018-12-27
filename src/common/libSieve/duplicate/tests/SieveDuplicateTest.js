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
    suite.log("Duplicate Tests...");
  });

  suite.add(function () {

    suite.log("Snipplet 1");

    let script = ''
      + 'require "duplicate";\r\n'
      + 'if duplicate {\r\n'
      + '  discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["duplicate"]);
  });


  suite.add(function () {

    suite.log("Snipplet 2");

    let script = ''
      + 'require "duplicate";\r\n'
      + 'if duplicate :header "message-id" {\r\n'
      + '  discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["duplicate"]);
  });


  suite.add(function () {

    suite.log("Snipplet 3");

    let script = ''
      // + 'require ["duplicate", "variables"];\r\n'
      + 'require ["duplicate"];\r\n'
      + 'if header :matches "message-id" "*" {\r\n'
      + '  if duplicate :uniqueid "${0}" {\r\n'
      + '    discard;\r\n'
      + '  }\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["duplicate"]);
  });


  suite.add(function () {

    suite.log("Example 1");

    let script = ''
      + 'require ["duplicate", "fileinto", "mailbox"];\r\n'
      + '\r\n'
      + 'if duplicate {\r\n'
      + '  fileinto :create "Trash/Duplicate";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["fileinto", "duplicate", "mailbox"]);
  });


  suite.add(function () {

    suite.log("Example 2");

    let script = ''
      // + 'require ["duplicate", "variables", "imap4flags",\r\n'
      + 'require ["duplicate", "imap4flags",\r\n'
      + '  "fileinto"];\r\n'
      + '\r\n'
      + 'if header :matches "subject" "ALERT: *" {\r\n'
      + '  if duplicate :seconds 60 :uniqueid "${1}" {\r\n'
      + '    setflag "\\\\seen";\r\n'
      + '  }\r\n'
      + '  fileinto "Alerts";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["duplicate", "imap4flags", "fileinto"]);
  });


  suite.add(function () {

    suite.log("Example 3a");

    let script = ''
      + 'require ["variables", "envelope", "enotify", "duplicate"];\r\n'
      + '\r\n'
      + 'if envelope :matches "from" "*" { set "sender" "${1}"; }\r\n'
      + 'if header :matches "subject" "*" { set "subject" "${1}"; }\r\n'
      + '\r\n'
      + 'if not duplicate :seconds 1800 :uniqueid "${sender}"\r\n'
      + '{\r\n'
      + '  notify :message "[SIEVE] ${sender}: ${subject}"\r\n'
      + '    "xmpp:user@im.example.com";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["variables", "envelope", "enotify", "duplicate"]);
  });


  suite.add(function () {

    suite.log("Example 3b");

    let script = ''
      + 'require ["variables", "envelope", "enotify", "duplicate"];\r\n'
      + '\r\n'
      + 'if envelope :matches "from" "*" { set "sender" "${1}"; }\r\n'
      + 'if header :matches "subject" "*" { set "subject" "${1}"; }\r\n'
      + '\r\n'
      + '# account for "Re:" prefix\r\n'
      + 'if string :comparator "i;ascii-casemap"\r\n'
      + '  :matches "${subject}" "Re:*"\r\n'
      + '{\r\n'
      + '  set "subject" "${1}";\r\n'
      + '}\r\n'
      + 'if not duplicate :seconds 1800\r\n'
      + '  :uniqueid "${sender} ${subject}"\r\n'
      + '{\r\n'
      + '  notify :message "[SIEVE] ${sender}: ${subject}"\r\n'
      + '    "xmpp:user@im.example.com";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["variables", "envelope", "enotify", "duplicate"]);
  });


  suite.add(function () {

    suite.log("Example 4");

    let script = ''
      + 'require ["duplicate", "imap4flags"];\r\n'
      + '\r\n'
      + 'if duplicate :header "X-Event-ID" :handle "notifier" {\r\n'
      + '  discard;\r\n'
      + '}\r\n'
      + 'if allof (\r\n'
      + '  duplicate :header "X-Ticket-ID" :handle "support",\r\n'
      + '  address "to" "support@example.com",\r\n'
      + '  header :contains "subject" "fileserver")\r\n'
      + '{\r\n'
      + '  setflag "\\\\seen";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["duplicate", "imap4flags"]);
  });

})();
