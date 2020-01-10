/*
* The contents of this file are licenced. You may obtain a copy of
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
    suite.log("Convert Unit Tests...");
  });

  suite.add(function () {

    suite.log("RFC 6558 - Example I");

    const script = ""
      + 'require ["convert"];\r\n'
      + 'convert "image/tiff" "image/jpeg" ["pix-x=320","pix-y=240"];\r\n';

    suite.expectValidScript(script, ["convert"]);
  });

  suite.add(function () {

    suite.log("RFC 6558 - Example 2");

    const script = ""
      + 'require ["fileinto", "convert"];\r\n'
      // + 'require ["mime", "fileinto", "convert"];\r\n'
      // + 'if header :mime :anychild :contenttype\r\n'
      // + '          "Content-Type" "image/tiff"\r\n'
      // + '{\r\n'
      + ' if convert "image/tiff" "image/jpeg" ["pix-x=320","pix-y=240"]\r\n'
      + ' {\r\n'
      + '  fileinto "INBOX.pics";\r\n'
      + ' }\r\n'
      // + '}\r\n'
      ;

    suite.expectValidScript(script, ["convert", "fileinto"]);
  });


  // FIXME: Enable tests as soon as for every part is implemented
  /*
  suite.add(function () {

    suite.log("RFC 6558 - Example 3");

    let script = ""
      + 'require ["mime", "foreverypart", "fileinto", "convert"];\r\n'
      + 'foreverypart\r\n'
      + '{\r\n'
      + '  if header :mime :param "filename" :contains\r\n'
      + '            "Content-Disposition" "inline"\r\n'
      + '  {\r\n'
      + '    if size :over "500K"\r\n'
      + '    {\r\n'
      + '     convert "image/tiff" "image/jpeg" ["pix-x=640","pix-y=480"];\r\n'
      + '    } else {\r\n'
      + '     convert "image/tiff" "image/jpeg" ["pix-x=320","pix-y=240"];\r\n'
      + '    }\r\n'
      + '  }\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["mime", "foreverypart", "fileinto", "convert"]);
  });

  suite.add(function () {

    suite.log("RFC 6558 - Example 4");

    let script = ""
      + 'require ["mime", "foreverypart", "fileinto", "redirect", "convert"];\r\n'
      + '\r\n'
      + '# The first "if" block will convert all image/tiff body parts\r\n'
      + '# to 640x480 jpegs and will file the message\r\n'
      + '# into the "INBOX.pics" mailbox as converted at this point.\r\n'
      + 'if header :mime :anychild :contenttype\r\n'
      + '    "Content-Type" "image/tiff"\r\n'
      + '{\r\n'
      + '    convert "image/tiff" "image/jpeg" ["pix-x=640","pix-y=480"];\r\n'
      + '    fileinto "INBOX.pics";\r\n'
      + '}\r\n'
      + '\r\n'
      + '# The second block, the "foreverypart" loop, will convert all\r\n'
      + '# inline jpegs to 320x240 resolution... including any tiff body\r\n'
      + '# parts that had been converted in the first block, above.\r\n'
      + '# Therefore, any tiff that had been converted to a 640x480 jpeg\r\n'
      + '# will be re-converted to a 320x240 jpeg here if its\r\n'
      + '# Content-Disposition is specified as "inline".\r\n'
      + 'foreverypart\r\n'
      + '{\r\n'
      + '    if header :mime :param "filename" :contains\r\n'
      + '      "Content-Disposition" "inline"\r\n'
      + '    {\r\n'
      + '        convert "image/jpeg" "image/jpeg" ["pix-x=320","pix-y=240"];\r\n'
      + '    }\r\n'
      + '}\r\n'
      + '\r\n'
      + '# The third block will take any message that contains a header\r\n'
      + '# field called "Mobile-Link" and redirect it to the user\'s\r\n'
      + '# mobile address.  The redirected message will include both\r\n'
      + '# conversions above, from block one and block two.\r\n'
      + 'if exists "Mobile-Link"\r\n'
      + '{\r\n'
      + '    redirect "joe@mobile.example.com";\r\n'
      + '}\r\n'
      + '\r\n'
      + '# The fourth block will file the message into "Tiff" if it\r\n'
      + '# contains any tiff body parts.  But because of the earlier\r\n'
      + '# conversion (in the first block), there will never be any\r\n'
      + '# tiff body parts, so this "fileinto" will never happen.\r\n'
      + 'if header :mime :anychild :contenttype\r\n'
      + '    "Content-Type" "image/tiff"\r\n'
      + '{\r\n'
      + '    fileinto "Tiff";\r\n'
      + '}\r\n'
      + '\r\n'
      + '# Now, at the end of the script processing, the Sieve\r\n'
      + '# processor will perform an implicit keep if none of\r\n'
      + '# the "fileinto" and "redirect" actions were taken.\r\n'
      + '# The kept message will include any conversions that\r\n'
      + '# were done (that is, any from the second block).\r\n';

    suite.expectValidScript(script, ["mime", "foreverypart", "fileinto", "redirect", "convert"]);
  });*/

})();
