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

import { SieveParser } from "./../../../toolkit/SieveParser.mjs";
import { SieveAbstractElement } from "./../../../toolkit/logic/AbstractElements.mjs";

import { SieveGrammar } from "../../../toolkit/logic/GenericElements.mjs";
import { id, token, items } from "../../../toolkit/logic/SieveGrammarHelper.mjs";

// ToDo HashComment separated by line breaks are equivalent to bracket Comments...

/**
 *
 */
class SieveLineBreak extends SieveAbstractElement {

  /**
   * @inheritdoc
   */
  init(parser) {
    parser.extract("\r\n");
    return this;
  }

  /**
   * @inheritdoc
   */
  toScript() {
    return "\r\n";
  }
}

/**
 *
 */
class SieveDeadCode extends SieveAbstractElement {

  /**
   * @inheritdoc
   */
  constructor(docshell, name, type) {
    super(docshell, name, type);
    this.whiteSpace = "";
  }

  /**
   * @inheritdoc
   */
  init(parser) {
    this.whiteSpace = parser.extractToken([" ", "\t"]);

    return this;
  }

  /**
   * @inheritdoc
   */
  toScript() {
    return this.whiteSpace;
  }
}

/**
 * A bracket comment are classic c comments. They start
 * with a slash and asterisk and end with an asterisk and
 * slash
 */
class SieveBracketComment extends SieveAbstractElement {

  /**
   * @inheritdoc
   */
  constructor(docshell, name, type) {
    super(docshell, name, type);
    this.text = "";
  }

  /**
   * @inheritdoc
   */
  init(parser) {
    parser.extract("/*");

    this.text = parser.extractUntil("*/");

    return this;
  }

  /**
   * @inheritdoc
   */
  toScript() {
    return "/*" + this.text + "*/";
  }
}

/**
 * Implements a sieve hash comment element.
 * It starts with a hash(#) character and ends with a linebreak
 */
class SieveHashComment extends SieveAbstractElement {

  /**
   * @inheritdoc
   */
  constructor(docshell, name, type) {
    super(docshell, name, type);
    this.text = "";
  }

  /**
   * @inheritdoc
   */
  init(parser) {
    parser.extract("#");

    // ... and find the end of the comment
    this.text = parser.extractUntil("\r\n");

    return this;
  }

  /**
   * @inheritdoc
   */
  toScript() {
    return "#" + this.text + "\r\n";
  }
}

/**
 * An element which consumes all kinds of whitespace.
 *
 * Whitespace can be all kind of code without any functional
 * logic like space characters, tabs, linebreaks and comments.
 */
class SieveWhiteSpace extends SieveAbstractElement {

  /**
   * @inheritdoc
   */
  constructor(docshell, name, type) {
    super(docshell, name, type);
    this.elements = [];
  }

  /**
   * In Gerneral there are two kinds of whitespace.
   *
   * Dead code which is only used to separate tokens. This kind of
   * whitespace can be scrapped without any loss of information
   *
   * Whitespace with comments. In contrast to dead code, the comments
   * carry meta information. We can not scrap them without loosing
   * information.
   *
   * This method determines if the whitespace is dead code only. Or
   * if it contains Meta information.
   *
   * @returns {boolean}
   *   true in case the whitespace is dead code and does not contain
   *   any meta information. Otherwise false
   */
  isDeadCode() {
    for (const key in this.elements)
      if (this.elements[key].nodeType !== "@whitespace/")
        return false;

    return true;
  }

  /**
   * Parses a String for whitespace characters. It stops as soon as
   * it finds the first non whitespace. This means this method extracts
   * zero or more whitespace characters
   *
   * @param {SieveParser|string} parser
   *  the parser element which contains the data
   * @param {boolean} crlf
   *   if true the parser will stop after the first linebreak (\r\n) (this means the linebreak will be extracted)
   *   or when it encounters a non whitespace character.
   * @returns {SieveWhiteSpace}
   *  a self reference
   */
  init(parser, crlf) {

    if (typeof (parser) === "string")
      parser = new SieveParser(parser);

    let isCrlf = false;
    this.elements = [];

    // After the import section only deadcode and actions are valid
    while (this.probeByClass(["@whitespace/", "@comment"], parser)) {
      // Check for CRLF...
      if (crlf && this.probeByName("whitespace/linebreak", parser))
        isCrlf = true;

      this.elements.push(this.createByClass(["@whitespace/", "@comment"], parser));

      // break if we found a CRLF
      if (isCrlf)
        break;
    }

    return this;
  }

  /**
   * @inheritdoc
   */
  toScript() {
    let result = "";
    for (const key in this.elements)
      result += this.elements[key].toScript();

    return result;
  }
}


SieveGrammar.addGeneric(
  id("whitespace/linebreak", "@whitespace/"),

  SieveLineBreak,
  token("\r\n"));

SieveGrammar.addGeneric(
  id("whitespace/deadcode", "@whitespace/"),

  SieveDeadCode,
  // FIXME : token(" ", "\t")
  { "matcher": (property, spec, parser) => { return (parser.isChar([" ", "\t"])); } });

SieveGrammar.addGeneric(
  id("comment/bracketcomment", "@comment"),

  SieveBracketComment,
  token("/*"));

SieveGrammar.addGeneric(
  id("comment/hashcomment", "@comment"),

  SieveHashComment,
  token("#"));

SieveGrammar.addGeneric(
  id("whitespace", "@whitespace"),

  SieveWhiteSpace,
  items("@whitespace/", "@comment"));
