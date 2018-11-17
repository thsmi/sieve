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
    suite.log("Body Unit Tests...");
  });

  suite.add(function () {

    suite.log("Parse body transform :raw");

    let script =
      'require "body";\r\n'
      + '\r\n'
      + '# This will match a message containing the literal text\r\n'
      + '# "MAKE MONEY FAST" in body parts (ignoring any\r\n'
      + '# content-transfer-encodings) or MIME headers other than\r\n'
      + '# the outermost RFC 2822 header.\r\n'
      + '\r\n'
      + 'if body :raw :contains "MAKE MONEY FAST" {\r\n'
      + '        discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["body"]);
  });

  suite.add(function () {

    suite.log("Parse body transform :content");

    let script =
      'require ["body", "fileinto"];\r\n'
      + '\r\n'
      + '# Save any message with any text MIME part that contains the\r\n'
      + '# words "missile" or "coordinates" in the "secrets" folder.\r\n'
      + ' if body :content "text" :contains ["missile", "coordinates"] {\r\n'
      + '  fileinto "secrets";\r\n'
      + '}\r\n'
      + '\r\n'
      + '# Save any message with an audio/mp3 MIME part in\r\n'
      + '# the "jukebox" folder.\r\n'
      + 'if body :content "audio/mp3" :contains "" {\r\n'
      + '  fileinto "jukebox";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["body", "fileinto"]);
  });


  suite.add(function () {

    suite.log("Parse body transform :text");

    let script =
      'require ["body", "fileinto"];\r\n'
      + '\r\n'
      + '# Save messages mentioning the project schedule in the\r\n'
      + '# project/schedule folder.\r\n'
      + ' if body :text :contains "project schedule" {\r\n'
      + '  fileinto "project/schedule";'
      + '}\r\n';

    suite.expectValidScript(script, [ "body", "fileinto"]);
  });


})();

