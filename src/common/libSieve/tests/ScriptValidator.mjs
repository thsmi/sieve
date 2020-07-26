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

import { SieveGrammar } from "./../toolkit/logic/GenericElements.mjs";
import { SieveLexer } from "./../toolkit/SieveLexer.mjs";
import { SieveDocument } from "./../toolkit/SieveScriptDOM.mjs";
import { SieveCapabilities } from "./../toolkit/logic/GenericCapabilities.mjs";

let suite = null;

if (global.net)
  suite = global.net.tschmid.yautt.test;
else
  suite = exports.net.tschmid.yautt.test;

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
 * Serializes the document and compares it against the given script.
 * In case it does not meet the expectations an exception is thrown.
 *
 * @param {SieveDocument} doc
 *   the documents to be tested.
 * @param {string} script
 *   the script with the expected outcome.
 * @param {string[]} [capabilities]
 *   a string array with sieve capabilities needed for the test.
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
 * Parses the given script and serializes it back into a string.
 * The serialized string is then compared against the original script.
 *
 * In case the validation failed an exception is thrown.
 *
 * @param {script} script
 *   the script to be validated
 * @param {string[]} capabilities
 *   a string array with sieve capabilities needed for the test.
 */
function expectValidScript(script, capabilities) {

  suite.logTrace("Start Parsing Script");
  const doc = suite.parseScript(script, capabilities);
  suite.logTrace("End Parsing Script");

  suite.logTrace("Start Serializing Script");
  validateDocument(doc, script, capabilities);
  suite.logTrace("End Serializing Script");
}

suite.expectValidScript = expectValidScript;

/**
 * Parses the given script and expects it to fail with the given exception.
 * The exception is compared by its message text. It will just check if
 * the exception starts with the message test. So it does not have to be
 * a perfect match.
 *
 * @param {string} script
 *   the script to be tested.
 * @param {string} exception
 *   the message with which the exception has to start.
 * @param {string[]} [capabilities]
 *   a string array with sieve capabilities needed for the test.
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
 * First it creates an element by its type with default values, converts it
 * to a script and validates it against the snippet.
 *
 * Then does it does the reverse. It initializes the element with the snippet
 * and converts it to a script. The result has to be equal to the snippet.
 *
 * @param {string} type
 *   the element to be created
 * @param {string} snippet
 *   the snippet
 * @param {string[]} [capabilities]
 *   a string array with sieve capabilities needed for the test.
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

  if (!capabilities)
    return;

  const dependencies = new SieveCapabilities(capabilities);
  element.require(dependencies);

  suite.logTrace(rv1);

  for (const capability of capabilities) {
    suite.logTrace("Testing Capability: " + capability);
    suite.assertTrue(
      dependencies.hasCapability(capability),
      `Did not find capability '${capability}'`);
  }
}

suite.expectValidSnippet = expectValidSnippet;
