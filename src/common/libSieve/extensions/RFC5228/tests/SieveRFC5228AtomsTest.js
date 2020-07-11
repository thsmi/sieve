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

  suite.description("RFC5228 Atoms unit tests...");

  suite.add("Escaped quoted strings", () => {

    const script = ""
      // >> 'blubber' -ok
      + 'redirect "blubber";\n\n'
      // >> 'blub " er' -ok
      + 'redirect "blub \\" er";\n\n'
      // >> 'blubber\' -ok
      + 'redirect "blubber\\\\";\n\n'
      // >> 'blubber\"'
      + 'redirect "blubber\\\\\\"";\n\n'
      // >> 'blubber\\'
      + 'redirect "blubber\\\\\\\\";\n\n'
      // >> '\' -ok
      + 'redirect "\\\\";\n\n'
      // >> '\"'
      + 'redirect "\\\\\\"";\n\n'
      // >> '\\'
      + 'redirect "\\\\\\\\";\n\n'
      // >> ' \\'
      + 'redirect " \\\\\\\\";\n\n'
      // >> ' "\\'
      + 'redirect " \\"\\\\\\\\";\n\n';

    const doc = suite.parseScript(script);
    const elms = doc.queryElements("action/redirect");

    suite.assertEquals('blubber', elms.shift().getElement("address").value());
    suite.assertEquals('blub " er', elms.shift().getElement("address").value());
    suite.assertEquals('blubber\\', elms.shift().getElement("address").value());
    suite.assertEquals('blubber\\"', elms.shift().getElement("address").value());
    suite.assertEquals('blubber\\\\', elms.shift().getElement("address").value());
    suite.assertEquals('\\', elms.shift().getElement("address").value());
    suite.assertEquals('\\"', elms.shift().getElement("address").value());
    suite.assertEquals("\\\\", elms.shift().getElement("address").value());
    suite.assertEquals(" \\\\", elms.shift().getElement("address").value());
    suite.assertEquals(' "\\\\', elms.shift().getElement("address").value());

  });
  // :comparator "i;ascii-casemap"

})();

