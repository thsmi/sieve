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
    suite.log("Pipe Unit Tests...");
  });

  suite.add(function () {

    suite.log("Pipe Example I");

    const script = ''
      + 'require "vnd.dovecot.execute";\r\n'
      + '\r\n'
      + 'if not execute :pipe "hasfrop.sh" {\r\n'
      + '  discard;\r\n'
      + '  stop;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["vnd.dovecot.execute"]);
  });

  suite.add(function () {

    suite.log("Pipe Example II");

    const script = ''
      + 'require ["variables", "copy", "envelope", "vnd.dovecot.execute"];\r\n'
      + '\r\n'
      + '# put the envelope-from address in a variable\r\n'
      + 'if envelope :matches "from" "*" { set "from" "${1}"; }\r\n'
      + '\r\n'
      + '# execute the vacationcheck.sh program and redirect the message based on its exit code\r\n'
      + 'if execute :output "vacation_message" "vacationcheck.sh" ["${from}","300"]\r\n'
      + '{\r\n'
      + ' redirect\r\n'
      + '      :copy "foo@bar.net";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["variables", "copy", "envelope", "vnd.dovecot.execute"]);
  });

  suite.add(function () {
    suite.log("Pipe Example III");

    const script = ''
      + 'require [ "vnd.dovecot.pipe", "subaddress", "envelope" ];\r\n'
      + '\r\n'
      + 'if envelope :detail "to" "request"\r\n'
      + '{\r\n'
      + '  pipe "request-handler";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["vnd.dovecot.pipe", "subaddress", "envelope"]);
  });

  suite.add(function () {
    suite.log("Pipe Example IV");

    const script = ''
      + 'require [ "vnd.dovecot.pipe", "copy" ];\r\n'
      + '\r\n'
      + 'if address "to" "snailmail@example.com"\r\n'
      + '{\r\n'
      + '  pipe :copy "printer" ["A4", "draft"];\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["vnd.dovecot.pipe", "copy"]);
  });

  suite.add(function () {
    suite.log("Pipe Example V");

    const script = ''
      + 'require [ "vnd.dovecot.filter", "fileinto" ];\r\n'
      + '\r\n'
      + 'if header "content-language" "nl"\r\n'
      + '{\r\n'
      + '  filter "translator" ["nl", "en"];\r\n'
      + '  fileinto "Translated";\r\n'
      + '  stop;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["vnd.dovecot.filter", "fileinto"]);
  });

  suite.add(function () {
    suite.log("Pipe Example VI");

    const script = ''
      + 'require [ "vnd.dovecot.filter", "fileinto" ];\r\n'
      + '\r\n'
      + 'if header "content-language" "nl"\r\n'
      + '{\r\n'
      + '  if filter "translator" ["nl", "en"]\r\n'
      + '  {\r\n'
      + '    fileinto "Translated";\r\n'
      + '    stop;\r\n'
      + '  }\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["vnd.dovecot.filter", "fileinto"]);
  });

  suite.add(function () {
    suite.log("Pipe Example VII");

    const script = ''
      + 'require [ "vnd.dovecot.execute", "vacation", "variables",\r\n'
      + '          "envelope" ];\r\n'
      + '\r\n'
      + 'if envelope :localpart :matches "to" "*"\r\n'
      + '{\r\n'
      + '  set "recipient" "${1}";\r\n'
      + '}\r\n'
      + '\r\n'
      + 'if execute :output "vacation_message" "onvacation" "${recipient}"\r\n'
      + '{\r\n'
      + '  vacation "${vacation_message}";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["vnd.dovecot.execute", "vacation", "variables", "envelope"]);
  });

})();
