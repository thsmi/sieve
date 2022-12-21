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

const dictionary = new Map();

/**
 * Specifies how to construct a new element.
 */
class SieveSpecification {

  /**
   * Creates a new instance.
   *
   * @param {object} spec
   *   the element's specification
   */
  constructor(spec) {
    this.spec = spec;
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
  onProbe(parser, document) {
    if (!this.spec && !this.spec.properties)
      throw new Error("Invalid element specification.");

    // Check the first matcher contained in the properties.
    for (const property of this.spec.properties) {
      if (!property.matcher)
        continue;

      return property.matcher(property, this.spec, parser, document);
    }

    throw new Error("No matcher specified.");
  }

  /**
   * Creates a new instance.
   *
   * @param {SieveDocument} docshell
   *   a reference to the parent document which owns this element.
   *
   * @param {SieveParser} [parser]
   *   optional data used to initialize the new element
   *
   * @param {SieveAbstractElement} [parent]
   *   the optional parent element which owns the newly generated element.
   *
   * @returns {SieveAbstractElement}
   *   the new element.
   */
  onNew(docshell, parser, parent) {
    const element = new this.spec.initializer(
      docshell, this.spec.id.node, this.spec.id.type);

    if (element.addRequirements)
      element.addRequirements(this.spec.requires.getImports());

    for (const property of this.spec.properties) {

      if (!property.initializer)
        continue;

      property.initializer(element, property, this.spec);
    }

    if (parser)
      element.init(parser);

    if (parent)
      element.parent(parent);

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
    return this.spec.requires.isCapable(capabilities);
  }
}

/**
 * Registers a new specification for a structure.
 *
 * @param {Identifier} id
 *   the tag's unique identifier containing the name, type and
 *   optionally required imports.
 * @param  {...Fields} properties
 *   the optional tag properties in order of their precedence.
 */
function addStructure(id, ...properties) {

  const definition = {
    ...id,
    "initializer" : SieveGenericStructure,
    "properties": properties
  };

  if (definition.id.node === null || typeof (definition.id.node) === 'undefined')
    throw new Error("Node expected but not found");

  if (dictionary.has[definition.id.node])
    throw new Error(`Structure ${definition.id.node} already registered`);

  dictionary.set(definition.id.node, definition);
}

/**
 * Registers a new action specification.
 * It automatically adds a semicolon token to the specification.
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
  // ... there has to be a token ...
  if (token === null || typeof (token) === 'undefined')
    throw new Error(`No token found in definition for ${id.name}`);

  if (token.token === null || typeof (token.token) === 'undefined')
    throw new Error(`No token found in definition for ${id.name}`);

  properties.unshift(token);
  properties.push(SieveGrammarHelper.token(";", "\r\n"));

  addStructure(id, ...properties);
}

// TODO have a separate function for addTest and addTag

/**
 * Registers a new group specification.
 *
 * @param {Identifier} id
 *   the group's unique identifier.
 * @param {...object} [properties]
 *   optional group specifications.
 */
function addGroup(id, ...properties) {

  // Our default matcher is a class matcher
  const definition = {
    ...id,
    "properties": properties
  };

  if (definition.id.node === null || typeof (definition.id.node) === 'undefined')
    throw new Error("Node expected but not found");

  definition["initializer"] = SieveImplicitGroupElement;

  for (const property of definition.properties) {
    if (property.mandatory) {
      definition["initializer"] = SieveGroupElement;
      break;
    }

    if ((typeof(property.value) !== "undefined") && (property.value !== null)) {
      definition["initializer"] = SieveExplicitGroupElement;
      break;
    }
  }

  dictionary.set(definition.id.node, definition);
}

/**
 * Add a definition for a generic element.
 *
 * @param {Identifier} id
 *   the elements unique identifier.
 * @param {Class} initializer
 *   the class which should be used to create new object.
 * @param {object} property
 *   the property which is used when probing if a document snippet is compatible
 *   with this specification or not.
 */
function addGeneric(id, initializer, property) {

  const spec = {
    ...id,
    "initializer" : initializer,
    "properties" : [property]
  };

  dictionary.set(spec.id.node, spec);
}

/**
 * Extends an existing specification.
 *
 * @param {string} id
 *   the identifier which should be extended.
 * @param  {...any} specs
 *   the specification to be extended.
 */
function extendGeneric(id, ...specs) {

  if (!dictionary.has(id))
    throw new Error(`Cannot extend unknown element ${id}}`);

  const elm = dictionary.get(id);

  for (const spec of specs) {

    if (spec.property) {
      spec.property(elm.properties);
      continue;
    }

    if (spec.requires) {
      elm.requires = new SieveGrammarHelper.Imports(spec.requires);
      continue;
    }
  }
}

/**
 * Adds a specification to the dictionary.
 *
 * @param {Map} specs
 *   a map which contains all the element and type specifications.
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
function createDocument(capabilities, designer) {

  const grammar = new Map();

  for (const spec of dictionary.values()) {
    addSpec(
      grammar,
      spec.id.node, spec.id.type,
      new SieveSpecification(spec));
  }

  const doc = new SieveDocument(grammar, designer);

  if ((typeof(capabilities) !== "undefined") && (capabilities !== null))
    doc.capabilities(capabilities);

  return doc;
}



const SieveGrammar = {};

SieveGrammar.addGroup = addGroup;

SieveGrammar.addAction = addAction;
SieveGrammar.addTag = addStructure;
SieveGrammar.addTest = addStructure;
SieveGrammar.addStructure = addStructure;

SieveGrammar.extendAction = extendGeneric;
SieveGrammar.extendTest = extendGeneric;

SieveGrammar.create = createDocument;

SieveGrammar.addGeneric = addGeneric;

export { SieveGrammar };
