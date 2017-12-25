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

"use strict";

(function () {

  /* global net */
  /* global SieveDocument */
  /* global SieveLexer */

  let suite = net.tschmid.yautt.test;

  if (!suite)
    throw new Error("Could not append script test tools to test suite");


  suite.expectValidScript
    = function (script, capabilities) {

      if (capabilities)
        SieveLexer.capabilities(capabilities);


      let doc = new SieveDocument(SieveLexer, null);

      suite.logTrace("Start Parsing Script");
      doc.script(script);
      suite.logTrace("End Parsing Script");

      suite.logTrace("Start Serializing Script");
      let rv = doc.script();
      suite.logTrace("End Serializing Script");

      suite.assertEquals(script, rv);

      if (capabilities) {
        let requires = {};
        doc.root().require(requires);

        suite.logTrace(rv);

        for (let capability in capabilities) {
          suite.logTrace("Testing Capability: " + capability);
          suite.assertEquals(true, requires[capability]);
        }
      }

      return doc;
    };

  suite.expectInvalidScript
    = function (script, exception, capabilities) {

      if (capabilities)
        SieveLexer.capabilities(capabilities);

      let doc = new SieveDocument(SieveLexer, null);

      suite.logTrace("Start Parsing Script");
      try {
        doc.script(script);
      }
      catch (e) {
        suite.logTrace("Exception caught");
        suite.assertEquals(exception, e);

        return;
      }

      throw new Error("Exception expected");
    };

})();
