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

import * as SieveGrammarHelper from "./SieveGrammarHelper.mjs";
import { SieveDocument } from "../SieveDocument.mjs";

/**
 *
 */
class SieveAbstractGeneric {

  /**
   * Creates a new instance.
   *
   * @param {object} item
   *   the element's specification
   */
  constructor(item) {
    this.item = item;
  }

  /**
   * Checks if this element can parse the given script.
   *
   * @param {SieveParser} parser
   *   the parser which contains the current script.
   * @param {SieveDocument} document
   *   the lexer which contains the grammar.
   *
   * @returns {boolean}
   *   true in case the generic is capable of parsing
   *   otherwise false.
   */
  // eslint-disable-next-line no-unused-vars
  onProbe(parser, document) {
    return this.item.matcher(this.item, parser, document);
  }

  /**
   * Creates a new instance.
   *
   * @param {SieveDocument} docshell
   *   a reference to the parent document which owns this element.
   *
   * @returns {SieveAbstractElement}
   *   the new element.
   */
  onNew(docshell) {
    const element = new SieveGenericStructure(docshell, this.item.id.node);

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
class SieveGroupSpecification extends SieveAbstractGeneric {


  /**
   * @inheritdoc
   */
  onNew(docshell) {

    // The easiest case, there is no default. At least one of the items has to exist.
    // We detect this by the mandatory tag.
    if ((typeof (this.item.mandatory) !== "undefined") && (this.item.mandatory === true)) {
      const element = new SieveGroupElement(docshell, this.item.id.node);
      element.setToken(this.item.token);
      element.addItems(this.item.items);
      element.setCurrentElement(this.item.value);
      return element;
    }

    // The next case, there is an implicit server side default.
    // This is typically when a default is defined the server.
    // We detect this whenever no value is defined.
    if (this.item.value === null || typeof (this.item.value) === "undefined") {
      const element = new SieveImplicitGroupElement(docshell, this.item.id.node);
      element.setToken(this.item.token);
      element.addItems(this.item.items);
      return element;
    }

    // The last case is when we have an explicit default.
    // Like the match types have, it will automatically fallback to an :is
    // We detect this when the value is defined.
    const element = new SieveExplicitGroupElement(docshell, this.item.id.node);
    element.setToken(this.item.token);
    element.addItems(this.item.items);
    element.setDefaultElement(this.item.value);
    return element;
  }
}


// TODO the spec should contain an initlaizer call, which decides what instance to create.
const dictionary = {
  "structures" : new Map(),
  "groups" : new Map(),
  "generics" : new Map(),

  has: (item) => {
    return dictionary.structures.has(item) || dictionary.groups.has(item) || dictionary.generics.has(item);
  }
};


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

  dictionary.structures.set(definition.id.node, definition);
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
    throw new Error(`Token expected but not found ${id.name}`);
  }

  if (definition.id.node === null || typeof (definition.id.node) === 'undefined')
    throw new Error("Node expected but not found");

  if (dictionary.has[definition.id.node])
    throw new Error("Test already registered");

  dictionary.structures.set(definition.id.node, definition);
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

  dictionary.structures.set(definition.id.node, definition);
}

/**
 * Registers a new group specification.
 *
 * @param {Identifier} id
 *   the group's unique identifier.
 * @param {...object} [options]
 *   optional group specifications.
 */
