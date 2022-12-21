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

import { SieveAbstractElement } from "./../../../toolkit/logic/AbstractElements.mjs";
import { SieveTestList } from "./SieveTests.mjs";

import { SieveGrammar } from "../../../toolkit/logic/GenericElements.mjs";
import { id, token } from "../../../toolkit/logic/SieveGrammarHelper.mjs";

const MAX_QUOTE_LEN = 50;
const BEFORE_OPERATOR = 0;
const AFTER_OPERATOR = 1;

/*
 * Currently we have only Unary Operators like not and Nary/Multary like anyof allof
 * Sieve does not implement binary (2) or ternary operators (3)
 */

/**
 * Implements the unary operators not
 */
class SieveNotOperator extends SieveAbstractElement {

  /**
   * @inheritdoc
   */
  constructor(docshell, name, type) {
    super(docshell, name, type);

    this.whiteSpace = [];
    this.whiteSpace[BEFORE_OPERATOR] = this.createByName("whitespace", " ");
    this.whiteSpace[AFTER_OPERATOR] = this.createByName("whitespace");

    this._literal = null;
    this._tests = null;
  }

  /**
   * @inheritdoc
   */
  require(imports) {
    return this._test.require(imports);
  }

  /**
   * @inheritdoc
   */
  init(parser) {
    // Syntax :
    // <"not"> <test>
    this._literal = parser.extract("not");

    this.whiteSpace[BEFORE_OPERATOR].init(parser);

    if (!this.probeByClass(["@test", "@operator"], parser))
      throw new Error("Test command expected but found:\n'" + parser.bytes(MAX_QUOTE_LEN) + "'...");

    this._test = this.createByClass(["@test", "@operator"], parser);

    if (this.probeByName("whitespace", parser))
      this.whiteSpace[AFTER_OPERATOR].init(parser);

    return this;
  }

  /**
   * Checks if the block has a child with the given identifier
   *
   * @param {string} identifier
   *   the child's unique id
   * @returns {boolean}
   *   true in case the child is known otherwise false.
   */
  hasChild(identifier) {
    return (this.test().id() === identifier);
  }

  /**
   * Removes the given child from this element.
   *
   * @param {string} childId
   *   the child's unique id.
   * @returns {SieveAbstractElement}
   */
  removeChild(childId) {

    if (this.test().id() !== childId)
      throw new Error("Invalid Child id");

    // We cannot survive without a test ...
    this.test().parent(null);
    this._test = null;

    return this.remove();
  }

  /**
   * Gets or sets the not operator's test
   *
   * @param {SieveAbstractElement} [item]
   *   the element which should be set.
   * @returns {SieveAbstractElement}
   *   the test in case of a get or a self reference in case of a set
   */
  test(item) {
    if (typeof (item) === "undefined")
      return this._test;

    if (item.parent())
      throw new Error("test already bound to " + item.parent().id());

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
  toScript() {
    let result = "";

    if (this._literal !== null)
      result += this._literal;
    else
      result += "not";

    result += ""
      + this.whiteSpace[BEFORE_OPERATOR].toScript()
      + this._test.toScript()
      + this.whiteSpace[AFTER_OPERATOR].toScript();

    return result;
  }
}


/**
 * Implements the N-Ary Operator anyof/allof test
 */
class SieveAnyOfAllOfTest extends SieveTestList {

  /**
   * @inheritdoc
   */
  constructor(docshell, name, type) {
    super(docshell, name, type);

    this.whiteSpace = this.createByName("whitespace");
    this.isAllOf = true;
  }

  /**
   * @inheritdoc
   */
  init(parser) {
    if (parser.startsWith("allof"))
      this.isAllOf = true;
    else if (parser.startsWith("anyof"))
      this.isAllOf = false;
    else
      throw new Error("allof or anyof expected but found: \n" + parser.bytes(MAX_QUOTE_LEN) + "...");

    // remove the allof or anyof
    parser.extract("allof".length);

    this.whiteSpace.init(parser);

    super.init(parser);

    return this;
  }

  /**
   *
   * @param {SieveAbstractElement} item
   * @param {string} old
   * @returns {SieveAnyOfAllOfTest}
   *   a self reference.
   */
  test(item, old) {
    if (!item) {
      if (this.getChildren().length === 1)
        return this.getChild(0)[1];

      throw new Error(".test() has more than one element");
    }

    if (item.parent())
      throw new Error("test already bound to " + item.parent().id());


    // Release old test...
    this.append(item, old);

    if (typeof (old) !== "undefined")
      this.removeChild(old);

    /* if (this._test)
      this._test.parent(null);

    // ... and bind new test to this node
    this._test = ;*/

    return this;
  }

  /**
   * @inheritdoc
   */
  toScript() {
    return (this.isAllOf ? "allof" : "anyof")
      + this.whiteSpace.toScript()
      + super.toScript();
  }
}

SieveGrammar.addGeneric(
  id("operator/not", "@operator"),

  SieveNotOperator,
  token("not"));

SieveGrammar.addGeneric(
  id("operator/anyof", "@operator"),

  SieveAnyOfAllOfTest,
  // FIXME should be token("allof", "anyof")
  { "matcher" : (property, spec, parser) => {
    if (parser.startsWith("allof"))
      return true;

    if (parser.startsWith("anyof"))
      return true;

    return false;
  }}
);

// SieveGrammar.addList(
//   id("operator/anyof", "@operator"),
//
//   token("allof", "anyof")
//   token("(")
//   parameters(
//     items("test",["@test", "@operator"]))
//   token(")");
