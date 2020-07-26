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

suite.description("Date Unit Tests...");

suite.add("RFC5260 Snippet I", () => {

  const script = ""
    + 'require ["date", "relational", "fileinto"];\r\n'
    + 'if allof(header :is "from" "boss@example.com",\r\n'
    + '         date :value "ge" :originalzone "date" "hour" "09",\r\n'
    + '         date :value "lt" :originalzone "date" "hour" "17")\r\n'
    + '{ fileinto "urgent"; }\r\n';

  suite.expectValidScript(script, ["date", "relational", "fileinto"]);
});

suite.add("RFC5260 Snippet II", () => {

  const script = ""
    + 'require ["date", "fileinto"];\r\n'
    + 'if anyof(date :is "received" "weekday" "0",\r\n'
    + '         date :is "received" "weekday" "6")\r\n'
    + '{ fileinto "weekend"; }\r\n';

  suite.expectValidScript(script, ["date", "fileinto"]);
});

suite.add("RFC5260 Snippet III", () => {

  const script = ""
    + 'require ["date", "relational"];\r\n'
    + 'if anyof(currentdate :is "weekday" "0",\r\n'
    + '         currentdate :is "weekday" "6",\r\n'
    + '         currentdate :value "lt" "hour" "09",\r\n'
    + '         currentdate :value "ge" "hour" "17")\r\n'
    + '{ redirect "pager@example.com"; }\r\n';

  suite.expectValidScript(script, ["date", "relational"]);
});

suite.add("RFC5260 Snippet IV", () => {

  const script = ""
    + 'require ["date", "relational", "vacation"];\r\n'
    + 'if allof(currentdate :value "ge" "date" "2007-06-30",\r\n'
    + '         currentdate :value "le" "date" "2007-07-07")\r\n'
    + '{ vacation :days 7  "I\'m away during the first week in July."; }\r\n';

  suite.expectValidScript(script, ["date", "relational", "vacation"]);
});

suite.add("RFC5260 Snippet V", () => {

  const script = ""
    + 'require ["date", "variables", "fileinto"];\r\n'
    + 'if currentdate :matches "month" "*" { set "month" "${1}"; }\r\n'
    + 'if currentdate :matches "year"  "*" { set "year"  "${1}"; }\r\n'
    + 'fileinto "${month}-${year}";\r\n';

  suite.expectValidScript(script, ["date", "variables", "fileinto"]);
});

suite.add("RFC5260 Snippet VIa", () => {

  const script = ""
    + 'require "date";\r\n'
    + 'if currentdate :matches "std11" "*"\r\n'
    + '  {keep;}\r\n';

  suite.expectValidScript(script, ["date"]);
});

suite.add("RFC5260 Snippet VI", () => {

  // FIXME: Variables import is dropped silently
  const script = ""
    // + 'require ["variables", "date", "editheader"];\r\n'
    + 'require ["date", "editheader"];\r\n'
    + 'if currentdate :matches "std11" "*"\r\n'
    + '  {addheader "Processing-date" "${0}";}\r\n';

  suite.expectValidScript(script, ["date", "editheader"]);
});


suite.add("Validate date test constructor", () => {


  const snippet = 'date "date" "date" "' + new Date().toJSON().substring(0, "YYYY-MM-DD".length) + '"';
  suite.expectValidSnippet("test/date", snippet, ["date"]);
});

suite.add("Validate currentdate test constructor", () => {

  const snippet = 'currentdate "date" "' + new Date().toJSON().substring(0, "YYYY-MM-DD".length) + '"';
  suite.expectValidSnippet("test/currentdate", snippet, ["date"]);
});