function addGroup(id, ...options) {

  // Our default matcher is a class matcher
  let definition = {
    ...id,
    ...SieveGrammarHelper.classMatcher()
  };

  // We assume a type with the same name exists...
  definition["items"] = [`@${definition.id.node}/`];

  for (const option of options)
    definition = { ...definition, ...option };

  if (definition.id.node === null || typeof (definition.id.node) === 'undefined')
    throw new Error("Node expected but not found");

  dictionary.groups.set(definition.id.node, definition);

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

  // We currently only support extending structures....
  const x = dictionary.structures.get(item.extends);

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


// TODO should be merged with abstract generic and renamed to "specification".
/**
 * Implements a wrapper for a Generic element
 */
class SieveGenericSpecification {

  /**
   * Creates a new Instance.
   *
   * @param {Identifier} id
   *   the element's unique identifier.
   * @param {Class} initializer
   *   the class which should be used to create new object.
   * @param {Function} matcher
   *   the matcher function which checks if a document snippet is compatible
   *   with this specification or not.
   */
  constructor(id, initializer, matcher) {
    this.initializer = initializer;
    this.onProbe = matcher;
    this.id = id;
  }

  /**
   * Creates a new Sieve Element for this specification.
   *
   * @param {SieveDocument} docshell
   *   the document which owns this element's instance
   * @returns {SieveAbstractElement}
   *   the new instance.
   */
  onNew(docshell) {
    const instance = new this.initializer(docshell);

    // Fixme remove this ugly hack.
    instance["nodeName"] = () => { return this.id.node; };
    instance["nodeType"] = () => { return this.id.type; };

    return instance;
  }

  /**
   * Checks if the element is supported by the capabilities
   *
   * @returns {boolean}
   *   true in case the server supports this tag otherwise false.
   */
  onCapable() {
    // TODO: Read capabilities from id element....
    return true;
  }
}

/**
 * Add a definition for a generic element.
 *
 * @param {Identifier} id
 *   the elements unique identifier.
 * @param {Class} initializer
 *   the class which should be used to create new object.
 * @param {Function} matcher
 *   the matcher function which checks if a document snippet is compatible
 *   with this specification or not.
 */
function addGeneric(id, initializer, matcher) {

  const definition = {
    ...id,
    "initializer" : initializer,
    "matcher" : matcher
  };

  dictionary.generics.set(definition.id.node, definition);
}


/**
 * Adds a specification to the dictionary.
 *
 * @param {Map} specs
 *   a map which contains all the element and type specifications.
 *    *
 * @param {string} name
 *  a unique name for this element
 * @param {string} type
 *  a type information for this element. It is used to create group/classes of elements.
 *  It does not have to be unique.
 * @param {object} obj
 *  the callbacks which are invoked, e.g. when probing, checking for capabilities or creating a new instance.
 */
function addSpec(specs, name, type, obj) {
  if (!type)
    throw new Error("Lexer Error: Registration failed, element has no type");

  if (!name)
    throw new Error("Lexer Error: Registration failed, element has no name");


  if (name.startsWith("@"))
    throw new Error(`Invalid node name ${name}.`);

  if (!type.startsWith("@"))
    throw new Error(`Invalid type name ${type}.`);


  if (!obj.onProbe)
    throw new Error("Lexer Error: Registration failed, element has onProbe method");

  if (!obj.onNew)
    throw new Error("Lexer Error: Registration failed, element has onNew method");

  if (!obj.onCapable)
    throw new Error("Lexer Error: Registration failed, element has onCapable method");

  if (specs.has(name))
    throw new Error(`Node name ${name} is already in use.`);

  if (!specs.has(type))
    specs.set(type, new Set());

  specs.set(name, obj);
  specs.get(type).add(obj);
}

/**
 * Initializes the lexer with the grammar rules.
 *
 * In case the grammar is already created is flushes and reinitializes
 * the lexer.
 *
 * @param {Object<string, boolean>} [capabilities]
 *   the capabilities, in case omitted they will be unchanged.
 *
 * @param {SieveDesigner} [designer]
 *   the ui designer which should be used to render the document.
 *   Can be null in case the document is headless and no html should be rendered.
 *
 * @returns {SieveDocument}
 *   the document based on the given grammar.
 */
function createGrammar(capabilities, designer) {

  const grammar = new Map();

  for (const spec of dictionary.structures.values()) {
    addSpec(
      grammar,
      spec.id.node, spec.id.type,
      new SieveAbstractGeneric(spec));
  }

  for (const spec of dictionary.groups.values()) {
    addSpec(
      grammar,
      spec.id.node, spec.id.type,
      new SieveGroupSpecification(spec));
  }

  for (const spec of dictionary.generics.values()) {
    addSpec(
      grammar,
      spec.id.node, spec.id.type,
      new SieveGenericSpecification(spec.id, spec.initializer, spec.matcher));
  }

  const doc = new SieveDocument(grammar, designer);

  if ((typeof(capabilities) !== "undefined") && (capabilities !== null))
    doc.capabilities(capabilities);

  return doc;
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
