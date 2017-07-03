/*
 * The contents of this file are licenced. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Rainer Müller <raimue@codingfarm.de>
 *
 */

"use strict";

(function() {

  /* global net */

  var suite = net.tschmid.yautt.test;

  if (!suite)
    throw "Could not initialize test suite";

  suite.add( function() {
    suite.log("Sieve Copy (RFC3894 Draft) unit tests...");
  });

  suite.add( function() {
    suite.log("Testing fileinto :copy");

    var script = ""
          + 'require "fileinto";\r\n'
          + 'require "copy";\r\n'
          + '\r\n'
          + 'if header :contains ["from"] "coyote" {\r\n'
          + '   fileinto :copy "INBOX.harassment";\r\n'
          + '}\r\n';

    suite.expectValidScript(script, {"fileinto":true, "copy":true});
  });

}());
