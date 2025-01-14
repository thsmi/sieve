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

suite.description("debug_log Unit Tests...");

suite.add("vnd.dovecot.debug - Example I", () => {

  const script = ""
    + 'require "vnd.dovecot.debug";\r\n'
    + '\r\n'
    + 'if header :contains "subject" "hello" {\r\n'
    + '  debug_log "Subject header contains hello!";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["vnd.dovecot.debug"]);
});

suite.add("vnd.dovecot.debug - Example II", () => {

  const script = ""
    + 'require ["variables", "envelope", "vnd.dovecot.debug"];\r\n'
    + '\r\n'
    + 'if envelope :matches "to" "*" { set "to" "${1}"; }\r\n'
    + 'if envelope :matches "from" "*" { set "from" "${1}"; }\r\n'
    + '\r\n'
    + 'debug_log "Received message TO=${to} FROM=${from}";\r\n'
    + '\r\n';

  suite.expectValidScript(script, ["vnd.dovecot.debug", "variables", "envelope"]);
});
