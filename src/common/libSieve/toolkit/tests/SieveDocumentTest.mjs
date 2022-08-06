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

import { SieveDocument } from "../SieveDocument.mjs";

const suite = net.tschmid.yautt.test;

if (!suite)
  throw new Error("Could not initialize test suite");


const ONE_ELEMENT = 1;

/**
 * A helper to create a sieve document.
 * It ensures the rootnode exists so that the document can be safely constructed.
 *
 * @param {Map} grammar
 *   the document's grammar
 * @returns {SieveDocument}
 *   the newly created sieve document
 */
function createDocument(grammar) {
  grammar.set("block/rootnode", {
    onNew: () => { return null; }
  });

  return new SieveDocument(grammar);
}


suite.description("Sieve Document unit tests...");

suite.add("Sieve Document - Get spec by invalid name", () => {
  const spec = {};

  const grammar = new Map();
  grammar.set("action/something", spec);

  const doc = createDocument(grammar);

  suite.assertThrows(
    () => { doc.getSpecByName("@action/something"); },
    "Error: Invalid node name @action/something.");
});

suite.add("Sieve Document - Get spec by name", () => {
  const spec = {};

  const grammar = new Map();
  grammar.set("action/something", spec);

  const doc = createDocument(grammar);

  suite.assertEquals(
    spec, doc.getSpecByName("action/something"));
});

suite.add("Sieve Document - Element by invalid name", () => {
  const doc = createDocument(new Map());

  suite.assertThrows(
    () => { doc.supportsByName("@action/something"); },
    "Error: Invalid node name @action/something");

  suite.assertThrows(
    () => { doc.probeByName("@action/something", "document"); },
    "Error: Invalid node name @action/something");

  suite.assertThrows(
    () => { doc.createByName("@action/something"); },
    "Error: Invalid node name @action/something");
});

suite.add("Sieve Document - Element by unknown name", () => {
  const doc = createDocument(new Map());

  suite.assertFalse(
    doc.supportsByName("action/something"));

  suite.assertThrows(
    () => { doc.probeByName("action/something", "document"); },
    "Error: No specification for >>action/something<< found");

  suite.assertThrows(
    () => { doc.createByName("action/something"); },
    "Error: No specification for >>action/something<< found");
});

suite.add("Sieve Document - Unsupported element by name", () => {

  const spec = {};
  suite.mock.returns(spec, "onCapable", false);

  const grammar = new Map();
  grammar.set("action/something", spec);

  const doc = createDocument(grammar);

  // First check if our element is supported.
  suite.assertFalse(
    doc.supportsByName("action/something"));

  // Then check if it can be probed.
  suite.assertFalse(
    doc.probeByName("action/something", "document"));

  suite.assertThrows(
    () => { doc.createByName("action/something"); },
    "Error: Capability not supported");
});

suite.add("Sieve Document - Known incompatible element by name", () => {

  const spec = {};
  suite.mock.returns(spec, "onNew");
  suite.mock.returns(spec, "onCapable", true);
  suite.mock.returns(spec, "onProbe", false);

  const grammar = new Map();
  grammar.set("action/something", spec);

  const doc = createDocument(grammar);

  // Everything setup so start the test.

  // First check if our element is supported.
  suite.assertTrue(
    doc.supportsByName("action/something"));

  // Then check if it can be probed.
  suite.assertFalse(
    doc.probeByName("action/something", "document"));
});

suite.add("Sieve Document - Known Element by name (Empty Script)", () => {

  const spec = {};
  suite.mock.returns(spec, "onNew");
  suite.mock.returns(spec, "onCapable", true);
  suite.mock.returns(spec, "onProbe", true);

  const grammar = new Map();
  grammar.set("action/something", spec);

  const doc = createDocument(grammar);

  // First check if our element is supported.
  suite.assertTrue(
    doc.supportsByName("action/something"));

  // Then check if it can be probed.
  suite.assertFalse(
    doc.probeByName("action/something", ""));

  // Ensure on probe is never called.
  suite.mock.verify(spec, "onProbe", 0);
});

suite.add("Sieve Document - Known element by name", () => {

  // Define a spec which returns a dummy element.
  const something = {};
  suite.mock.returns(something, "init");
  suite.mock.returns(something, "parent");
  suite.mock.returns(something, "id", "something");

  const spec = {};
  suite.mock.returns(spec, "onNew", something);
  suite.mock.returns(spec, "onCapable", true);
  suite.mock.returns(spec, "onProbe", true);
  suite.mock.expects(spec, "onProbe",
    (parser) => { return parser.bytes() === "document"; });

  const grammar = new Map();
  grammar.set("action/something", spec);

  const doc = createDocument(grammar);

  suite.mock.expects(something, "parent", suite.mock.arguments(doc));

  // Everything setup so start the test.

  // First check if our element is supported.
  suite.assertTrue(
    doc.supportsByName("action/something"));

  // Then check if it can be probed.
  suite.assertTrue(
    doc.probeByName("action/something", "document"));

  // Finally try to create and instance.
  suite.assertEquals(
    doc.createByName("action/something", "document", doc),
    something);

  // Ensure the new element was registered in this document.
  suite.assertEquals(
    doc.id("something"),
    something);

  // Finally ensure the mock's parent method was called at least once
  suite.mock.verify(something, "parent");
});

