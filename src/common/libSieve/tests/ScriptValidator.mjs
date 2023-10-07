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
import { SieveCapabilities } from "./../toolkit/logic/GenericCapabilities.mjs";

let suite = null;

if ((typeof(global) !== "undefined") && (global.net))
  suite = global.net.tschmid.yautt.test;
else if ((typeof(window) !== "undefined") && (window.net))
  suite = window.net.tschmid.yautt.test;
else
  throw new Error("Failed to detect global scope.");

if (!suite)
  throw new Error("Could not append script test tools to test suite");

/**
 * Parses the given script and returns a SieveDocument.
 * It honors the server's capabilities.
 *
 * @param {string} script
 *   the script to parse
 * @param {{[key:string]:boolean}} [capabilities]
 *   optional parameter which simulates the the server's capabilities
 *
 * @returns {SieveDocument}
 *  the parsed sieve document
 */
function parseScript(script, capabilities) {

  const doc = SieveGrammar.create(capabilities);

  doc.setScript(script);

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
  const rv = doc.getScript();
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

  const doc = SieveGrammar.create(capabilities);

  suite.logTrace("Start Parsing Script");
  suite.assertThrows(() => {
    doc.setScript(script);
  }, exception);
}

suite.expectInvalidScript = expectInvalidScript;

/**
 * First it creates an element by its type then converts it
 * to a script and validates it against the snippet.
 *
 * Then does it does the reverse. It initializes the element with the snippet
 * and converts it to a script. The result has to be equal to the snippet.
 *
 * By default the element is be initialized with the snippet.
 * But if init is set to false, it won't be initialized and thus falls back
 * to default values.
 *
 * @param {string} type
 *   the element to be created
 * @param {string} snippet
 *   the snippet.
 * @param {string[]} [capabilities]
 *   a string array with sieve capabilities needed for the test.
 * @param {boolean} [init]
 *   if true the new new element will be initialized with snippet.
 */
function expectValidSnippet(type, snippet, capabilities, init) {

  const initializer = (init === false ? undefined : snippet);

  const doc = SieveGrammar.create(capabilities);

  // Create element with defaults and convert it to a script snippet...
  const element = doc.createByName(type, initializer);
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

/**
 * Creates a new element without initializing it, this creates the element
 * with his defaults values.
 *
 * The resulting element is then converted to a script and compared against
 * the expected snippet.
 *
 * @param {string} type
 *   the element to be created.
 * @param {string} expected
 *   the expected snippet.
 * @param {string[]} [capabilities]
 *   a string array with sieve capabilities needed for the test.
 */
function expectDefaultSnippet(type, expected, capabilities) {
  suite.expectValidSnippet(type, expected, capabilities, false);
}

suite.expectDefaultSnippet = expectDefaultSnippet;


/**
 * Creates an element for the given type and initializes it with the snippet.
 * It expects that an exceptions is thrown while parsing.
 *
 * @param {string} type
 *   the element to be created.
 * @param {string} snippet
 *   the snippet.
 * @param {string} exception
 *   the expected exception's message.
 * @param {string[]} [capabilities]
 *   a string array with sieve capabilities needed for the test.
 */
function expectInvalidSnippet(type, snippet, exception, capabilities) {
  suite.assertThrows(() => {
    expectValidSnippet(type, snippet, capabilities, true);
  }, exception);
}

suite.expectInvalidSnippet = expectInvalidSnippet;
