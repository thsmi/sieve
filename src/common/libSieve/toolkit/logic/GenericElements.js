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

/* global window */

(function (exports) {

  "use strict";

  /* global SieveGenericStructure */
  /* global SieveGenericUnion */

  /* global SieveLexer */

  /**
   *
   */
  class SieveAbstractGeneric {

    /**
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
     * @returns {Boolean}
     *   true in case the generic is capable of parsing
     *   otherwise false.
     */
    onProbe(parser, lexer) {
      let tokens = this.item.token;

      if (!Array.isArray(tokens))
        tokens = [tokens];

      for (let i in tokens)
        if (parser.startsWith(tokens[i]))
          return true;

      return false;
    }

    /**
     *
     * @param {*} docshell
     * @param {*} id
     *
     * @returns {SieveAbstractElement}
     */
    onNew(docshell, id) {
      let element = new SieveGenericStructure(docshell, id, this.item.node);

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
     * @returns {Boolean}
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

      let element = super.onNew(docshell, id);

      element.addLiteral(";", "\r\n");

      // add something optional which eats whitespaces but stops a comments or linebreaks.
      return element;
    }

  }


  /**
   *
   */
  class SieveGenericTest extends SieveAbstractGeneric {

    /**
     * @inheritDoc
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
     * @inheritDoc
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
     * @inheritDoc
     */
    onProbe(parser, lexer) {
      if (this.item.token !== null && typeof (this.item.token) !== "undefined")
        return super.onProbe(parser, lexer);

      return lexer.probeByClass(this.item.items, parser);
    }

    /**
     * @inheritDoc
     */
    onNew(docshell, id) {

      let element = new SieveGenericUnion(docshell, id);
      element.setToken(this.item.token);
      element.addItems(this.item.items);
      element.setDefaultValue(this.item.value);
      return element;
    }
  }


  let actions = new Map();
  let tests = new Map();

  /**
   *
   * @param {*} item
   * @returns {undefined}
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
   * @returns {undefined}
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
   * @returns {undefined}
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
   * @param {Object} item
   * @returns {undefined}
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
   *
   * @returns {undefined}
   */
  function initActions() {
    actions.forEach((item) => {

      SieveLexer.registerGeneric(
        item.node, item.type,
        new SieveGenericAction(item));
    });
  }

  /**
   *
   * @returns {undefined}
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
   * @param {*} capabilites
   */
  function createGrammar(capabilites) {
    initActions();
    initTests();

    // todo we should retrun a lexxer so that the gramar is scoped.
    // but this is fare future
    return null;
  }

  /**
   *
   * @param {*} action
   * @param {*} item
   *
   * @returns {undefined}
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
   * @returns {undefined}
   */
  function extendGeneric(generics, item) {

    if (!generics.has(item.extends))
      return;

    let x = generics.get(item.extends);

    item.properties.forEach(function (property) {
      extendGenericProperty(x, property);
    });
  }

  /**
   *
   * @param {*} item
   * @returns {undefined}
   */
  function extendAction(item) {
    extendGeneric(actions, item);
  }

  /**
   *
   * @param {*} item
   * @returns {undefined}
   */
  function extendTest(item) {
    extendGeneric(tests, item);
  }

  exports.SieveGrammar = {};
  exports.SieveGrammar.addAction = addAction;
  exports.SieveGrammar.extendAction = extendAction;
  exports.SieveGrammar.addGroup = addGroup;
  exports.SieveGrammar.addTag = addTag;
  exports.SieveGrammar.addTest = addTest;
  exports.SieveGrammar.extendTest = extendTest;

  exports.SieveGrammar.create = createGrammar;

})(window);
