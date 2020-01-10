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
     * @inheritdoc
     */
    static isElement(parser, lexer) {
      return parser.startsWith("\r\n");
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "whitespace/linebreak";
    }

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "whitespace/";
    }

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
    constructor(docshell, id) {
      super(docshell, id);
      this.whiteSpace = "";
    }

    /**
     * @inheritdoc
     */
    static isElement(parser, lexer) {
      return (parser.isChar([" ", "\t"]));
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "whitespace/deadcode";
    }

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "whitespace/";
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
    constructor(docshell, id) {
      super(docshell, id);
      this.text = "";
    }

    /**
     * @inheritdoc
     */
    static isElement(parser, lexer) {
      return parser.startsWith("/*");
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "comment/bracketcomment";
    }

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "comment";
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
    constructor(docshell, id) {
      super(docshell, id);
      this.text = "";
    }

    /**
     * @inheritdoc
     */
    static isElement(parser, lexer) {
      return parser.isChar("#");
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "comment/hashcomment";
    }

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "comment";
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
    constructor(docshell, id) {
      super(docshell, id);
      this.elements = [];
    }

    /**
     * @inheritdoc
     */
    static isElement(parser, lexer) {
      return lexer.probeByClass(["whitespace/", "comment"], parser);
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "whitespace";
    }

    /**
     * @inheritdoc
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
      for (const key in this.elements)
        if (this.elements[key].nodeType !== "whitespace/")
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
     * @inheritdoc
     */
    toScript() {
      let result = "";
      for (const key in this.elements)
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
