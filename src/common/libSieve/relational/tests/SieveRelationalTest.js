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

  suite.description("Sieve Relational (RFC5231) unit tests...");

  suite.add("Extended Example test", () => {

    const script =
      'require ["relational", "comparator-i;ascii-numeric", "fileinto"];\r\n'
      + '\r\n'
      + 'if header :comparator "i;ascii-numeric" :value "lt" \r\n'
      + '          ["x-priority"] ["3"]\r\n'
      + '{\r\n'
      + '   fileinto "Priority";\r\n'
      + '}\r\n'
      + '\r\n'
      + 'elsif address :comparator "i;ascii-numeric" :count "gt" \r\n'
      + '           ["to"] ["5"]\r\n'
      + '{\r\n'
      + '   # everything with more than 5 recipients in the "to" field\r\n'
      + '   # is considered SPAM\r\n'
      + '   fileinto "SPAM";\r\n'
      + '}\r\n'
      + '\r\n'
      + 'elsif address :all :comparator "i;ascii-casemap" :value "gt" \r\n'
      + '           ["from"] ["M"]\r\n'
      + '{\r\n'
      + '   fileinto "From N-Z";\r\n'
      + '} else {\r\n'
      + '   fileinto "From A-M";\r\n'
      + '}\r\n'
      + '\r\n'
      + 'if allof ( address :comparator "i;ascii-numeric" :count "eq" \r\n'
      + '                   ["to", "cc"] ["1"] ,\r\n'
      + '           address :all :comparator "i;ascii-casemap" \r\n'
      + '                   ["to", "cc"] ["me@foo.example.com"] )\r\n'
      + '{\r\n'
      + '   fileinto "Only me";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["relational", "comparator-i;ascii-numeric", "fileinto"]);
  });

  suite.add("Invalid operator", () => {

    const script =
      'require ["relational"];\r\n'
      + '\r\n'
      + 'if address :all :comparator "i;ascii-casemap" :value "egt" \r\n'
      + '           ["from"] ["M"]\r\n'
      + '{\r\n'
      + '   keep;\r\n'
      + '}\r\n';

    suite.expectInvalidScript(script, "Error: Unknown or incompatible type", ["relational"]);
  });

  suite.add("Missing operator", () => {

    const script =
      'require ["relational"];\r\n'
      + '\r\n'
      + 'if address :all :comparator "i;ascii-casemap" :value \r\n'
      + '           ["from"] ["M"]\r\n'
      + '{\r\n'
      + '   keep;\r\n'
      + '}\r\n';

    suite.expectInvalidScript(script, "Error: Unknown or incompatible type", ["relational"]);
  });


  suite.add("Validate :value constructors", () => {

    const snippet = ':value "eq"';
    suite.expectValidSnippet("match-type/value", snippet, ["relational"]);
  });

  suite.add("Validate :count constructors", () => {

    const snippet = ':count "eq"';
    suite.expectValidSnippet("match-type/count", snippet, ["relational"]);
  });

  /*
   *       address :count "ge" :comparator "i;ascii-numeric"
                      ["to", "cc"] ["3"]



----------


      anyof ( address :count "ge" :comparator "i;ascii-numeric"
                      ["to"] ["3"],
              address :count "ge" :comparator "i;ascii-numeric"
                      ["cc"] ["3"] )


-------

      header :count "ge" :comparator "i;ascii-numeric"
                      ["received"] ["3"]

------

      header :count "ge" :comparator "i;ascii-numeric"
                      ["received", "subject"] ["3"]


------

      header :count "ge" :comparator "i;ascii-numeric"
                      ["to", "cc"] ["3"]

------


   */

})();
