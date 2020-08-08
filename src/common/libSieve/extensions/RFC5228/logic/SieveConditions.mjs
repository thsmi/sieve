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

import { SieveLexer } from "./../../../toolkit/SieveLexer.mjs";
import { SieveBlock, SieveBlockBody } from "./SieveBlocks.mjs";

const BEFORE_BLOCK = 0;
const AFTER_BLOCK = 1;
const BEFORE_TEST = 2;

/**
 *
 */
class SieveElse extends SieveBlock {

  /**
   * @inheritdoc
   */
  constructor(docshell, id) {
    super(docshell, id);

    this.ws = [];

    this.ws[BEFORE_BLOCK] = this._createByName("whitespace", "\r\n");
    this.ws[AFTER_BLOCK] = this._createByName("whitespace", "\r\n");
  }

  /**
   * @inheritdoc
   */
  // eslint-disable-next-line no-unused-vars
  static isElement(parser, lexer) {
    return parser.startsWith("else");
  }

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "condition/else";
  }

  /**
   * @inheritdoc
   */
  static nodeType() {
    return "condition/";
  }

  /**
   * @inheritdoc
   */
  init(parser) {
    parser.extract("else");

    this.ws[BEFORE_BLOCK].init(parser);

    super.init(parser);

    this.ws[AFTER_BLOCK].init(parser);

    return this;
  }

  /**
   * @inheritdoc
   */
  toScript() {
    return "else"
      + this.ws[BEFORE_BLOCK].toScript()
      + super.toScript()
      + this.ws[AFTER_BLOCK].toScript();
  }
}


/**
 *
 */
class SieveIf extends SieveBlock {

  /**
   * @inheritdoc
   */
  constructor(docshell, id) {
    super(docshell, id);

    this._test = null;

    this.ws = [];
    this.ws[BEFORE_TEST] = this._createByName("whitespace");
    this.ws[BEFORE_BLOCK] = this._createByName("whitespace", "\r\n");
    this.ws[AFTER_BLOCK] = this._createByName("whitespace", "\r\n");
  }

  /**
   * @inheritdoc
   */
  // eslint-disable-next-line no-unused-vars
  static isElement(parser, lexer) {
    return parser.startsWith("if");
  }

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "condition/if";
  }

  /**
   * @inheritdoc
   */
  static nodeType() {
    return "condition/";
  }

  /**
   * @inheritdoc
   */
  init(parser) {
    parser.extract("if");

    this.ws[BEFORE_TEST].init(parser);

    this._test = this._createByClass(["test", "operator"], parser);

    this.ws[BEFORE_BLOCK].init(parser);

    // Ugly hack to all super of parent.
    super.init(parser);

    this.ws[AFTER_BLOCK].init(parser);

    return this;
  }

  /**
   *
   * @param {string} childId
   *   the child's unique id.
   * @param {boolean} cascade
   * @param {SieveAbstractElement} stop
   *
   * @returns {SieveAbstractElement}
   */
  removeChild(childId, cascade, stop) {
    const elm = super.removeChild(childId);
    if (cascade && elm)
      return this;

    if (elm)
      return elm;

    if (this.test().id() !== childId)
      throw new Error("Unknown ChildId");

    if (!cascade)
      throw new Error("Use cascade to delete conditions");

    this.test().parent(null);
    this._test = null;

    if ((!stop) || (stop.id() !== this.id()))
      return this.remove(cascade, stop);

    return this;
  }

  /**
   * Gets and tests the test for the condition.
   *
   * @param {SieveAbstractElement} [item]
   *   the optional test to be set.
   *
   * @returns {SieveAbstractElement}
   *   the currently set test in case of a get or a self reference
   *   in case of a set.
   */
  test(item) {
    if (typeof (item) === "undefined")
      return this._test;

    if (item.parent())
      throw new Error("Test already bound to " + item.parent().id());

    // Release old test...
    if (this._test)
      this._test.parent(null);

    // ... and bind new test to this node
    this._test = item.parent(this);

    return this;
  }

  /**
   * Checks if the element contains any tests.
   *
   * @returns {boolean}
   *   true in case the if contains tests otherwise false.
   */
  empty() {
    return (!this._test) ? true : false;
  }

  /**
   * @inheritdoc
   */
  require(imports) {
    super.require(imports);
    this._test.require(imports);
  }

  /**
   * @inheritdoc
   */
  toScript() {
    return "if"
      + this.ws[BEFORE_TEST].toScript()
      + this._test.toScript()
      + this.ws[BEFORE_BLOCK].toScript()
      + super.toScript()
      + this.ws[AFTER_BLOCK].toScript();
  }
}

/**
 *
 */
class SieveCondition extends SieveBlockBody {

  /**
   * @inheritdoc
   */
  constructor(docshell, id) {
    super(docshell, id);

    this.elms[0] = this._createByName("condition/if", "if false {\r\n}\r\n");
  }

  /**
   * @inheritdoc
   */
  static isElement(parser, lexer) {
    return SieveIf.isElement(parser, lexer);
  }

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "condition";
  }

  /**
   * @inheritdoc
   */
  static nodeType() {
    return "condition";
  }

  /**
   * @inheritdoc
   */
  init(parser) {

    this.elms[0] = this._createByName("condition/if", parser);

    while (parser.startsWith("elsif")) {
      parser.extract("els");

      this.elms.push(
        this._createByName("condition/if", parser));

    }

    if (this._probeByName("condition/else", parser))
      this.elms.push(this._createByName("condition/else", parser));

    return this;
  }

  /**
   *
   * @param {String} childId
   *   the childs unique id.
   * @param {boolean} cascade
   * @param {SieveAbstractElement} stop
   */
  removeChild(childId, cascade, stop) {
    // should we remove the whole node
    if (typeof (childId) === "undefined")
      throw new Error("Child ID Missing");

    if (stop && (stop.id() === this.id()))
      cascade = false;

    const elm = super.removeChild(childId, cascade, stop);

    //  ... if we endup after delete with just an else, merge it into parent...
    if ((this.children().length) && (!this.children(0).test)) {
      // we copy all of our else statements into our parent...
      while (this.children(0).children().length)
        this.parent().append(this.children(0).children(0), this);

      return this.children(0).remove(cascade, stop);
    }


    // If SieveBlockBody cascaded through our parent, it should be null...
    // ... and we are done

    // 4. the condition might now be empty
    if (this.parent() && (!this.children().length))
      return this.remove(cascade, stop);

    if (this.parent() && cascade)
      return this;


    return elm;
  }

  /**
   * @inheritdoc
   */
  toScript() {
    let str = "";

    for (let i = 0; i < this.elms.length; i++) {
      if ((i > 0) && (this.elms[i].test))
        str += "els";

      str += this.elms[i].toScript();
    }

    return str;
  }
}

SieveLexer.register(SieveIf);
SieveLexer.register(SieveElse);
SieveLexer.register(SieveCondition);
