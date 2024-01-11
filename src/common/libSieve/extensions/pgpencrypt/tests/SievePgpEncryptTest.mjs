/*
* The contents of this file are licensed. You may obtain a copy of
* the license at https://github.com/thsmi/sieve/ or request it via
* email from the author.
*
* Do not remove or change this comment.
*
* The initial author of the code is:
 *   kaivol <github@kavol.de>
*
*/

/* global net */

const suite = net.tschmid.yautt.test;

if (!suite)
  throw new Error("Could not initialize test suite");

suite.description("pgpencrypt Unit Tests...");

suite.add("pgpencrypt Snippet I", () => {

  const script = ''
    + 'require "vnd.dovecot.pgp-encrypt";\r\n'
    + 'if true {\r\n'
    + '    pgp_encrypt :keys text:\r\n'
    + 'ABCDEF\r\n'
    + '.\r\n'
    + ';\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["vnd.dovecot.pgp-encrypt"]);
});
