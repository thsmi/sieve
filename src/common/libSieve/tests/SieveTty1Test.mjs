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


suite.description(
  "Examples from tty1.net...",
  "http://www.tty1.net/blog/2011-07-16-sieve-tutorial_en.html");


suite.add("TTY1 Example I", function () {

  const script = ''
    + 'require ["fileinto", "reject"];\r\n'
    + '\r\n'
    + '# Daffy Duck is a good friend of mine.\r\n'
    + 'if address :is "from" "daffy.duck@example.com"\r\n'
    + '{\r\n'
    + '    fileinto "friends";\r\n'
    + '}\r\n'
    + '\r\n'
    + '# Reject mails from the hunting enthusiasts at example.com.\r\n'
    + 'if header :contains "list-id" "<duck-hunting.example.com>"\r\n'
    + '{\r\n'
    + '    reject "No violence, please";\r\n'
    + '}\r\n'
    + '\r\n'
    + '# The command "keep" is executed automatically, if no other action is taken.\r\n';

  suite.expectValidScript(script, ["fileinto", "reject"]);
});

suite.add("TTY1 Example II", function () {

  const script = ''
    + '# The hash character starts a one-line comment.\r\n'
    + '# Everything after a # character until the end of line is ignored.\r\n'
    + '\r\n'
    + '/* this is a bracketed (C-style) comment. This type of comment can stretch\r\n'
    + ' * over many lines. A bracketed comment begins with a forward slash, followed\r\n'
    + ' * by an asterisk and ends with the inverse sequence: an asterisk followed\r\n'
    + ' * by a forward slash. */\r\n';

  suite.expectValidScript(script, []);
});


suite.add("TTY1 Example III", function () {

  const script = ''
    + 'require ["fileinto"];\r\n'
    + '\r\n'
    + '# The two test below are equivalent;\r\n'
    + '# The first variant is clearer and probably also more efficient.\r\n'
    + 'if address :is :domain "to" "example.com"\r\n'
    + '{\r\n'
    + '    fileinto "examplecom";\r\n'
    + '}\r\n'
    + 'if address :matches :all "to" "*@example.com"\r\n'
    + '{\r\n'
    + '    fileinto "examplecom";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["fileinto"]);
});


suite.add("TTY1 Example IV", function () {

  const script = ''
    + 'require ["fileinto"];\r\n'
    + '\r\n'
    + '# File mails with a Spamassassin score of 4.0 or more\r\n'
    + '# into the "junk" folder.\r\n'
    + 'if header :contains "x-spam-level" "****"\r\n'
    + '{\r\n'
    + '    fileinto "junk";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["fileinto"]);
});


suite.add("TTY1 Example V", function () {

  const script = ''
    + 'require ["reject"];\r\n'
    + '\r\n'
    + '# Reject all messages that contain the string "viagra"in the Subject.\r\n'
    + 'if header :contains "subject" "viagra"\r\n'
    + '{\r\n'
    + '    reject "go away!";\r\n'
    + '}\r\n'
    + '# Silently discard all messages sent from the tax man\r\n'
    + 'elsif address :matches :domain "from" "*hmrc.gov.uk"\r\n'
    + '{\r\n'
    + '    discard;\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["reject"]);
});


suite.add("TTY1 Example VI", function () {

  const script = ''
    + 'require ["fileinto"];\r\n'
    + '\r\n'
    + '# A mail to any of the recipients in the list of strings is filed to the folder "friends".\r\n'
    + 'if address :is "from" ["daffy.duck@example.com", "porky.pig@example.com", "speedy.gonzales@example.com"]\r\n'
    + '{\r\n'
    + '    fileinto "friends";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["fileinto"]);
});


suite.add("TTY1 Example VII", function () {

  const script = ''
    + 'require ["fileinto"];\r\n'
    + '\r\n'
    + '# Check if either the "from" or the "sender" header is from Porky.\r\n'
    + 'if address :is ["from", "sender"] "porky.pig@example.com"\r\n'
    + '{\r\n'
    + '    fileinto "friends";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["fileinto"]);
});


suite.add("TTY1 Example VIII", function () {

  const script = ''
    + 'require ["fileinto"];\r\n'
    + '\r\n'
    + '# Match "from" or the "sender" file with any of Daffy, Porky or Speedy.\r\n'
    + 'if address :is ["from", "sender"] ["daffy.duck@example.com", "porky.pig@example.com", "speedy.gonzales@example.com"]\r\n'
    + '{\r\n'
    + '    fileinto "friends";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["fileinto"]);
});


suite.add("TTY1 Example IX", function () {

  const script = ''
    + '# This test checks against Spamassassin\'s header fields:\r\n'
    + '# If the spam level ls 4 or more and the Subject contains too\r\n'
    + '# many illegal characters, then silently discard the mail.\r\n'
    + 'if allof (header :contains "X-Spam-Level" "****",\r\n'
    + '          header :contains "X-Spam-Report" "FROM_ILLEGAL_CHARS")\r\n'
    + '{\r\n'
    + '    discard;\r\n'
    + '}\r\n'
    + '# Discard mails that do not have a Date: or From: header field\r\n'
    + '# or mails that are sent from the marketing department at example.com.\r\n'
    + 'elsif anyof (not exists ["from", "date"],\r\n'
    + '        header :contains "from" "marketing@example.com") {\r\n'
    + '    discard;\r\n'
    + '}\r\n';

  suite.expectValidScript(script, []);
});


suite.add("TTY1 Example X", function () {

  const script = ''
    + '# Delete messages greater than half a MB\r\n'
    + 'if size :over 500K\r\n'
    + '{\r\n'
    + '    discard;\r\n'
    + '}\r\n'
    + '# Also delete small mails, under 1k\r\n'
    + 'if size :under 1K\r\n'
    + '{\r\n'
    + '    discard;\r\n'
    + '}\r\n';

  suite.expectValidScript(script, []);
});

