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
} from "./GenericAtoms.js";

import { SieveLexer } from "./../SieveLexer.js";

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
    let tokens = this.item.token;

    if (!Array.isArray(tokens))
      tokens = [tokens];

    for (const i in tokens)
      if (parser.startsWith(tokens[i]))
        return true;

    return false;
  }

  /**
   *
   * @param {*} docshell
   * @param {string} id
   *   the elements uniquer id.
   *
   * @returns {SieveAbstractElement}
   *   the new element.
   */
  onNew(docshell, id) {
    const element = new SieveGenericStructure(docshell, id, this.item.node);

    element
      .addLiteral(this.item.token)
      .addRequirements(this.item.requires);

    if (Array.isArray(this.item.properties)) {

      this.item.properties.forEach(function (elm) {

        if (elm.optional)
          element.addOptionalItems(elm.elements);
        else if (elm.dependent)
          element.addDependentItems(elm);
        else
          element.addMandatoryItems(elm.elements);
      });

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

    // in case no capabilities are defined we are compatible...
    if ((this.item.requires === null) || (typeof (this.item.requires) === 'undefined'))
      return true;

    return capabilities.isCapable(this.item.requires);
  }
}

/**
 *
 */
class SieveGenericAction extends SieveAbstractGeneric {

  /**
   * @inheritdoc
   */
  onNew(docshell, id) {

    const element = super.onNew(docshell, id);

    element.addLiteral(";", "\r\n");

    // add something optional which eats whitespace but stops a comments or linebreaks.
    return element;
  }

}


/**
 *
 */
class SieveGenericTest extends SieveAbstractGeneric {

  /**
   * @inheritdoc
   */
  onNew(docshell, id) {

    return super.onNew(docshell, id);
  }
}

/**
 *
 */
class SieveGenericTag extends SieveAbstractGeneric {

  /**
   * @inheritdoc
   */
  onNew(docshell, id) {

    return super.onNew(docshell, id);
  }
}

/**
 *
 */
class SieveGenericGroup extends SieveAbstractGeneric {

  /**
   * @inheritdoc
   */
  onProbe(parser, lexer) {
    // in case we have an explicit token we go for it...
    if (this.item.token !== null && typeof (this.item.token) !== "undefined")
      return super.onProbe(parser, lexer);

    // ... otherwise we check if on of our group elements matches
    return lexer.probeByClass(this.item.items, parser);
  }

  /**
   * @inheritdoc
   */
  onNew(docshell, id) {

    // The easiest case, there is no default. At least one of the items has to exist.
    // We detect this by the mandatory tag.
    if ((typeof (this.item.mandatory) !== "undefined") && (this.item.mandatory === true)) {
      const element = new SieveGroupElement(docshell, id, this.item.node);
      element.setToken(this.item.token);
      element.addItems(this.item.items);
      element.setCurrentElement(this.item.value);
      return element;
    }

    // The next case, there is an implicit server side default.
    // This is typically when a default is defined the server.
    // We detect this whenever no value is defined.
    if (this.item.value === null || typeof (this.item.value) === "undefined") {
      const element = new SieveImplicitGroupElement(docshell, id, this.item.node);
      element.setToken(this.item.token);
      element.addItems(this.item.items);
      return element;
    }

    // The last case is when we have an explicit default.
    // Like the match types have, it will automatically fallback to an :is
    // We detect this when the value is defined.
    const element = new SieveExplicitGroupElement(docshell, id, this.item.node);
    element.setToken(this.item.token);
    element.addItems(this.item.items);
    element.setDefaultElement(this.item.value);
    return element;
  }
}


const actions = new Map();
const tests = new Map();

/**
 *
 * @param {*} item
 *
 */
function addAction(item) {

  // Ensure the item has a valid structure...

  // ... there has to be a token ...
  if (item.token === null || typeof (item.token) === 'undefined')
    throw new Error("Token expected but not found");

  if (item.node === null || typeof (item.node) === 'undefined')
    throw new Error("Node expected but not found");

  if (actions[item] !== null && typeof (item.node) === 'undefined')
    throw new Error("Actions already registered");

  actions.set(item.node, item);
}

/**
 *
 * @param {*} item
 *
 */
function addTest(item) {
  // Ensure the item has a valid structure...

  // ... there has to be a token ...
  if (item.token === null || typeof (item.token) === 'undefined')
    throw new Error("Token expected but not found");

  if (item.node === null || typeof (item.node) === 'undefined')
    throw new Error("Node expected but not found");

  if (tests[item] !== null && typeof (item.node) === 'undefined')
    throw new Error("Test already registered");

  tests.set(item.node, item);
}

/**
 *
 * @param {*} group
 *
 */
function addGroup(group) {

  if (group.node === null || typeof (group.node) === 'undefined')
    throw new Error("Node expected but not found");

  // if ( tag.value === null || typeof ( tag.value ) === 'undefined' )
  //  throw new Error( "Default value for tag group " + tag.node + " not found" );

  SieveLexer.registerGeneric(
    group.node, group.type,
    new SieveGenericGroup(group));
}


/**
 *
 * @param {object} item
 *
 */
function addTag(item) {

  let token = item.token;

  if (!Array.isArray(token))
    token = [token];

  if (!token.length)
    throw new Error("Adding Tag failed, no parser token defined");

  SieveLexer.registerGeneric(
    item.node, item.type,
    new SieveGenericTag(item));
}

/**
 * Initializes all registered actions
 */
function initActions() {
  actions.forEach((item) => {
    SieveLexer.registerGeneric(
      item.node, item.type,
      new SieveGenericAction(item));
  });
}

/**
 * Initializes all registered tests.
 */
function initTests() {
  tests.forEach((item) => {

    SieveLexer.registerGeneric(
      item.node, item.type,
      new SieveGenericTest(item));
  });
}

/**
 *
 * @param {*} capabilities
 */
function createGrammar(capabilities) {
  initActions();
  initTests();

  // todo we should return a lexer so that the grammar is scoped.
  // but this is fare future
  return null;
}

/**
 *
 * @param {*} action
 * @param {*} item
 *
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

  return;
}

/**
 *
 * @param {*} generics
 * @param {*} item
 *
 */
function extendGeneric(generics, item) {

  if (!generics.has(item.extends))
    return;

  const x = generics.get(item.extends);

  if (item.properties) {
    item.properties.forEach(function (property) {
      extendGenericProperty(x, property);
    });
  }

  // TODO we currently just replace the requirements.
  // instead we should extend it with an any..
  if (item.requires) {
    x.requires = item.requires;
  }
}

/**
 *
 * @param {*} item
 *
 */
function extendAction(item) {
  extendGeneric(actions, item);
}

/**
 *
 * @param {*} item
 *
 */
function extendTest(item) {
  extendGeneric(tests, item);
}

const SieveGrammar = {};
SieveGrammar.addAction = addAction;
SieveGrammar.extendAction = extendAction;
SieveGrammar.addGroup = addGroup;
SieveGrammar.addTag = addTag;
SieveGrammar.addTest = addTest;
SieveGrammar.extendTest = extendTest;

SieveGrammar.create = createGrammar;

export { SieveGrammar };