suite.add("Sieve Document - Get specs by type", () => {
  const spec = {};

  const grammar = new Map();
  grammar.set("action/something", spec);
  grammar.set("@action/something", new Set([spec]));

  const doc = createDocument(grammar);

  const specs = doc.getSpecsByType("@action/something");

  suite.assertEquals(specs.size, ONE_ELEMENT);
  suite.assertTrue(specs.has(spec));
});

suite.add("Sieve Document - Element by invalid type", () => {
  const doc = createDocument(new Map());

  suite.assertThrows(
    () => { doc.supportsByClass("action/something"); },
    "Error: Invalid type name action/something");

  suite.assertThrows(
    () => { doc.probeByClass("action/something", "document"); },
    "Error: Invalid type name action/something");

  suite.assertThrows(
    () => { doc.createByClass("action/something", "document"); },
    "Error: Invalid type name action/something");
});

suite.add("Sieve Document - Element by unknown type", () => {
  const doc = createDocument(new Map());

  suite.assertFalse(
    doc.supportsByClass("@action/something"));

  suite.assertFalse(
    doc.probeByClass("@action/something", "document"));

  suite.assertThrows(
    () => { doc.createByClass("@action/something", "document"); },
    "Error: Unknown or incompatible type >>@action/something<< at >>document<<");
});

suite.add("Sieve Document - Unsupported Element by type", () => {
  const spec = {};
  suite.mock.returns(spec, "onCapable", false);

  const grammar = new Map();
  grammar.set("action/something", spec);
  grammar.set("@action/something", new Set([spec]));

  const doc = createDocument(grammar);

  suite.assertFalse(
    doc.supportsByClass("@action/something"));

  suite.assertFalse(
    doc.probeByClass("@action/something", "document"));

  suite.assertThrows(
    () => { doc.createByClass("@action/something", "document"); },
    "Error: Unknown or incompatible type >>@action/something<< at >>document<<");
});

suite.add("Sieve Document - Known incompatible element by type", () => {

  const spec = {};
  suite.mock.returns(spec, "onNew");
  suite.mock.returns(spec, "onCapable", true);
  suite.mock.returns(spec, "onProbe", false);

  const grammar = new Map();
  grammar.set("action/something", spec);
  grammar.set("@action/something", new Set([spec]));

  const doc = createDocument(grammar);

  // First check if our element is supported.
  suite.assertTrue(
    doc.supportsByClass("@action/something"));

  // Then check if it can be probed.
  suite.assertFalse(
    doc.probeByClass("@action/something", "document"));

  suite.assertThrows(
    () => { doc.createByClass("@action/something", "document"); },
    "Error: Unknown or incompatible type >>@action/something<< at >>document<<");
});

suite.add("Sieve Document - Known Element by type (Empty Script)", () => {

  const spec = {};
  suite.mock.returns(spec, "onNew");
  suite.mock.returns(spec, "onCapable", true);
  suite.mock.returns(spec, "onProbe", true);

  const grammar = new Map();
  grammar.set("action/something", spec);
  grammar.set("@action/something", new Set([spec]));

  const doc = createDocument(grammar);

  // First check if our element is supported.
  suite.assertTrue(
    doc.supportsByClass("@action/something"));

  // Then check if it can be probed.
  suite.assertFalse(
    doc.probeByClass("@action/something", ""));

  // Ensure on probe is never called.
  suite.mock.verify(spec, "onProbe", 0);
});

suite.add("Sieve Document - Known element by type", () => {

  // Define a spec which returns a dummy element.
  const something = {};
  suite.mock.returns(something, "init");
  suite.mock.returns(something, "parent");
  suite.mock.returns(something, "id", "something");

  const spec = {};
  suite.mock.returns(spec, "onNew", something);
  suite.mock.returns(spec, "onCapable", true);
  suite.mock.returns(spec, "onProbe", true);
  suite.mock.expects(spec, "onProbe", (parser) => { return parser.bytes() === "document"; });

  const grammar = new Map();
  grammar.set("action/something", spec);
  grammar.set("@action/something", new Set([spec]));

  const doc = createDocument(grammar);

  suite.mock.expects(something, "parent", suite.mock.arguments(doc));

  // Everything setup so start the test.

  // First check if our element is supported.
  suite.assertTrue(
    doc.supportsByClass("@action/something"));

  // Then check if it can be probed.
  suite.assertTrue(
    doc.probeByClass("@action/something", "document"));

  // Finally try to create and instance.
  suite.assertEquals(
    doc.createByClass("@action/something", "document", doc),
    something);

  // Ensure the new element was registered in this document.
  suite.assertEquals(
    doc.id("something"),
    something);

  // Finally ensure the mock's parent method was called at least once
  suite.mock.verify(something, "parent");
});
