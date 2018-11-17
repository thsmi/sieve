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

/* global window */


(function () {

  "use strict";

  /* global SieveLexer */
  /* global SieveAbstractElement */
  /* global SieveParser */

  // ToDo HashComment seperated by linebreaks are equivalent to bracket Comments...

  /**
   *
   */
  class SieveLineBreak extends SieveAbstractElement {

    /**
     * @inheritDoc
     */
    static isElement(parser, lexer) {
      return parser.startsWith("\r\n");
    }

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "whitespace/linebreak";
    }

    /**
     * @inheritDoc
     */
    static nodeType() {
      return "whitespace/";
    }

    /**
     * @inheritDoc
     */
    init(parser) {
      parser.extract("\r\n");
      return this;
    }

    /**
     * @inheritDoc
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
     * @inheritDoc
     */
    constructor(docshell, id) {
      super(docshell, id);
      this.whiteSpace = "";
    }

    /**
     * @inheritDoc
     */
    static isElement(parser, lexer) {
      return (parser.isChar([" ", "\t"]));
    }

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "whitespace/deadcode";
    }

    /**
     * @inheritDoc
     */
    static nodeType() {
      return "whitespace/";
    }

    /**
     * @inheritDoc
     */
    init(parser) {
      this.whiteSpace = parser.extractToken([" ", "\t"]);

      return this;
    }

    /**
     * @inheritDoc
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
     * @inheritDoc
     */
    constructor(docshell, id) {
      super(docshell, id);
      this.text = "";
    }

    /**
     * @inheritDoc
     */
    static isElement(parser, lexer) {
      return parser.startsWith("/*");
    }

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "comment/bracketcomment";
    }

    /**
     * @inheritDoc
     */
    static nodeType() {
      return "comment";
    }

    /**
     * @inheritDoc
     */
    init(parser) {
      parser.extract("/*");

      this.text = parser.extractUntil("*/");

      return this;
    }

    /**
     * @inheritDoc
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
     * @inheritDoc
     */
    constructor(docshell, id) {
      super(docshell, id);
      this.text = "";
    }

    /**
     * @inheritDoc
     */
    static isElement(parser, lexer) {
      return parser.isChar("#");
    }

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "comment/hashcomment";
    }

    /**
     * @inheritDoc
     */
    static nodeType() {
      return "comment";
    }

    /**
     * @inheritDoc
     */
    init(parser) {
      parser.extract("#");

      // ... and find the end of the comment
      this.text = parser.extractUntil("\r\n");

      return this;
    }

    /**
     * @inheritDoc
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
     * @inheritDoc
     */
    constructor(docshell, id) {
      super(docshell, id);
      this.elements = [];
    }

    /**
     * @inheritDoc
     */
    static isElement(parser, lexer) {
      return lexer.probeByClass(["whitespace/", "comment"], parser);
    }

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "whitespace";
    }

    /**
     * @inheritDoc
     */
    static nodeType() {
      return "whitespace";
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
      for (let key in this.elements)
        if (this.elements[key].nodeType !== "whitespace/")
          return false;

      return true;
    }

    /**
     * Parses a String for whitespace characters. It stops as soon as
     * it finds the first non whitespace. This means this method extracts
     * zero or more whitespace characters
     *
     * @param {SieveParser|String} parser
     *  the parser element which contains the data
     * @param {boolean} crlf
     *   if true the parser will stop after the first linebreak (\r\n) (this means the linebreak will be extracted)
     *   or when it encounters a non whitespace character.
     * @return {SieveWhiteSpace}
     *  a self reference
     */
    init(parser, crlf) {

      if (typeof (parser) === "string")
        parser = new SieveParser(parser);

      let isCrlf = false;
      this.elements = [];

      // After the import section only deadcode and actions are valid
      while (this._probeByClass(["whitespace/", "comment"], parser)) {
        // Check for CRLF...
        if (crlf && this._probeByName("whitespace/linebreak", parser))
          isCrlf = true;

        this.elements.push(this._createByClass(["whitespace/", "comment"], parser));

        // break if we found a CRLF
        if (isCrlf)
          break;
      }

      return this;
    }

    /**
     * @inheritDoc
     */
    toScript() {
      let result = "";
      for (let key in this.elements)
        result += this.elements[key].toScript();

      return result;
    }
  }

  if (!SieveLexer)
    throw new Error("Could not register DeadCode Elements");

  SieveLexer.register(SieveLineBreak);
  SieveLexer.register(SieveDeadCode);
  SieveLexer.register(SieveBracketComment);
  SieveLexer.register(SieveHashComment);

  SieveLexer.register(SieveWhiteSpace);

})(window);
