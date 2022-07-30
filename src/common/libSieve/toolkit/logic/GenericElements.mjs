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

import {
  SieveGenericStructure,
  SieveGroupElement,
  SieveExplicitGroupElement,
  SieveImplicitGroupElement
} from "./GenericAtoms.mjs";

import { SieveLexer } from "./../SieveLexer.mjs";
import * as SieveGrammarHelper from "./SieveGrammarHelper.mjs";

/**
 *
 */
class SieveAbstractGeneric {

  /**
   * Creates a new instance.
   *
   * @param {*} item
   */
  constructor(item) {
    this.item = item;
  }

  /**
   * Checks if this element can parse the given script.
   *
   * @param {SieveParser} parser
   *   the parser which contains the current script.
   * @param {SieveLexer} lexer
   *   the lexer which contains the grammar.
   *
   * @returns {boolean}
   *   true in case the generic is capable of parsing
   *   otherwise false.
   */
  // eslint-disable-next-line no-unused-vars
  onProbe(parser, lexer) {
    return this.item.matcher(this.item, parser, lexer);
  }

  /**
   * Creates a new instance.
   *
   * @param {SieveDocument} docshell
   *   a reference to the parent document which owns this element.
   * @param {string} id
   *   the elements uniquer id assigned by the document.
   *
   * @returns {SieveAbstractElement}
   *   the new element.
   */
  onNew(docshell, id) {
    const element = new SieveGenericStructure(docshell, id, this.item.id.node);

    // FIXME: The token should be the first property. The properties matcher
    // should check if the first property exists.

    element
      .addLiteral(this.item.token)
      .addRequirements(this.item.requires.getImports());

    for (const elm of this.item.properties) {

      if (!elm.initializer)
        throw new Error("Invalid property initializer...");

      elm["initializer"](element, elm);
    }

    return element;
  }

  /**
   * Checks if the current element is supported by the server implementation.
   *
   * @param {SieveCapabilities} capabilities
   *   the capabilities supported by the server
   *
   * @returns {boolean}
   *   true in case the action is capable
   */
  onCapable(capabilities) {
    return this.item.requires.isCapable(capabilities);
  }
}


/**
 *
 */
class SieveGenericGroup extends SieveAbstractGeneric {


  /**
   * @inheritdoc
   */
  onNew(docshell, id) {

    // The easiest case, there is no default. At least one of the items has to exist.
    // We detect this by the mandatory tag.
    if ((typeof (this.item.mandatory) !== "undefined") && (this.item.mandatory === true)) {
      const element = new SieveGroupElement(docshell, id, this.item.id.node);
      element.setToken(this.item.token);
      element.addItems(this.item.items);
      element.setCurrentElement(this.item.value);
      return element;
    }

    // The next case, there is an implicit server side default.
    // This is typically when a default is defined the server.
    // We detect this whenever no value is defined.
    if (this.item.value === null || typeof (this.item.value) === "undefined") {
      const element = new SieveImplicitGroupElement(docshell, id, this.item.id.node);
      element.setToken(this.item.token);
      element.addItems(this.item.items);
      return element;
    }

    // The last case is when we have an explicit default.
    // Like the match types have, it will automatically fallback to an :is
    // We detect this when the value is defined.
    const element = new SieveExplicitGroupElement(docshell, id, this.item.id.node);
    element.setToken(this.item.token);
    element.addItems(this.item.items);
    element.setDefaultElement(this.item.value);
    return element;
  }
}


const dictionary = new Map();


/**
 * Registers a new object specification
 *
 * @param {Identifier} id
 *   the action's unique identifier containing the name, type and
 *   optionally required imports.
 * @param {Token} token
 *   the token which identifies this actions.
 * @param  {...Fields} [properties]
 *   the optional actions properties in order of their precedence.
 */
function addAction(id, token, ...properties) {

  const definition = {
    ...id,
    ...token,
    "properties": properties
  };

  // Ensure the item has a valid structure...
  // ... there has to be a token ...
  if (definition.token === null || typeof (definition.token) === 'undefined')
    throw new Error("Token expected but not found");

  if (definition.id.node === null || typeof (definition.id.node) === 'undefined')
    throw new Error("Node expected but not found");

  if (dictionary.has[definition.id.node])
    throw new Error("Actions already registered");

  // To simplify the definitions, we magically add the semicolon which
  // terminates an action here.
  definition["properties"].push(SieveGrammarHelper.token(";", "\r\n"));

  dictionary.set(definition.id.node, definition);
}


/**
 * Registers a new tag specification.
 *
 * @param {Identifier} id
 *   the test's unique identifier containing the name, type and
 *   the optionally required imports
 * @param {Token} token
 *   token which identifiers this test.
 * @param {...Fields} properties
 *   the optional test properties in order of their precedence.
 */
