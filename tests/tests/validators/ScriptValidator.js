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

(function (exports) {

  "use strict";

  /* global SieveDocument */
  /* global SieveLexer */
  /* global SieveGrammar */
  /* global SieveCapabilities */

  const suite = exports.net.tschmid.yautt.test;

  if (!suite)
    throw new Error("Could not append script test tools to test suite");

  /**
   * Parses the given script and returns a SieveDocument.
   * It honors the server's capabilities.
   *
   * @param {string} script
   *   the script to parse
   * @param {object.<string, boolean>} [capabilities]
   *   optional parameter which simulates the the server's capabilities
   *
   * @returns {SieveDocument}
   *  the parsed sieve document
   */
  function parseScript(script, capabilities) {

    SieveGrammar.create(capabilities);

    if (capabilities)
      SieveLexer.capabilities(capabilities);

    const doc = new SieveDocument(SieveLexer, null);

    doc.script(script);

    return doc;
  }

  suite.parseScript = parseScript;

  /**
   *
   * @param {*} doc
   * @param {*} script
   * @param {*} capabilities
   */
  function validateDocument(doc, script, capabilities) {

    suite.logTrace("Start Serializing Script");
    const rv = doc.script();
    suite.logTrace("End Serializing Script");

    suite.assertEquals(script, rv);

    if (capabilities) {
      const dependencies = new SieveCapabilities(capabilities);
      doc.root().require(dependencies);

      suite.logTrace(rv);

      for (const capability of capabilities) {
        suite.logTrace("Testing Capability: " + capability);
        suite.assertTrue(dependencies.hasCapability(capability), "Did not find capability '" + capability + "'");
      }
    }
  }
  suite.validateDocument = validateDocument;

  /**
   *
   * @param {*} script
   * @param {*} capabilities
   */
  function expectValidScript(script, capabilities) {

    suite.logTrace("Start Parsing Script");
    const doc = suite.parseScript(script, capabilities);
    suite.logTrace("End Parsing Script");

    suite.logTrace("Start Serializing Script");
    validateDocument(doc, script, capabilities);
    suite.logTrace("End Serializing Script");

    return doc;
  }

  suite.expectValidScript = expectValidScript;

  /**
   *
   * @param {*} script
   * @param {*} exception
   * @param {*} capabilities
   */
  function expectInvalidScript(script, exception, capabilities) {

    SieveGrammar.create(capabilities);

    if (capabilities)
      SieveLexer.capabilities(capabilities);

    const doc = new SieveDocument(SieveLexer, null);

    suite.logTrace("Start Parsing Script");
    try {
      doc.script(script);
    }
    catch (e) {
      suite.logTrace("Exception caught");
      suite.assertEquals(exception, e.toString().substr(0, exception.length));

      return;
    }

    throw new Error("Exception expected");
  }

  suite.expectInvalidScript = expectInvalidScript;

  /**
   *
   * @param {*} type
   * @param {*} snippet
   * @param {*} capabilities
   */
  function expectValidSnippet(type, snippet, capabilities) {

    SieveGrammar.create(capabilities);

    if (capabilities)
      SieveLexer.capabilities(capabilities);

    const doc = new SieveDocument(SieveLexer, null);

    // Create element with defaults and convert it to a script snippet...
    const element = doc.createByName(type);
    const rv1 = element.toScript();

    // ... and should match our expectation.
    suite.assertEquals(snippet, rv1);

    // ... then try to parse these script snippet
    const rv2 = doc.createByName(type, rv1).toScript();

    // and ensure both snippets should be identical...
    suite.assertEquals(rv1, rv2);

    if (capabilities) {

      const dependencies = new SieveCapabilities(capabilities);
      element.require(dependencies);

      suite.logTrace(rv1);

      for (const capability of capabilities) {
        suite.logTrace("Testing Capability: " + capability);
        suite.assertTrue(dependencies.hasCapability(capability), "Did not find capability '" + capability + "'");
      }
    }

    return doc;
  }

  suite.expectValidSnippet = expectValidSnippet;

})(this);
