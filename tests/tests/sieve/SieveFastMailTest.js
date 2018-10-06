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
    suite.log("Examples from FastMail...");
    suite.log("https://www.fastmail.com/help/technical/sieve-examples.html");
  });

  suite.add(function () {

    suite.log("FastMail - File all messages from a recipient into a folder");

    let script = ''
      + 'require ["fileinto"];\r\n'
      + '\r\n'
      + 'if address :is "From" "pal@mypals.org" {\r\n'
      + '  fileinto "INBOX.My Best Pal";\r\n'
      + '  stop;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, { "fileinto": true });
  });


  suite.add(function () {

    suite.log("FastMail - File all messages from a domain into a folder");

    let script = ''
      + 'require ["fileinto"];\r\n'
      + '\r\n'
      + 'if address :domain :is "From" "mypals.org" {\r\n'
      + '  fileinto "INBOX.My Best Pal";\r\n'
      + '  stop;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, { "fileinto": true });
  });


  suite.add(function () {

    suite.log("FastMail - File all undefined addresses at a virtual domain into a folder");

    let script = ''
      + 'require ["fileinto"];\r\n'
      + '\r\n'
      + 'if allof(\r\n'
      + '  address :domain :is "X-Delivered-To" "mydomain.info",\r\n'
      + '  not address :localpart :is "X-Delivered-To" ["address1", "address2", "address3"] # these are valid addresses\r\n'
      + ') {\r\n'
      + '  fileinto "INBOX.Possible spam";\r\n'
      + '  stop;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, { "fileinto": true });
  });


  suite.add(function () {

    suite.log("FastMail - File messages to some aliases into alias-dependent folders");

    let script = ''
      + 'require ["fileinto", "imap4flags"];\r\n'
      + '\r\n'
      + 'if address :is "X-Delivered-To" "alias1@fastmail.fm" {\r\n'
      + '  fileinto "INBOX.alias1";\r\n'
      + '  stop;\r\n'
      + '} elsif address :is "X-Delivered-To" "alias2@sent.com" {\r\n'
      + '  setflag "\\\\Seen";\r\n'
      + '  fileinto "INBOX.alias2";\r\n'
      + '  stop;\r\n'
      + '} elsif address :is "X-Delivered-To" "alias3@eml.cc" {\r\n'
      + '  fileinto "INBOX.alias3";\r\n'
      + '  stop;\r\n'
      + '}\r\n'
      + '\r\n'
      + 'redirect "another@account.net";\r\n'
      + '\r\n';

    suite.expectValidScript(script, { "fileinto": true, "imap4flags" : true });
  });

  suite.add(function () {

    suite.log("FastMail - Spam filtering for SpamAssassin score");

    let script = ''
      + 'require ["fileinto","relational", "comparator-i;ascii-numeric"];\r\n'
      + '\r\n'
      + 'if  header :value "ge" :comparator "i;ascii-numeric" ["X-Spam-score"] ["20"]  {\r\n'
      + '  discard;\r\n'
      + '  stop;\r\n'
      + '}\r\n'
      + 'if  header :value "ge" :comparator "i;ascii-numeric" ["X-Spam-score"] ["8"]  {\r\n'
      + '  fileinto "INBOX.spam.spam";\r\n'
      + '  stop;\r\n'
      + '}\r\n'
      + 'if  header :value "ge" :comparator "i;ascii-numeric" ["X-Spam-score"] ["4"]  {\r\n'
      + '  fileinto "INBOX.spam";\r\n'
      + '  stop;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, { "fileinto": true, "relational":true, "comparator-i;ascii-numeric": true });
  });

  suite.add(function () {

    suite.log("FastMail - Spam filtering based on Bayesian filter)");

    let script = ''
      + 'require ["fileinto"];\r\n'
      + '\r\n'
      + 'if header :contains ["SPAM", "X-Spam-hits"] ["BAYES_40", "BAYES_44", "BAYES_50", "BAYES_56", "BAYES_60"]'
      + '{\r\n'
      + '  fileinto "INBOX.Junk Mail";\r\n'
      + '  stop;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, { "fileinto": true });
  });

  suite.add(function () {

    suite.log("FastMail - Filtering known messages as sent");

    let script = ''
      + 'require ["fileinto","imap4flags"];\r\n'
      + '\r\n'
      + 'if header :is ["X-Delivered-to"] "sent@domain.com" {\r\n'
      + '  setflag "\\\\Seen";\r\n'
      + '  fileinto "INBOX.Sent Items";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, { "fileinto": true, "imap4flags": true });
  });

  suite.add(function () {

    suite.log("FastMail - Do not filter known senders");

    let script = ''
      + '\r\n'
      + 'if not anyof(\r\n'
      + '  header :contains ["X-Spam-known-sender"] "yes",\r\n'
      + '  header :contains ["from"] ["amazon.co.uk", "myworkdomain.com"]\r\n'
      + ') {\r\n'
      + '  # ...filtering code goes here...\r\n'
      + '}\r\n';

    suite.expectValidScript(script);
  });

  suite.add(function () {

    suite.log("FastMail - Time-sensitive notification example");

    let script = ''
      + 'require ["regex"];\r\n'
      + '\r\n'
      + 'if allof (\r\n'
      + '        header :contains "X-Spam-known-sender" "yes",\r\n'
      + '        header :regex "date" "(08|09|10|11|12|13|14|15|16|17):..:..",\r\n'
      + '        not header :regex "date" "(sat|sun)",\r\n'
      + '        not header :contains "date" [\r\n'
      + '                "31 Mar 2006",\r\n'
      + '                "03 Apr 2006",\r\n'
      + '                "04 Apr 2006",\r\n'
      + '                "07 Apr 2006"\r\n'
      + '] ) {\r\n'
      // + '  notify :method "mailto" :options ["work.address@example.com"]\r\n'
      // + '       :message "$from$ / $subject$ / $text$";\r\n'
      // + '  keep;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, { "regex": true });
  });

})();
