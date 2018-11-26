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
    suite.log("Examples from Dovecot...");
    suite.log("https://wiki2.dovecot.org/Pigeonhole/Sieve/Examples");
  });


  suite.add(function () {

    suite.log("Dovecot - Mail filtering by various headers I");

    let script = ''
      + 'require ["fileinto", "envelope"];\r\n'
      + 'if address :is "to" "dovecot@dovecot.org" {\r\n'
      + '  fileinto "Dovecot-list";\r\n'
      + '} elsif envelope :is "from" "owner-cipe-l@inka.de" {\r\n'
      + '  fileinto "lists.cipe";\r\n'
      + '} elsif anyof (header :contains "X-listname" "lugog@cip.rz.fh-offenburg.de",\r\n'
      + '               header :contains "List-Id" "Linux User Group Offenburg") {\r\n'
      + '  fileinto "ml.lugog";\r\n'
      + '} else {\r\n'
      + '  # The rest goes into INBOX\r\n'
      + '  # default is "implicit keep", we do it explicitly here\r\n'
      + '  keep;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["fileinto", "envelope"]);
  });


  suite.add(function () {

    suite.log("Mail filtering by various headers II");

    let script = ''
      + 'if header :contains "subject" ["order", "buy"] {\r\n'
      + '  redirect "orders@company.dom";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, []);
  });


  suite.add(function () {

    suite.log("Flagging or Highlighting your mail I");

    let script = ''
      + 'require "imap4flags";\r\n'
      + 'require "regex";\r\n'
      + 'if anyof (exists "X-Cron-Env",\r\n'
      + '          header :regex    ["subject"] [".* security run output",\r\n'
      + '                                        ".* monthly run output",\r\n'
      + '                                        ".* daily run output",\r\n'
      + '                                        ".* weekly run output"]) {\r\n'
      + '  addflag "$label1"; # ie \'Important\'/red label within Thunderbird\r\n'
      + '\r\n'
      + '# Other flags:\r\n'
      + '# addflag "$label1";  # Important: #ff0000 => red\r\n'
      + '# addflag "$label2";  # Work:      #ff9900 => orange\r\n'
      + '# addflag "$label3";  # personal:  #009900 => green\r\n'
      + '# addflag "$label4";  # todo:      #3333ff => blue\r\n'
      + '# addflag "$label5";  # later:     #993399 => violet\r\n'
      + '#\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["imap4flags", "regex"]);
  });

  suite.add(function () {

    suite.log("Flagging or Highlighting your mail II");

    let script = ''
      + 'require ["envelope", "imap4flags"];\r\n'
      + 'if envelope "from" "my_address@my_domain.com"\r\n'
      + '{\r\n'
      + '   setflag "\\\\seen";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["envelope", "imap4flags"]);
  });


  suite.add(function () {

    suite.log("Direct filtering using message header I");

    let script = ''
      + 'require "fileinto";\r\n'
      + 'if header :contains "X-Spam-Flag" "YES" {\r\n'
      + '  fileinto "Spam";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["fileinto"]);
  });


  suite.add(function () {

    suite.log("Direct filtering using message header II");

    let script = ''
      + 'if header :contains "X-Spam-Level" "**********" {\r\n'
      + '  discard;\r\n'
      + '  stop;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, []);
  });


  suite.add(function () {

    suite.log("Direct filtering using message header III");

    let script = ''
      + 'require ["comparator-i;ascii-numeric","relational"];\r\n'
      + 'if allof (\r\n'
      + '   not header :matches "x-spam-score" "-*",\r\n'
      + '   header :value "ge" :comparator "i;ascii-numeric" "x-spam-score" "10" )\r\n'
      + '{\r\n'
      + '  discard;\r\n'
      + '  stop;\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["comparator-i;ascii-numeric", "relational"]);
  });


  suite.add(function () {

    suite.log("Filtering using the spamtest and virustest extensions I");

    let script = ''
      + 'require "spamtestplus";\r\n'
      + 'require "fileinto";\r\n'
      + 'require "relational";\r\n'
      + 'require "comparator-i;ascii-numeric";\r\n'
      + '\r\n'
      + '/* If the spamtest fails for some reason, e.g. spam header is missing, file\r\n'
      + ' * file it in a special folder.\r\n'
      + ' */\r\n'
      + 'if spamtest :value "eq" :comparator "i;ascii-numeric" "0" {\r\n'
      + '  fileinto "Unclassified";\r\n'
      + '\r\n'
      + '/* If the spamtest score (in the range 1-10) is larger than or equal to 3,\r\n'
      + ' * file it into the spam folder:\r\n'
      + ' */\r\n'
      + '} elsif spamtest :value "ge" :comparator "i;ascii-numeric" "3" {\r\n'
      + '  fileinto "Spam";\r\n'
      + '\r\n'
      + '/* For more fine-grained score evaluation, the :percent tag can be used. The\r\n'
      + ' * following rule discards all messages with a percent score\r\n'
      + ' * (relative to maximum) of more than 85 %:\r\n'
      + ' */\r\n'
      + '} elsif spamtest :value "gt" :comparator "i;ascii-numeric" :percent "85" {\r\n'
      + '  discard;\r\n'
      + '}\r\n'
      + '\r\n'
      + '/* Other messages get filed into INBOX */\r\n';

    suite.expectValidScript(script,
      ["spamtestplus", "fileinto", "relational", "comparator-i;ascii-numeric"]);
  });


  suite.add(function () {

    suite.log("Filtering using the spamtest and virustest extensions II");

    let script = ''
      + 'require "virustest";\r\n'
      + 'require "fileinto";\r\n'
      + 'require "relational";\r\n'
      + 'require "comparator-i;ascii-numeric";\r\n'
      + '\r\n'
      + '/* Not scanned ? */\r\n'
      + 'if virustest :value "eq" :comparator "i;ascii-numeric" "0" {\r\n'
      + '  fileinto "Unscanned";\r\n'
      + '\r\n'
      + '/* Infected with high probability (value range in 1-5) */\r\n'
      + '} if virustest :value "eq" :comparator "i;ascii-numeric" "4" {\r\n'
      + '  /* Quarantine it in special folder (still somewhat dangerous) */\r\n'
      + '  fileinto "Quarantine";\r\n'
      + '\r\n'
      + '/* Definitely infected */\r\n'
      + '} elsif virustest :value "eq" :comparator "i;ascii-numeric" "5" {\r\n'
      + '  /* Just get rid of it */\r\n'
      + '  discard;\r\n'
      + '}\r\n';

    suite.expectValidScript(script,
      ["virustest", "fileinto", "relational", "comparator-i;ascii-numeric"]);
  });


  suite.add(function () {

    suite.log("Plus Addressed mail filtering I");

    let script = ''
      + 'require ["fileinto", "envelope", "subaddress"];\r\n'
      + 'if envelope :detail "to" "spam"{\r\n'
      + '  fileinto "Spam";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["fileinto", "envelope", "subaddress"]);
  });


  suite.add(function () {

    suite.log("Plus Addressed mail filtering II");

    let script = ''
      + 'require ["variables", "envelope", "fileinto", "subaddress"];\r\n'
      + '\r\n'
      + 'if envelope :is :user "to" "sales" {\r\n'
      + '  if envelope :matches :detail "to" "*" {\r\n'
      + '    /* Save name in ${name} in all lowercase except for the first letter.\r\n'
      + '     * Joe, joe, jOe thus all become \'Joe\'.\r\n'
      + '     */\r\n'
      + '    set :lower :upperfirst "name" "${1}";\r\n'
      + '  }\r\n'
      + '\r\n'
      + '  if string :is "${name}" "" {\r\n'
      + '    /* Default case if no detail is specified */\r\n'
      + '    fileinto "sales";\r\n'
      + '  } else {\r\n'
      + '    /* For sales+joe@ this will become users/Joe */\r\n'
      + '    fileinto "users/${name}";\r\n'
      + '  }\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["variables", "envelope", "fileinto", "subaddress"]);
  });


  suite.add(function () {

    suite.log("Vacation auto-reply I");

    let script = ''
      + 'require ["fileinto", "vacation"];\r\n'
      + '# Move spam to spam folder\r\n'
      + 'if header :contains "X-Spam-Flag" "YES" {\r\n'
      + '  fileinto "spam";\r\n'
      + '  # Stop here so that we do not reply on spams\r\n'
      + '  stop;\r\n'
      + '}\r\n'
      + 'vacation\r\n'
      + '  # Reply at most once a day to a same sender\r\n'
      + '  :days 1\r\n'
      + '  :subject "Out of office reply"\r\n'
      + '  # List of additional recipient addresses which are included in the auto replying.\r\n'
      + '  # If a mail\'s recipient is not the envelope recipient and it\'s not on this list,\r\n'
      + '  # no vacation reply is sent for it.\r\n'
      + '  :addresses ["j.doe@company.dom", "john.doe@company.dom"]\r\n'
      + '"I\'m out of office, please contact Joan Doe instead.\r\n'
      + 'Best regards\r\n'
      + 'John Doe";\r\n';

    suite.expectValidScript(script, ["fileinto", "vacation"]);
  });


  suite.add(function () {

    suite.log("Vacation auto-reply II");

    let script = ''
      + 'require ["variables", "vacation"];\r\n'
      + '# Store old Subject line so it can be used in vacation message\r\n'
      + 'if header :matches "Subject" "*" {\r\n'
      + '        set "subjwas" ": ${1}";\r\n'
      + '}\r\n'
      + 'vacation\r\n'
      + '  :days 1\r\n'
      + '  :subject "Out of office reply${subjwas}"\r\n'
      + '  :addresses ["j.doe@company.dom", "john.doe@company.dom"]\r\n'
      + '"I\'m out of office, please contact Joan Doe instead.\r\n'
      + 'Best regards\r\n'
      + 'John Doe";\r\n';


    suite.expectValidScript(script, ["variables", "vacation"]);
  });


  suite.add(function () {

    suite.log("Include scripts");

    let script = ''
      + 'require ["include"];\r\n'
      + 'include :global "global-spam";\r\n'
      + 'include :personal "my-own-spam";\r\n';

    suite.expectValidScript(script, ["include"]);
  });


  suite.add(function () {

    suite.log("Archiving a Mailinglist by Date");

    let script = ''
      + 'require ["variables","date","fileinto","mailbox"];\r\n'
      + '\r\n'
      + '# Extract date info\r\n'
      + 'if currentdate :matches "year" "*" { set "year" "${1}"; }\r\n'
      + 'if currentdate :matches "month" "*" { set "month" "${1}"; }\r\n'
      + '\r\n'
      + '# Archive Dovecot mailing list items by year and month.\r\n'
      + '# Create folder when it does not exist.\r\n'
      + 'if header :is "list-id" "dovecot.dovecot.org" {\r\n'
      + '  fileinto :create "INBOX.Lists.${year}.${month}.dovecot";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["variables", "date", "fileinto", "mailbox"]);
  });

})();
