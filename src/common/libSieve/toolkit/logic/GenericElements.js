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
  class SieveGenericAction {

    /**
     * @inheritDoc
     */
    constructor(item) {
      this.item = item;
    }

    /**
     * @inheritDoc
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
     * @inheritDoc
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
      element
        .addLiteral(";", "\r\n");

      // add something optional which eats whitespaces but stops a comments or linebreaks.

      return element;
    }

    /**
     * @inheritDoc
     */
    onCapable(capabilities) {

      if ((this.item.requires === null) || (typeof (this.item.requires) === 'undefined'))
        return true;

      let requires = this.item.requires;

      if (!Array.isArray(requires))
        requires = [requires];

      for (let i in requires)
        if (capabilities[requires[i]] !== true)
          return false;

      return true;
    }

  }


  /**
   *
   */
  class SieveGenericTest {

    /**
     * @inheritDoc
     */
    constructor(item) {
      this.item = item;
    }

    /**
     * @inheritDoc
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
     * @inheritDoc
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
     * @inheritDoc
     */
    onCapable(capabilities) {

      if ((this.item.requires === null) || (typeof (this.item.requires) === 'undefined'))
        return true;

      let requires = this.item.requires;

      if (!Array.isArray(requires))
        requires = [requires];

      for (let i in requires)
        if (capabilities[requires[i]] !== true)
          return false;

      return true;
    }
  }


  /**
   *
   */
  class SieveGenericGroup {

    /**
     * @inheritDoc
     */
    constructor(tag) {
      this.tag = tag;
    }

    /**
     * @inheritDoc
     */
    onProbe(parser, lexer) {
      if (this.tag.token !== null && typeof (this.tag.token) !== "undefined")
        return parser.startsWith(this.tag.token);

      return lexer.probeByClass(this.tag.items, parser);
    }

    /**
     * @inheritDoc
     */
    onNew(docshell, id) {

      let element = new SieveGenericUnion(docshell, id);
      element.setToken(this.tag.token);
      element.addItems(this.tag.items);
      element.setDefaultValue(this.tag.value);
      return element;
    }

    /**
     * @inheritDoc
     */
    onCapable(capabilities) {

      if ((this.tag.requires === null) || (typeof (this.tag.requires) === 'undefined'))
        return true;

      let requires = this.tag.requires;

      if (!Array.isArray(requires))
        requires = [requires];

      for (let i in requires)
        if (capabilities[requires[i]] !== true)
          return false;

      return true;
    }
  }

  /**
   *
   */
  class SieveGenericTag {

    /**
     * @inheritDoc
     */
    constructor(item) {
      this.item = item;
    }

    /**
     * @inheritDoc
     */
    onProbe(parser, lexer) {
      return parser.startsWith(this.item.token);
    }

    /**
     * @inheritDoc
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
          else
            element.addMandatoryItems(elm.elements);
        });

      }

      return element;
    }

    /**
     * @inheritDoc
     */
    onCapable(capabilities) {

      if ((this.item.requires === null) || (typeof (this.item.requires) === 'undefined'))
        return true;

      let requires = this.item.requires;

      if (!Array.isArray(requires))
        requires = [requires];

      for (let i in requires)
        if (capabilities[requires[i]] !== true)
          return false;

      return true;
    }
  }



  let actions = new Map();


  /**
   *
   * @param {*} item
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
   */
  function addTest(item) {

    let name = item.node;
    let type = item.type;

    let obj = new SieveGenericTest(item);
    SieveLexer.registerGeneric(name, type, obj);
  }

  /**
   *
   * @param {*} tag
   */
  function addGroup(tag) {

    if (tag.node === null || typeof (tag.node) === 'undefined')
      throw new Error("Node expected but not found");

    // if ( tag.value === null || typeof ( tag.value ) === 'undefined' )
    //  throw new Error( "Default value for tag group " + tag.node + " not found" );

    let name = tag.node;
    let type = tag.type;

    let obj = new SieveGenericGroup(tag);

    SieveLexer.registerGeneric(name, type, obj);
  }


  /**
   *
   * @param {*} item
   */
  function addTag(item) {

    let token = item.token;

    if (!Array.isArray(token))
      token = [token];

    if (!token.length)
      throw new Error("Adding Tag failed, no parser token defined");



    let name = item.node;
    let type = item.type;

    let obj = new SieveGenericTag(item);

    SieveLexer.registerGeneric(name, type, obj);
  }

  /**
   *
   */
  function initActions() {
    actions.forEach((item) => {
      let name = item.node;
      let type = item.type;

      let obj = new SieveGenericAction(item);

      SieveLexer.registerGeneric(name, type, obj);
    });
  }

  function createGrammar(capabilites) {
    initActions();

    // todo we should retrun a lexxer so that the gramar is scoped.
    // but this is fare future
    return null;
  }

  /**
   *
   * @param {*} action
   * @param {*} item
   */
  function extendProperty(action, item) {

    let property = null;

    if (!action.properties) {
      action.properties = [item];
      return;
    }

    property = action.properties.find(function (cur) {
      return cur.id === item.id;
    });

    if (!property) {
      action.properties.unshift(item);
      return;
    }

    item.elements.forEach(function (cur) {
      property.elements.unshift(cur);
    });

    return property;
  }

  /**
   *
   * @param {*} item
   */
  function extendAction(item) {

    if (!actions.has(item.extends))
      return;

    let action = actions.get(item.extends);

    item.properties.forEach(function (property) {
      extendProperty(action, property);
    });
  }

  exports.SieveGrammar = {};
  exports.SieveGrammar.addAction = addAction;
  exports.SieveGrammar.extendAction = extendAction;
  exports.SieveGrammar.addGroup = addGroup;
  exports.SieveGrammar.addTag = addTag;
  exports.SieveGrammar.addTest = addTest;

  exports.SieveGrammar.create = createGrammar;


})(window);
