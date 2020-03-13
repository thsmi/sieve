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

(function (exports) {

  "use strict";

  const TOKEN_NOT_FOUND = -1;

  const LEADING_WHITESPACE = 0;
  const STRING_VALUE = 1;
  const TAILING_WHITESPACE = 2;

  const ONE_CHAR = 1;
  const TWO_CHARS = 2;

  const MAX_QUOTE_LEN = 50;

  /* global SieveLexer */
  /* global SieveAbstractElement */

  /**
   * Implements as sieve multiline element.
   */
  class SieveMultiLineString extends SieveAbstractElement {

    /**
     * @inheritdoc
     */
    constructor(docshell, id) {
      super(docshell, id);

      this.text = "";

      this.whiteSpace = this._createByName("whitespace", "\r\n");
      this.hashComment = null;
    }

    /**
     * @inheritdoc
     */
    static isElement(parser, lexer) {
      return parser.startsWith("text:");
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "string/multiline";
    }

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "string/";
    }

    /**
     * @inheritdoc
     */
    init(parser) {
      // <"text:"> *(SP / HTAB) (hash-comment / CRLF)

      // remove the "text:"
      parser.extract("text:");

      this.whiteSpace.init(parser, true);

      if (this._probeByName("comment/hashcomment", parser))
        this.hashComment = this._createByName("comment/hashcomment", parser);

      // we include the previously extracted linebreak. this makes life way easier...
      //  and allows us to match against the unique "\r\n.\r\n" Pattern instead of
      // ... just ".\r\n"
      parser.rewind("\r\n".length);

      this.text = parser.extractUntil("\r\n.\r\n");

      // dump the first linebreak and remove dot stuffing
      this.text = this.text.substr("\r\n".length).replace(/^\.\./mg, ".");

      return this;
    }

    /**
     * Gets or Sets the string's value
     *
     * @param {string} [value]
     *   the value which should be set
     * @returns {string}
     *   the current value
     */
    value(value) {
      if (typeof (value) === "undefined")
        return this.text;

      this.text = value;
      return this.text;
    }

    /**
     * @inheritdoc
     */
    toScript() {
      let text = this.text;

      if (text !== "")
        text += "\r\n";

      // Dot stuffing...
      text = text.replace(/^\./mg, "..");

      return "text:"
        + this.whiteSpace.toScript()
        + ((this.hashComment) ? this.hashComment.toScript() : "")
        + text
        + ".\r\n";
    }
  }

  /**
   * Defines the atomic String which in encapsulated in Quotes (")
   */
  class SieveQuotedString extends SieveAbstractElement {

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
    static isElement(parser) {
      return parser.isChar("\"");
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "string/quoted";
    }

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "string/";
    }

    /**
     * @inheritdoc
     */
    init(parser) {
      this.text = "";

      parser.extractChar("\"");

      if (parser.skipChar("\"")) {
        this.text = "";
        return this;
      }

      // Escaping is a but ugly. Due to Sieves implicit
      // escape repair mechanism.

      /*
       * " blubber "
       * " blub \" er" -> ignore
       * " blubber \\"  -> blubber \ -> skip
       * " blubber \\\""  -> blubber \" ->ignore
       * " blubber \\\\"
       *
       *  "\\"
       */

      while (true) {
        this.text += parser.extractUntil("\"");

        // Skip if the quote is not escaped
        if (this.text.charAt(this.text.length - ONE_CHAR) !== "\\")
          break;

        // well it is obviously escaped, so we have to check if the escape
        // character is escaped
        if (this.text.length >= TWO_CHARS)
          if (this.text.charAt(this.text.length - TWO_CHARS) === "\\")
            break;

        // add the quote, it was escaped...
        this.text += "\"";
      }

      // Only double quotes and backslashes are escaped...
      // ... so we convert \" into "
      this.text = this.text.replace(/\\"/g, '"');
      // ... and convert \\ to \
      this.text = this.text.replace(/\\\\/g, '\\');

      // ... We should finally ignore an other backslash patterns...
      // ... but as they are illegal anyway, we assume a perfect world.

      return this;
    }

    /**
     * Gets or Sets the string's value
     *
     * @param {string} [value]
     *   the value which should be set
     * @returns {string}
     *   the current value
     */
    value(value) {
      if (typeof (value) === "undefined")
        return this.text;

      if (value.search(/(\r\n|\n|\r)/gm) !== TOKEN_NOT_FOUND)
        throw new Error("Quoted string support only single line strings");

      this.text = value;

      return this.text;
    }

    /**
     * @inheritdoc
     */
    toScript() {
      // we need to make sure all backslashes and all quotes are escaped.
      return "\"" + this.text.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + "\"";
    }
  }


  /**
   * A Stringlist is an Array of quoted string
   */
  class SieveStringList extends SieveAbstractElement {

    /**
     * @inheritdoc
     */
    constructor(docshell, id) {
      super(docshell, id);

      this.elements = [];

      // if the list contains only one entry...
      // ... use the compact syntax, this means ...
      // ... don't use the "[...]" to encapsulate the string
      this.compact = true;
    }

    /**
     * @inheritdoc
     */
    static isElement(parser, lexer) {
      // the [ is not necessary if the list contains only one entry!
      if (parser.isChar("["))
        return true;

      if (lexer.probeByName("string/quoted", parser))
        return true;

      return false;
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "stringlist";
    }

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "stringlist";
    }

    /**
     * @inheritdoc
     */
    init(parser) {

      this.elements = [];

      if (this._probeByName("string/quoted", parser)) {
        this.compact = true;
        const item = [];
        item[STRING_VALUE] = this._createByName("string/quoted", parser);
        this.elements = [item];

        return this;
      }

      this.compact = false;

      parser.extractChar("[");

      while (!parser.isChar("]")) {
        if (this.elements.length)
          parser.extractChar(",");

        const element = [null, null, null];

        if (this._probeByName("whitespace", parser))
          element[LEADING_WHITESPACE] = this._createByName("whitespace", parser);

        if (this._probeByName("string/quoted", parser) === false)
          throw new Error("Quoted String expected but found: \n" + parser.bytes(MAX_QUOTE_LEN) + "...");

        element[STRING_VALUE] = this._createByName("string/quoted", parser);

        if (this._probeByName("whitespace", parser))
          element[TAILING_WHITESPACE] = this._createByName("whitespace", parser);

        this.elements.push(element);
      }

      parser.extractChar("]");
      return this;
    }

    /**
     * Checks if the given string is contained in the stringlist.
     *
     * @param {string} str
     *   the string which should be checked
     * @param {boolean} [matchCase]
     *   if true the comparison will be case sensitive.
     *   Otherwise the comparison is case insensitive.
     *   if omitted the comparison default to case sensitive.
     *
     * @returns {boolean}
     *   true in case the string is contained otherwise false
     */
    contains(str, matchCase) {
      let item = "";

      if (typeof (matchCase) === "undefined")
        str = str.toLowerCase();

      for (let i = 0; i < this.elements.length; i++) {
        if (typeof (matchCase) === "undefined")
          item = this.elements[i][STRING_VALUE].value().toLowerCase();
        else
          item = this.elements[i][STRING_VALUE].value();

        if (item === str)
          return true;
      }

      return false;
    }

    /**
     * Gets or sets the item at the given index.
     *
     * @param {int} idx
     *   the index which should be set
     * @param {string} [value]
     *   the string value to set
     * @returns {string}
     *   the current value at the index
     */
    item(idx, value) {
      if (typeof (value) !== "undefined")
        this.elements[idx][STRING_VALUE].value(value);

      return this.elements[idx][STRING_VALUE].value();
    }

    /**
     * @returns {int}
     *   the number of elements contained in the list.
     */
    size() {
      return this.elements.length;
    }

    /**
     * Adds one or more elements to the end of the string list.
     *
     * @param {string|string[]} str
     *   the a string or array like object with strings which should be added.
     *
     * @returns {SieveStringList}
     *   a self reference to build chains.
     */
    append(str) {
      // Append multiple strings at once...
      if (Array.isArray(str)) {

        str.forEach((item) => { this.append(item); });
        return this;
      }

      const elm = [null, "", null];
      elm[STRING_VALUE] = this._createByName("string/quoted", '""');
      elm[STRING_VALUE].value(str);

      this.elements.push(elm);

      return this;
    }

    /**
     * Removes all string list entries.
     *
     * @returns {SieveStringList}
     *   a self reference to build chains.
     */
    clear() {
      this.elements = [];

      return this;
    }

    /**
     * Removes the given string from the string list
     *
     * @param {string} str
     *   the string to remove
     * @returns {SieveStringList}
     *   a self reference to build chains.
     */
    remove(str) {
      for (let i = 0; i < this.elements.length; i++) {
        if (this.elements[i][STRING_VALUE].value() !== str)
          continue;

        this.elements.splice(i, 1);
      }

      return this;
    }

    /**
     * Get or set the string lists values.
     *
     * @param {string|string[]} [values]
     *   optional, the values to set
     *
     * @returns {string[]}
     *   the currently set values.
     */
    values(values) {

      if (values !== null && typeof (values) !== "undefined")
        this.clear().append(values);

      const result = [];
      this.elements.forEach( (element) => {
        result.push(element[STRING_VALUE].value());
      });

      return result;
    }

    /**
     * @inheritdoc
     */
    toScript() {
      if (this.elements.length === 0)
        return '""';

      if (this.compact && this.elements.length <= 1)
        return this.elements[0][STRING_VALUE].toScript();

      let result = "[";
      let separator = "";

      for (let i = 0; i < this.elements.length; i++) {
        result += separator;

        if (this.elements[i][LEADING_WHITESPACE] !== null && (typeof (this.elements[i][LEADING_WHITESPACE]) !== "undefined"))
          result += this.elements[i][LEADING_WHITESPACE].toScript();

        result += this.elements[i][STRING_VALUE].toScript();

        if (this.elements[i][TAILING_WHITESPACE] !== null && (typeof (this.elements[i][TAILING_WHITESPACE]) !== "undefined"))
          result += this.elements[i][TAILING_WHITESPACE].toScript();

        separator = ",";
      }
      result += "]";

      return result;
    }
  }

  /**
   * Defines an abstracted SieveString primitive by combining the two atomic String types
   * SieveQuotedString and SieveMultiLineString.
   *
   * It converts automatically between the two string types depending on the context.
   */
  class SieveString extends SieveAbstractElement {

    /**
     * @inheritdoc
     */
    constructor(docshell, id) {
      super(docshell, id);
      this.string = this._createByName("string/quoted");
    }

    /**
     * @inheritdoc
     */
    static isElement(parser, lexer) {
      return lexer.probeByClass(["string/"], parser);
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "string";
    }

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "string";
    }

    /**
     * @inheritdoc
     */
    init(parser) {
      this.string = this._createByClass(["string/"], parser);

      return this;
    }

    /**
     * Gets or sets a string's value.
     *
     * When setting a string it automatically adjusts
     * the type to a quoted string or a multiline string.
     *
     * @param {string} [str]
     *   the strings new value in case it should be changed.
     * @returns {string}
     *   the string stored in this object
     */
    value(str) {
      if (typeof str === "undefined")
        return this.string.value();

      // ensure it's a string;
      str = "" + str;

      // Create a dummy object. The conversion might fail
      // and we do not want to loose the original string.
      let string = this.string;

      // Check if we need a type conversion.
      if (str.search(/(\r\n|\n|\r)/gm) !== TOKEN_NOT_FOUND) {

        // The string has linebreaks so it has to be a multiline string!
        if (!(this.string instanceof SieveMultiLineString))
          string = this._createByName("string/multiline");
      }
      else {

        // No linebreaks, it's better to use a quoted string. Makes scripts more readable
        if (!(this.string instanceof SieveQuotedString))
          string = this._createByName("string/quoted");
      }

      // Add the new value...
      string.value(str);

      // ...and rotate it back.
      this.string = string;

      return this.string.value();
    }

    /**
     * Returns a quote of the given string.
     *
     * In case the string exceeds the maximum length
     * it will be truncated and ... are appended.
     *
     * @param {int} [len]
     *   the maximal length
     * @returns {string}
     *   returns the string's quote.
     */
    quote(len) {

      if (typeof(len) === "undefined" || len === null)
        len = MAX_QUOTE_LEN;

      let str = this.value();

      if (str.length > len)
        str = str.substr(0, len) + "...";

      return str;
    }

    /**
     * @inheritdoc
     */
    toScript() {
      return this.string.toScript();
    }
  }


  if (!SieveLexer)
    throw new Error("Could not register Strings Elements");

  SieveLexer.register(SieveStringList);
  SieveLexer.register(SieveString);
  SieveLexer.register(SieveQuotedString);
  SieveLexer.register(SieveMultiLineString);

})(window);
