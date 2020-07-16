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

import { SieveLexer } from "./../../../toolkit/SieveLexer.js";
import { SieveAbstractElement } from "./../../../toolkit/logic/AbstractElements.js";
import { SieveTestList } from "./SieveTests.js";

const MAX_QUOTE_LEN = 50;
const BEFORE_OPERATOR = 0;
const AFTER_OPERATOR = 1;

/*
 * Currently we have only Unary Operators like not and Nary/Multary like anyof allof
 * Sieve does not implement binary (2) or tenary operators (3)
 */

/**
 * Implements the unary operators not
 * @inheritdoc
 */
function SieveNotOperator(docshell, id) {
  // first line with deadcode
  SieveAbstractElement.call(this, docshell, id);

  this.whiteSpace = [];
  this.whiteSpace[BEFORE_OPERATOR] = this._createByName("whitespace", " ");
  this.whiteSpace[AFTER_OPERATOR] = this._createByName("whitespace");

  this._literal = null;
}

SieveNotOperator.prototype = Object.create(SieveAbstractElement.prototype);
SieveNotOperator.prototype.constructor = SieveNotOperator;


SieveNotOperator.isElement = function (parser) {
  return parser.startsWith("not");
};

SieveNotOperator.nodeName = function () {
  return "operator/not";
};

SieveNotOperator.nodeType = function () {
  return "operator";
};

/**
 * @inheritdoc
 */
SieveNotOperator.prototype.require = function (imports) {
  return this._test.require(imports);
};

SieveNotOperator.prototype.init
  = function (parser) {
    // Syntax :
    // <"not"> <test>
    this._literal = parser.extract("not");

    this.whiteSpace[BEFORE_OPERATOR].init(parser);

    if (!this._probeByClass(["test", "operator"], parser))
      throw new Error("Test command expected but found:\n'" + parser.bytes(MAX_QUOTE_LEN) + "'...");

    this._test = this._createByClass(["test", "operator"], parser);

    if (this._probeByName("whitespace", parser))
      this.whiteSpace[AFTER_OPERATOR].init(parser);

    return this;
  };

SieveNotOperator.prototype.removeChild
  = function (childId, cascade, stop) {
    if (!cascade)
      throw new Error("only cascade possible");

    if (this.test().id() !== childId)
      throw new Error("Invalid Child id");

    // We cannot survive without a test ...
    this.test().parent(null);
    this._test = null;

    if (!stop || (stop.id() !== this.id()))
      return this.remove(cascade, stop);

    return this;
  };

SieveNotOperator.prototype.test
  = function (item) {
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
  };

SieveNotOperator.prototype.toScript
  = function () {
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
  };


/**
 * Implements the N-Ary Operator anyof/allof test
 * @inheritdoc
 */
function SieveAnyOfAllOfTest(docshell, id) {
  SieveTestList.call(this, docshell, id);
  this.whiteSpace = this._createByName("whitespace");
  this.isAllOf = true;
}

// Inherit TestList
SieveAnyOfAllOfTest.prototype = Object.create(SieveTestList.prototype);
SieveAnyOfAllOfTest.prototype.constructor = SieveAnyOfAllOfTest;

SieveAnyOfAllOfTest.isElement
  = function (parser) {
    if (parser.startsWith("allof"))
      return true;

    if (parser.startsWith("anyof"))
      return true;

    return false;
  };

SieveAnyOfAllOfTest.nodeName = function () {
  return "operator/anyof";
};

SieveAnyOfAllOfTest.nodeType = function () {
  return "operator";
};

SieveAnyOfAllOfTest.prototype.init
  = function (parser) {
    if (parser.startsWith("allof"))
      this.isAllOf = true;
    else if (parser.startsWith("anyof"))
      this.isAllOf = false;
    else
      throw new Error("allof or anyof expected but found: \n" + parser.bytes(MAX_QUOTE_LEN) + "...");

    // remove the allof or anyof
    parser.extract("allof".length);

    this.whiteSpace.init(parser);

    SieveTestList.prototype.init.call(this, parser);

    return this;
  };

SieveAnyOfAllOfTest.prototype.test
  = function (item, old) {
    if (typeof (item) === "undefined") {
      if (this.tests.length === 1)
        return this.tests[0][1];

      throw new Error(".test() has more than one element");
    }

    if (item.parent())
      throw new Error("test already bound to " + item.parent().id());


    // Release old test...
    this.append(item, old);

    if (typeof (old) !== "undefined")
      this.removeChild(old.id());
    /* if (this._test)
      this._test.parent(null);

    // ... and bind new test to this node
    this._test = ;*/

    return this;
  };

SieveAnyOfAllOfTest.prototype.toScript
  = function () {
    return (this.isAllOf ? "allof" : "anyof")
      + this.whiteSpace.toScript()
      + SieveTestList.prototype.toScript.call(this);
  };

SieveLexer.register(SieveNotOperator);
SieveLexer.register(SieveAnyOfAllOfTest);
