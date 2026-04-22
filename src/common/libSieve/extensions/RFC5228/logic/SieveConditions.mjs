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

import { SieveBlock, SieveBlockBody } from "./SieveBlocks.mjs";

import { SieveGrammar } from "../../../toolkit/logic/GenericElements.mjs";
import { id, token } from "../../../toolkit/logic/SieveGrammarHelper.mjs";


const BEFORE_BLOCK = 0;
const AFTER_BLOCK = 1;
const BEFORE_TEST = 2;

const FIRST_CHILD = 0;

/**
 * Implements the else block of an if else statement
 */
class SieveElse extends SieveBlock {

  /**
   * @inheritdoc
   */
  constructor(docshell, name, type) {
    super(docshell, name, type);

    this.ws = [];

    this.ws[BEFORE_BLOCK] = this.createByName("whitespace", "\r\n");
    this.ws[AFTER_BLOCK] = this.createByName("whitespace", "\r\n");
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
 * Implements a n if block from an if/else statement.
 */
class SieveIf extends SieveBlock {

  /**
   * @inheritdoc
   */
  constructor(docshell, name, type) {
    super(docshell, name, type);

    this._test = null;

    this.ws = [];
    this.ws[BEFORE_TEST] = this.createByName("whitespace");
    this.ws[BEFORE_BLOCK] = this.createByName("whitespace", "\r\n");
    this.ws[AFTER_BLOCK] = this.createByName("whitespace", "\r\n");
  }

  /**
   * @inheritdoc
   */
  init(parser) {
    parser.extract("if");

    this.ws[BEFORE_TEST].init(parser);

    this._test = this.createByClass(["@test", "@operator"], parser);

    this.ws[BEFORE_BLOCK].init(parser);

    super.init(parser);

    this.ws[AFTER_BLOCK].init(parser);

    return this;
  }

  /**
   * @inheritdoc
   */
  hasChild(identifier) {

    if (this._test.id() === identifier)
      return true;

    return super.hasChild(identifier);
  }

  /**
   * Removes the child node from the test.
   *
   * @param {string} childId
   *   the child's unique id.
   *
   * @returns {SieveAbstractElement}
   *   the deleted element.
   */
  removeChild(childId) {

    // Check if the test should be deleted. If so we just remove the complete
    // if, because it can't exist without a test.
    if (this._test && this._test.id() === childId) {

      const elm = this._test;
      this._test.parent(null);
      this._test = null;

      return elm;
    }

    // Otherwise we are asked to delete one of our block children.
    // It is perfectly ok if we end up with an empty body.
    if (super.hasChild(childId))
      return super.removeChild(childId);

    throw new Error(`Can not remove unknown id ${childId}`);
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
   * @inheritdoc
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
  constructor(docshell, name, type) {
    super(docshell, name, type);

    this.elms[0] = this.createByName("condition/if", "if false {\r\n}\r\n");
  }

  /**
   * @inheritdoc
   */
  init(parser) {

    this.elms[0] = this.createByName("condition/if", parser);

    while (parser.startsWith("elsif")) {
      parser.extract("els");

      this.elms.push(
        this.createByName("condition/if", parser));

    }

    if (this.probeByName("condition/else", parser))
      this.elms.push(this.createByName("condition/else", parser));

    return this;
  }

  /**
   * Removes the given condition.
   *
   * In case we end up with an empty else, we clear the else and merge it into
   * the parent node.
   *
   * @param {string} childId
   *   the child's unique id.
   *
   * @returns {SieveAbstractElement}
   *   the deleted child element
   */
  removeChild(childId) {

    const elm = super.removeChild(childId);

    // We can skip in case we are out of conditions.
    if (!this.getChildren().length)
      return elm;

    // Otherwise we need to check if our first child is a test.
    // we do this by checking if a test attribute is resend.
    const child = this.getChild(FIRST_CHILD);
    if (child.test)
      return elm;

    // If not we have a dangling else. We merge it into parent block by
    // moving all of our else statements into our parent...
    while (child.getChildren().length)
      this.parent().append(child.getChild(FIRST_CHILD), this);

    return this.getChild(FIRST_CHILD).remove(stop);
  }

  /**
   * @inheritdoc
   */
  toScript() {
    let str = "";

    for (let i = 0; i < this.getChildren().length; i++) {
      const child = this.getChild(i);
      if ((i > 0) && (child.test))
        str += "els";

      str += child.toScript();
    }

    return str;
  }
}

SieveGrammar.addGeneric(
  id("condition/if", "@condition/"),

  SieveIf,
  token("if"));

SieveGrammar.addGeneric(
  id("condition/else", "@condition/"),

  SieveElse,
  token("else"));

SieveGrammar.addGeneric(
  id("condition", "@condition"),

  SieveCondition,
  token("if"));
