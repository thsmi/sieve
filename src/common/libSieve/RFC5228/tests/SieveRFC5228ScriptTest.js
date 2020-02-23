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
    suite.log("RFC5228 unit tests...");
  });

  suite.add(function () {
    suite.log("Test Case insensitivity");

    const script = ""
      + 'if NOT address :DOMAIN :is ["From", "To"] "example.com"\r\n'
      + '        {\r\n'
      + '        keep;               # keep in "In" mailbox\r\n'
      + '        }\r\n';

    suite.expectValidScript(script);
  });


  suite.add(function () {
    suite.log("Single line comment");

    const script = ""
      + 'if size :over 100K { # this is a comment\r\n'
      + '    discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });


  suite.add(function () {
    suite.log("Multiline comment");

    const script = ""
      + 'if size :over 100K { /* this is a comment\r\n'
      + '    this is still a comment */ discard /* this is a comment\r\n'
      + '     */ ;\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });


  suite.add(function () {
    suite.log("Example 1");

    const script = ""
      + 'if anyof (not exists ["From", "Date"],\r\n'
      + '          header :contains "from" "fool@example.com") {\r\n'
      + '  discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });

  suite.add(function () {
    suite.log("Example 2");

    const script = ""
      + 'if header :comparator "i;octet" :contains "Subject"\r\n'
      + '             "MAKE MONEY FAST" {\r\n'
      + '          discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });

  suite.add(function () {
    suite.log("Example 2a (with linebreaks in comparator)");

    const script = ""
      + 'if header :comparator \r\n"i;octet" :contains "Subject"\r\n'
      + '             "MAKE MONEY FAST" {\r\n'
      + '          discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });

  suite.add(function () {
    suite.log("Example 2b (with linebreaks in comparator)");

    const script = ""
      + 'if header :comparator\r\n "i;octet" :contains "Subject"\r\n'
      + '             "MAKE MONEY FAST" {\r\n'
      + '          discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });


  suite.add(function () {
    suite.log("Example 3");

    const script =
      'if size :over 500K { discard; }';

    suite.expectValidScript(script);
  });

  suite.add(function () {
    suite.log("Example 4");

    const script = ""
      + 'if header :contains ["From"] ["coyote"] {\r\n'
      + '   redirect "acm@example.com";\r\n'
      + '} elsif header :contains "Subject" "$$$" {\r\n'
      + '   redirect "postmaster@example.com";\r\n'
      + '} else {\r\n'
      + '   redirect "field@example.com";\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });

  suite.add(function () {
    suite.log("Example 5");

    const script = ""
      + 'require "fileinto";\r\n'
      + 'if header :contains "from" "coyote" {\r\n'
      + '   discard;\r\n'
      + '} elsif header :contains ["subject"] ["$$$"] {\r\n'
      + '   discard;\r\n'
      + '} else {\r\n'
      + '   fileinto "INBOX";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["fileinto"]);
  });

  suite.add(function () {
    suite.log("Example 6");

    const script = ""
      + 'require "fileinto";\r\n'
      + 'if header :contains ["from"] "coyote" {\r\n'
      + '   fileinto "INBOX.harassment";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["fileinto"]);
  });

  suite.add(function () {
    suite.log("Example 7");

    const script = ""
      + 'if size :under 1M { keep; } else { discard; }';

    suite.expectValidScript(script);
  });

  suite.add(function () {
    suite.log("Example 8");

    const script = ""
      + 'if not size :under 1M { discard; }';

    suite.expectValidScript(script);
  });

  suite.add(function () {
    suite.log("Example 9");

    const script = ""
      + 'if header :contains ["from"] ["idiot@example.com"] {\r\n'
      + '   discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });

  suite.add(function () {
    suite.log("Example 10");

    const script = ""
      + 'if address :all :is "from" "tim@example.com" {\r\n'
      + '   discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });

  suite.add(function () {
    suite.log("Example 11");

    const script = ""
      + 'require "envelope";\r\n'
      + 'if envelope :all :is "from" "tim@example.com" {\r\n'
      + '   discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["envelope"]);
  });

  suite.add(function () {
    suite.log("Example 12");

    const script = ""
      + 'if not exists ["From","Date"] {\r\n'
      + '   discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });

  /* suite.add( function() {
    suite.log("Example 12");

    var script = ""
          + 'require "encoded-character";\r\n'
          + 'if header :contains "Subject" "$${hex:24 24}" {\r\n'
          + '   discard;\r\n'
          + '} \r\n';

    testScript(script, {"encoded-character":true});
  });*/

  suite.add(function () {
    suite.log("Example Sieve Filter");

    const script = ""
      + '#\r\n'
      + '# Example Sieve Filter\r\n'
      + '# Declare any optional features or extension used by the script\r\n'
      + '#\r\n'
      + 'require ["fileinto"];\r\n'
      + '\r\n'
      + '#\r\n'
      + '# Handle messages from known mailing lists\r\n'
      + '# Move messages from IETF filter discussion list to filter mailbox\r\n'
      + '#\r\n'
      + 'if header :is "Sender" "owner-ietf-mta-filters@imc.org"\r\n'
      + '        {\r\n'
      + '        fileinto "filter";  # move to "filter" mailbox\r\n'
      + '        }\r\n'
      + '#\r\n'
      + '# Keep all messages to or from people in my company\r\n'
      + '#\r\n'
      + 'elsif address :DOMAIN :is ["From", "To"] "example.com"\r\n'
      + '        {\r\n'
      + '        keep;               # keep in "In" mailbox\r\n'
      + '        }\r\n'
      + '\r\n'
      + '#\r\n'
      + '# Try and catch unsolicited email.  If a message is not to me,\r\n'
      + '# or it contains a subject known to be spam, file it away.\r\n'
      + '#\r\n'
      + 'elsif anyof (NOT address :all :contains\r\n'
      + '               ["To", "Cc", "Bcc"] "me@example.com",\r\n'
      + '             header :matches "subject"\r\n'
      + '               ["*make*money*fast*", "*university*dipl*mas*"])\r\n'
      + '        {\r\n'
      + '        fileinto "spam";   # move to "spam" mailbox\r\n'
      + '        }\r\n'
      + 'else\r\n'
      + '        {\r\n'
      + '        # Move all other (non-company) mail to "personal"\r\n'
      + '        # mailbox.\r\n'
      + '        fileinto "personal";\r\n'
      + '        }\r\n';

    suite.expectValidScript(script, ["fileinto"]);
  });

  suite.add(function () {
    suite.log("Boolean true");

    const script = ""
      + 'if true {\r\n'
      + '   discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });

  suite.add(function () {
    suite.log("Boolean false");

    const script = ""
      + 'if false {\r\n'
      + '   discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });

})();
