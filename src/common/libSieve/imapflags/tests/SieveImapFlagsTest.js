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

  suite.description("imap4flags Unit Tests...");

  suite.add("RFC5232 Snippet I", () => {

    const script = ''
      + 'require "imap4flags";\r\n'
      + 'if size :over 500K {\r\n'
      + '    setflag "\\\\Deleted";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["imap4flags"]);
  });

  suite.add("RFC5232 Snippet II", () => {

    const script = ''
      + 'require "imap4flags";\r\n'
      + 'require "fileinto";\r\n'
      + '\r\n'
      + 'if header :contains "from" "boss@frobnitzm.example.edu" {\r\n'
      + '    setflag "flagvar" "\\\\Flagged";\r\n'
      + '    fileinto :flags "${flagvar}" "INBOX.From Boss";\r\n'
      + '}\r\n'
      ;

    suite.expectValidScript(script, ["fileinto", "imap4flags"]);
  });

  suite.add("RFC5232 Snippet III", () => {

    const script = ''
      + 'require "imap4flags";\r\n'
      + '\r\n'
      + 'addflag "flagvar" "\\\\Deleted";\r\n'
      + 'addflag "flagvar" "\\\\Answered";\r\n'
      + '\r\n'
      + 'addflag "flagvar" ["\\\\Deleted", "\\\\Answered"];\r\n'
      + '\r\n'
      + 'addflag "flagvar" "\\\\Deleted \\\\Answered";\r\n'
      + '\r\n'
      + 'addflag "flagvar" "\\\\Answered \\\\Deleted";\r\n';

    suite.expectValidScript(script, ["imap4flags"]);
  });

  suite.add("RFC5232 Snippet IV", () => {

    const script = ''
      + 'require "imap4flags";\r\n'
      + 'require "fileinto";\r\n'
      + '\r\n'
      + 'if header :contains "Disposition-Notification-To"\r\n'
      + '    "mel@example.com" {\r\n'
      + '     addflag "flagvar" "$MDNRequired";\r\n'
      + '}\r\n'
      + 'if header :contains "from" "imap@cac.washington.example.edu" {\r\n'
      + '    removeflag "flagvar" "$MDNRequired";\r\n'
      + '    fileinto :flags "${flagvar}" "INBOX.imap-list";\r\n'
      + '}\r\n';


    suite.expectValidScript(script, ["imap4flags", "fileinto"]);
  });

  suite.add("RFC5232 Snippet V", () => {

    const script = ''
      + 'require "imap4flags";\r\n'
      + '\r\n'
      + 'if hasflag :is "b A" {}\r\n'
      + 'if hasflag ["b","A"] {}\r\n';

    suite.expectValidScript(script, ["imap4flags"]);
  });

  suite.add("RFC5232 Snippet VI", () => {

    const script = ''
      + 'require "imap4flags";\r\n'
      + '\r\n'
      + 'if hasflag :contains "MyVar" "Junk" {}\r\n'
      + 'if hasflag :contains "MyVar" "forward" {}\r\n'
      + 'if hasflag :contains "MyVar" ["label", "forward"] {}\r\n'
      + 'if hasflag :contains "MyVar" ["junk", "forward"] {}\r\n'
      + '\r\n'
      + 'if hasflag :contains "MyVar" "junk forward" {}\r\n'
      + 'if hasflag :contains "MyVar" "forward junk" {}\r\n'
      + '\r\n'
      + 'if hasflag :contains "MyVar" "label" {}\r\n'
      + '\r\n'
      + 'if hasflag :contains "MyVar" ["label1", "label2"] {}\r\n';

    suite.expectValidScript(script, ["imap4flags"]);

  });

  suite.add("RFC5232 Snippet VII", () => {

    const script = ''
      + 'require ["relational", "comparator-i;ascii-numeric", "imap4flags"];\r\n'
      + '\r\n'
      + 'if hasflag :count "ge" :comparator "i;ascii-numeric" "MyFlags" "2" {}\r\n'
      + '\r\n';

    suite.expectValidScript(script, ["imap4flags", "relational", "comparator-i;ascii-numeric"]);

  });

  suite.add("RFC5232 Snippet VIII", () => {

    const script = ''
      + 'require "imap4flags";\r\n'
      + 'require "fileinto";\r\n'
      + '\r\n'
      + 'fileinto :flags "\\\\Deleted" "INBOX.From Boss";\r\n'
      + 'keep :flags "${MyFlags}";\r\n';

    suite.expectValidScript(script, ["imap4flags", "fileinto"]);
  });

  suite.add("Extended Example", () => {

    const script = ''
      + '#\r\n'
      + '# Example Sieve Filter\r\n'
      + '# Declare any optional features or extension used by the script\r\n'
      + '#\r\n'
      + 'require ["fileinto", "imap4flags", "variables"];\r\n'
      + '\r\n'
      + '#\r\n'
      + '# Move large messages to a special mailbox\r\n'
      + '#\r\n'
      + '  if size :over 1M\r\n'
      + '        {\r\n'
      + '        addflag "MyFlags" "Big";\r\n'
      + '        if header :is "From" "boss@company.example.com"\r\n'
      + '                   {\r\n'
      + '# The message will be marked as "\\Flagged Big" when filed into\r\n'
      + '# mailbox "Big messages"\r\n'
      + '                   addflag "MyFlags" "\\\\Flagged";\r\n'
      + '                   }\r\n'
      + '        fileinto :flags "${MyFlags}" "Big messages";\r\n'
      + '        }\r\n'
      + '\r\n'
      + 'if header :is "From" "grandma@example.net"\r\n'
      + '        {\r\n'
      + '        addflag "MyFlags" ["\\\\Answered", "$MDNSent"];\r\n'
      + '# If the message is bigger than 1Mb it will be marked as\r\n'
      + '# "Big \\Answered $MDNSent" when filed into mailbox "grandma".\r\n'
      + '# If the message is shorter than 1Mb it will be marked as\r\n'
      + '# "\\Answered $MDNSent"\r\n'
      + '        fileinto :flags "${MyFlags}" "GrandMa";\r\n'
      + '        }\r\n'
      + '\r\n'
      + '#\r\n'
      + '# Handle messages from known mailing lists\r\n'
      + '# Move messages from IETF filter discussion list to filter folder\r\n'
      + '#\r\n'
      + 'if header :is "Sender" "owner-ietf-mta-filters@example.org"\r\n'
      + '        {\r\n'
      + '        set "MyFlags" "\\\\Flagged $Work";\r\n'
      + '# Message will have both "\\Flagged" and $Work flags\r\n'
      + '        keep :flags "${MyFlags}";\r\n'
      + '        }\r\n'
      + '\r\n'
      + '#\r\n'
      + '# Keep all messages to or from people in my company\r\n'
      + '#\r\n'
      + 'elsif anyof( address :domain :is ["From", "To"] "company.example.com")\r\n'
      + '        {\r\n'
      + '        keep :flags "${MyFlags}"; # keep in "Inbox" folder\r\n'
      + '        }\r\n'
      + '\r\n'
      + '# Try to catch unsolicited email.  If a message is not to me,\r\n'
      + '# or it contains a subject known to be spam, file it away.\r\n'
      + '#\r\n'
      + 'elsif anyof (not address :all :contains\r\n'
      + '               ["To", "Cc"] "me@company.example.com",\r\n'
      + '             header :matches "subject"\r\n'
      + '               ["*make*money*fast*", "*university*dipl*mas*"])\r\n'
      + '\r\n'
      + '        {\r\n'
      + '        removeflag "MyFlags" "\\\\Flagged";\r\n'
      + '        fileinto :flags "${MyFlags}" "spam";\r\n'
      + '        }\r\n'
      + 'else\r\n'
      + '        {\r\n'
      + '        # Move all other external mail to "personal"\r\n'
      + '        # folder.\r\n'
      + '        fileinto :flags "${MyFlags}" "personal";\r\n'
      + '        }\r\n';

    suite.expectValidScript(script, ["imap4flags", "fileinto", "variables"]);
  });

})();
