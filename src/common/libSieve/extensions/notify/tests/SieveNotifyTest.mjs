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

suite.description("Notify Unit Tests...");

suite.add("Notify Example 1", () => {

  const script = ''
    + 'require ["enotify", "fileinto", "variables"];\r\n'
    + '\r\n'
    + 'if header :contains "from" "boss@example.org" {\r\n'
    + '    notify :importance "1"\r\n'
    + '        :message "This is probably very important"\r\n'
    + '                    "mailto:alm@example.com";\r\n'
    + '    # Don\'t send any further notifications\r\n'
    + '    stop;\r\n'
    + '}\r\n'
    + '\r\n'
    + 'if header :contains "to" "sievemailinglist@example.org" {\r\n'
    + '    # :matches is used to get the value of the Subject header\r\n'
    + '    if header :matches "Subject" "*" {\r\n'
    + '        set "subject" "${1}";\r\n'
    + '    }\r\n'
    + '    \r\n'
    + '    # :matches is used to get the value of the From header\r\n'
    + '    if header :matches "From" "*" {\r\n'
    + '        set "from" "${1}";\r\n'
    + '    }\r\n'
    + '    \r\n'
    + '    notify :importance "3"\r\n'
    + '        :message "[SIEVE] ${from}: ${subject}"\r\n'
    + '        "mailto:alm@example.com";\r\n'
    + '    fileinto "INBOX.sieve";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["enotify", "fileinto", "variables"]);
});


suite.add("Notify Example 2", () => {

  const script = ''
    + 'require ["enotify", "fileinto", "variables", "envelope"];\r\n'
    + '\r\n'
    + 'if header :matches "from" "*@*.example.org" {\r\n'
    + '    # :matches is used to get the MAIL FROM address\r\n'
    + '    if envelope :all :matches "from" "*" {\r\n'
    + '        set "env_from" " [really: ${1}]";\r\n'
    + '    }\r\n'
    + '    \r\n'
    + '    # :matches is used to get the value of the Subject header\r\n'
    + '    if header :matches "Subject" "*" {\r\n'
    + '        set "subject" "${1}";\r\n'
    + '    }\r\n'
    + '    \r\n'
    + '    # :matches is used to get the address from the From header\r\n'
    + '    if address :matches :all "from" "*" {\r\n'
    + '        set "from_addr" "${1}";\r\n'
    + '    }\r\n'
    + '    \r\n'
    + '    notify :message "${from_addr}${env_from}: ${subject}"\r\n'
    + '                    "mailto:alm@example.com";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["enotify", "fileinto", "variables", "envelope"]);
});


suite.add("Notify Example 3", () => {

  const script = ''
    + 'require ["enotify", "variables"];\r\n'
    + '\r\n'
    + 'set "notif_method"\r\n'
    + '"xmpp:tim@example.com?message;subject=SIEVE;body=You%20got%20mail";\r\n'
    + '\r\n'
    + 'if header :contains "subject" "Your dog" {\r\n'
    + '  set "notif_method" "tel:+14085551212";\r\n'
    + '}\r\n'
    + '\r\n'
    + 'if header :contains "to" "sievemailinglist@example.org" {\r\n'
    + '  set "notif_method" "";\r\n'
    + '}\r\n'
    + '\r\n'
    + 'if not string :is "${notif_method}" "" {\r\n'
    + '  notify "${notif_method}";\r\n'
    + '}\r\n'
    + '\r\n'
    + 'if header :contains "from" "boss@example.org" {\r\n'
    + '  # :matches is used to get the value of the Subject header\r\n'
    + '  if header :matches "Subject" "*" {\r\n'
    + '      set "subject" "${1}";\r\n'
    + '  }\r\n'
    + '  \r\n'
    + '  # don\'t need high importance notification for\r\n'
    + '  # a \'for your information\'\r\n'
    + '  if not header :contains "subject" "FYI:" {\r\n'
    + '      notify :importance "1" :message "BOSS: ${subject}"\r\n'
    + '                         "tel:+14085551212";\r\n'
    + '  }\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["enotify", "variables"]);
});


suite.add("Notify Example 4", () => {

  const script = ''
    + 'require ["enotify"];\r\n'
    + '\r\n'
    + 'if not valid_notify_method ["mailto:",\r\n'
    + '        "http://gw.example.net/notify?test"] {\r\n'
    + '    stop;\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["enotify"]);
});


suite.add("Notify Example 5", () => {

  const script = ''
    + 'require ["enotify"];\r\n'
    + '\r\n'
    + 'if notify_method_capability\r\n'
    + '       "xmpp:tim@example.com?message;subject=SIEVE"\r\n'
    + '       "Online"\r\n'
    + '       "yes" {\r\n'
    + '    notify :importance "1" :message "You got mail"\r\n'
    + '         "xmpp:tim@example.com?message;subject=SIEVE";\r\n'
    + '} else {\r\n'
    + '    notify :message "You got mail" "tel:+14085551212";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["enotify"]);
});


suite.add("Notify Example 6", () => {

  const script = ''
    + 'require ["enotify", "variables"];\r\n'
    + '\r\n'
    + 'set :encodeurl "body_param" "Safe body&evil=evilbody";\r\n'
    + '\r\n'
    + 'notify "mailto:tim@example.com?body=${body_param}";\r\n';

  suite.expectValidScript(script, ["enotify", "variables"]);
});

