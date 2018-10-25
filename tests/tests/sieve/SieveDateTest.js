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
    suite.log("Date Unit Tests...");
  });

  suite.add(function () {

    suite.log("RFC5260 Sniplet I");

    let script = ""
      + 'require ["date", "relational", "fileinto"];\r\n'
      + 'if allof(header :is "from" "boss@example.com",\r\n'
      + '         date :value "ge" :originalzone "date" "hour" "09",\r\n'
      + '         date :value "lt" :originalzone "date" "hour" "17")\r\n'
      + '{ fileinto "urgent"; }\r\n';

    suite.expectValidScript(script, { "date": true, "relational": true, "fileinto": true });
  });

  suite.add(function () {

    suite.log("RFC5260 Sniplet II");

    let script = ""
      + 'require ["date", "fileinto"];\r\n'
      + 'if anyof(date :is "received" "weekday" "0",\r\n'
      + '         date :is "received" "weekday" "6")\r\n'
      + '{ fileinto "weekend"; }\r\n';

    suite.expectValidScript(script, { "date": true, "fileinto": true });
  });

  suite.add(function () {

    suite.log("RFC5260 Sniplet III");

    let script = ""
      + 'require ["date", "relational"];\r\n'
      + 'if anyof(currentdate :is "weekday" "0",\r\n'
      + '         currentdate :is "weekday" "6",\r\n'
      + '         currentdate :value "lt" "hour" "09",\r\n'
      + '         currentdate :value "ge" "hour" "17")\r\n'
      + '{ redirect "pager@example.com"; }\r\n';

    suite.expectValidScript(script, { "date": true, "relational": true });
  });

  suite.add(function () {

    suite.log("RFC5260 Sniplet IV");

    let script = ""
      + 'require ["date", "relational", "vacation"];\r\n'
      + 'if allof(currentdate :value "ge" "date" "2007-06-30",\r\n'
      + '         currentdate :value "le" "date" "2007-07-07")\r\n'
      + '{ vacation :days 7  "I\'m away during the first week in July."; }\r\n';

    suite.expectValidScript(script, { "date": true, "relational": true, "vacation": true });
  });

  suite.add(function () {

    suite.log("RFC5260 Sniplet V");

    let script = ""
      + 'require ["date", "variables", "fileinto"];\r\n'
      + 'if currentdate :matches "month" "*" { set "month" "${1}"; }\r\n'
      + 'if currentdate :matches "year"  "*" { set "year"  "${1}"; }\r\n'
      + 'fileinto "${month}-${year}";\r\n';

    suite.expectValidScript(script, { "date": true, "variables": true, "fileinto": true });
  });

  suite.add(function () {

    suite.log("RFC5260 Sniplet VIa");

    let script = ""
      + 'require "date";\r\n'
      + 'if currentdate :matches "std11" "*"\r\n'
      + '  {keep;}\r\n';

    suite.expectValidScript(script, { "date": true });
  });

  // FIXME: Variables import is dropped silently
  /* suite.add(function () {

    suite.log("RFC5260 Sniplet VI");

    let script = ""
      + 'require ["variables", "date", "editheader"];\r\n'
      + 'if currentdate :matches "std11" "*"\r\n'
      + '  {addheader "Processing-date" "${0}";}\r\n';

    suite.expectValidScript(script, { "date": true, "variables": true, "editheader": true });
  });*/


  suite.add(function () {
    suite.log("Validate date test constructor");

    let snipplet = 'date "date" "date" "' + new Date().toJSON().substring(0, 10) + '"';
    suite.expectValidSnipplet("test/date", snipplet, { "date": true } );
  });

  suite.add(function () {
    suite.log("Validate currentdate test constructor");

    let snipplet = 'currentdate "date" "' + new Date().toJSON().substring(0, 10) + '"';
    suite.expectValidSnipplet("test/currentdate", snipplet, { "date": true } );
  });

})();