function addTest(id, token, ...properties) {
  // Ensure the item has a valid structure...
  const definition = {
    ...id,
    ...token,
    "properties": properties
  };

  // ... there has to be a token ...
  if (definition.token === null || typeof (definition.token) === 'undefined') {
    throw new Error("Token expected but not found" + id.name);
  }

  if (definition.id.node === null || typeof (definition.id.node) === 'undefined')
    throw new Error("Node expected but not found");

  if (dictionary.has[definition.id.node])
    throw new Error("Test already registered");

  dictionary.set(definition.id.node, definition);
}

/**
 * Registers a new tag specification.
 *
 * @param {Identifier} id
 *   the tag's unique identifier containing the name, type and
 *   optionally required imports.
 * @param {Token} token
 *   the token which identifies this tag.
 * @param  {...Fields} properties
 *   the optional tag properties in order of their precedence.
 */
function addTag(id, token, ...properties) {

  const definition = {
    ...id,
    ...token,
    "properties": properties
  };

  dictionary.set(definition.id.node, definition);
}

/**
 *
 * @param {*} group
 *
 */
function addGroup(id, ...options) {

  // Our default matcher is a class matcher
  let definition = {
    ...id,
    ...SieveGrammarHelper.classMatcher()
  };

  definition["items"] = [`${definition.id.node}/`];

  for (const option of options)
    definition = { ...definition, ...option };

  if (definition.id.node === null || typeof (definition.id.node) === 'undefined')
    throw new Error("Node expected but not found");

  SieveLexer.registerGeneric(
    definition.id.node, definition.id.type,
    new SieveGenericGroup(definition));

}


/**
 * Initializes the lexer with the grammar rules.
 */
function createGrammar() {

  for (const item of dictionary.values()) {
    SieveLexer.registerGeneric(
      item.id.node, item.id.type,
      new SieveAbstractGeneric(item));
  }

  // todo we should return a lexer so that the grammar is scoped.
}

/**
 *
 * @param {*} action
 * @param {*} item
 *
 */
function extendGenericProperty(action, item) {

  let property = null;

  if (!action.properties) {
    action.properties = [item];
    return;
  }

  property = action.properties.find((cur) => {
    return cur.id === item.id;
  });

  if (!property) {
    action.properties.unshift(item);
    return;
  }

  item.elements.forEach((cur) => {
    property.elements.unshift(cur);
  });
}

/**
 *
 * @param {*} item
 *
 */
function extendGeneric(item) {

  if (!dictionary.has(item.extends))
    return;

  const x = dictionary.get(item.extends);

  if (item.properties) {
    item.properties.forEach(function (property) {
      extendGenericProperty(x, property);
    });
  }

  // TODO we currently just replace the requirements.
  // instead we should extend it with an any..
  if (item.requires) {
    x.requires = new SieveGrammarHelper.Imports(item.requires);
  }
}

/**
 *
 */
class GenericElement{

  /**
   *
   * @param {*} id
   * @param {*} clazz
   * @param {*} matcher
   */
  constructor(id, clazz, matcher) {
    this.clazz = clazz;
    this.matcher = matcher;
    this.id = id;
  }

  /**
   *
   * @param {*} parser
   * @param {*} lexer
   * @returns
   */
  onProbe(parser, lexer) {
    if ((typeof(this.matcher) === "undefined") || (this.matcher === null))
      return false;

    return this.matcher(parser, lexer);
  }

  /**
   *
   * @param {*} docshell
   * @param {*} id
   * @returns
   */
  onNew(docshell, id) {
    const instance = new this.clazz(docshell, id);

    // Fixme remove this ugly hack.
    instance["nodeName"] = () => { return this.id.node; };
    instance["nodeType"] = () => { return this.id.type; };

    return instance;
  }

  onCapable() {
    // TODO: Read capabilities from id element....
    return true;
  }
}

/**
 *
 * @param {*} id
 * @param {*} initializer
 * @param {*} matcher
 */
function addGeneric(id, initializer, matcher) {

  SieveLexer.registerGeneric(id.id.node, id.id.type,
    new GenericElement(id.id, initializer, matcher));
}

const SieveGrammar = {};

SieveGrammar.addAction = addAction;
SieveGrammar.addGroup = addGroup;
SieveGrammar.addTag = addTag;
SieveGrammar.addTest = addTest;

SieveGrammar.extendAction = extendGeneric;
SieveGrammar.extendTest = extendGeneric;

SieveGrammar.create = createGrammar;

SieveGrammar.addGeneric = addGeneric;

export { SieveGrammar };
