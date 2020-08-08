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

suite.description("Spamtest Tests...");

suite.add("Example 0 (Spamtest)", () => {

  const script = ''
    + 'require ["spamtest", "fileinto"];\r\n'
    + '\r\n'
    + 'if spamtest  "0"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.unclassified";\r\n'
    + '}\r\n'
    + 'else\r\n'
    + '{\r\n'
    + '    discard;\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["spamtest", "fileinto"]);
});

suite.add("Example 0 (Spamtestplus)", () => {

  const script = ''
    + 'require ["spamtestplus", "fileinto"];\r\n'
    + '\r\n'
    + 'if spamtest  "0"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.unclassified";\r\n'
    + '}\r\n'
    + 'else\r\n'
    + '{\r\n'
    + '    discard;\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["spamtestplus", "fileinto"]);
});


suite.add("Example 1", () => {

  const script = ''
    + 'require ["spamtestplus", "fileinto", "relational", "comparator-i;ascii-numeric"];\r\n'
    + '\r\n'
    + 'if spamtest :value "eq" :comparator "i;ascii-numeric" "0"\r\n'
    //      + 'if spamtest :value "eq"\r\n'
    //      + '     :comparator "i;ascii-numeric" "0"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.unclassified";\r\n'
    + '}\r\n'
    + 'elsif spamtest :percent :value "eq"\r\n'
    + '      :comparator "i;ascii-numeric" "0"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.not-spam";\r\n'
    + '}\r\n'
    + 'elsif spamtest :percent :value "lt"\r\n'
    + '      :comparator "i;ascii-numeric" "37"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.spam-trap";\r\n'
    + '}\r\n'
    + 'else\r\n'
    + '{\r\n'
    + '    discard;\r\n'
    + '}\r\n';

  suite.expectValidScript(script, [
    "spamtestplus", "fileinto", "relational", "comparator-i;ascii-numeric"]
  );
});

suite.add("Example 2", () => {

  const script = ''
    + 'require ["spamtest", "fileinto", "relational", "comparator-i;ascii-numeric"];\r\n'
    + '\r\n'
    + 'if spamtest :value "eq" :comparator "i;ascii-numeric" "0"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.unclassified";\r\n'
    + '}\r\n'
    + 'elsif spamtest :value "ge" :comparator "i;ascii-numeric" "3"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.spam-trap";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, [
    "spamtest", "fileinto", "relational", "comparator-i;ascii-numeric"]);
});

suite.add("Example 3", () => {

  const script = ''
    + 'require ["spamtestplus", "fileinto", "relational", "comparator-i;ascii-numeric"];\r\n'
    + 'if spamtest :percent :count "eq"\r\n'
    + '            :comparator "i;ascii-numeric" "0"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.unclassified";\r\n'
    + '}\r\n'
    + 'elsif spamtest :percent :value "eq"\r\n'
    + '               :comparator "i;ascii-numeric" "0"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.not-spam";\r\n'
    + '}\r\n'
    + 'elsif spamtest :percent :value "lt"\r\n'
    + '               :comparator "i;ascii-numeric" "37"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.spam-trap";\r\n'
    + '}\r\n'
    + 'else\r\n'
    + '{\r\n'
    + '    discard;\r\n'
    + '}\r\n';

  suite.expectValidScript(script, [
    "spamtestplus", "fileinto", "relational", "comparator-i;ascii-numeric"]);
});

suite.add("Example 4", () => {

  const script = ''
    + 'require ["virustest", "fileinto", "relational", "comparator-i;ascii-numeric"];\r\n'
    + '\r\n'
    + 'if virustest :value "eq" :comparator "i;ascii-numeric" "0"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.unclassified";\r\n'
    + '}\r\n'
    + 'if virustest :value "eq" :comparator "i;ascii-numeric" "4"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.quarantine";\r\n'
    + '}\r\n'
    + 'elsif virustest :value "eq" :comparator "i;ascii-numeric" "5"\r\n'
    + '{\r\n'
    + '    discard;\r\n'
    + '}\r\n';

  suite.expectValidScript(script, [
    "virustest", "fileinto", "relational", "comparator-i;ascii-numeric"]);
});
