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

suite.description("Mime Unit Tests...");

suite.add("Mime Snippet 1", () => {

  const script = ''
    + 'require ["mime", "fileinto"];\r\n'
    + '\r\n'
    + 'if header :mime :type "Content-Type" "image"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.images";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["mime", "fileinto"]);
});

suite.add("Mime Snippet 2", () => {

  const script = ''
    + 'require ["mime", "fileinto"];\r\n'
    + '\r\n'
    + 'if header :mime :anychild :contenttype\r\n'
    + '          "Content-Type" "text/html"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.html";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["mime", "fileinto"]);
});

suite.add("Mime Snippet 3", () => {

  const script = ''
    + 'require ["mime", "foreverypart", "fileinto"];\r\n'
    + '\r\n'
    + 'foreverypart\r\n'
    + '{\r\n'
    + '    if allof (\r\n'
    + '      header :mime :param "filename" :contains\r\n'
    + '         "Content-Disposition" "important",\r\n'
    + '      header :mime :subtype "Content-Type" "pdf",\r\n'
    + '      size :over "100K")\r\n'
    + '    {\r\n'
    + '        fileinto "INBOX.important";\r\n'
    + '        break;\r\n'
    + '    }\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["mime", "foreverypart", "fileinto"]);
});

suite.add("Mime Snippet 4", () => {

  const script = ''
    + 'require ["mime", "fileinto"];\r\n'
    + '\r\n'
    + 'if address :mime :is :all "content-from" "tim@example.com"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.part-from-tim";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["mime", "fileinto"]);
});

suite.add("Mime Snippet 5", () => {

  const script = ''
    + 'require ["mime", "fileinto"];\r\n'
    + '\r\n'
    + 'if exists :mime :anychild "content-md5"\r\n'
    + '{\r\n'
    + '    fileinto "INBOX.md5";\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["mime", "fileinto"]);
});

suite.add("Mime Example 1", () => {

  const script = ''

    + 'require [ "foreverypart", "mime", "replace" ];\r\n'
    + 'foreverypart\r\n'
    + '{\r\n'
    + '  if anyof (\r\n'
    + '         header :mime :contenttype :is\r\n'
    + '           "Content-Type" "application/exe",\r\n'
    + '         header :mime :param "filename"\r\n'
    + '           :matches ["Content-Type", "Content-Disposition"] "*.com" )\r\n'
    + '  {\r\n'
    + '    replace "Executable attachment removed by user filter";\r\n'
    + '  }\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["foreverypart", "mime", "replace"]);
});

suite.add("Mime Example 2", () => {

  const script = ''
    + 'require [ "foreverypart", "mime", "enclose" ];\r\n'
    + '\r\n'
    + 'foreverypart\r\n'
    + '{\r\n'
    + '  if header :mime :param "filename"\r\n'
    + '     :matches ["Content-Type", "Content-Disposition"]\r\n'
    + '       ["*.com", "*.exe", "*.vbs", "*.scr",\r\n'
    + '        "*.pif", "*.hta", "*.bat", "*.zip" ]\r\n'
    + '  {\r\n'
    + '    # these attachment types are executable\r\n'
    + '    enclose :subject "Warning" :text\r\n'
    + 'WARNING! The enclosed message contains executable attachments.\r\n'
    + 'These attachment types may contain a computer virus program\r\n'
    + 'that can infect your computer and potentially damage your data.\r\n'
    + '\r\n'
    + 'Before clicking on these message attachments, you should verify\r\n'
    + 'with the sender that this message was sent by them and not a\r\n'
    + 'computer virus.\r\n'
    + '.\r\n'
    + ';\r\n'
    + '    break;\r\n'
    + '  }\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["foreverypart", "mime", "enclose"]);
});

suite.add("Mime Example 3", () => {

  const script = ''
    + 'require ["mime", "variables", "extracttext"];\r\n'
    + '\r\n'
    + 'if header :contains "from" "boss@example.org"\r\n'
    + '{\r\n'
    + '  # :matches is used to get the value of the Subject header\r\n'
    + '  if header :matches "Subject" "*"\r\n'
    + '  {\r\n'
    + '    set "subject" "${1}";\r\n'
    + '  }\r\n'
    + '\r\n'
    + '  # extract the first 100 characters of the first text/* part\r\n'
    + '  foreverypart\r\n'
    + '  {\r\n'
    + '    if header :mime :type :is "Content-Type" "text"\r\n'
    + '    {\r\n'
    + '      extracttext :first 100 "msgcontent";\r\n'
    + '      break;\r\n'
    + '    }\r\n'
    + '  }\r\n'
    + '\r\n'
    + '  # if it\'s not a \'for your information\' message\r\n'
    + '  if not header :contains "subject" "FYI:"\r\n'
    + '  {\r\n'
    + '    # do something using ${subject} and ${msgcontent}\r\n'
    + '    # such as sending a notification using a\r\n'
    + '    # notification extension\r\n'
    + '  }\r\n'
    + '}\r\n';

  suite.expectValidScript(script, ["mime", "variables", "extracttext"]);
});

