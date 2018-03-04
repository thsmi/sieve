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

"use strict";

(function (exports) {

  /* global SieveLexer */
  /* global SieveAbstractElement */

  // TODO create an abstract class for get and set string...


  // CONSTRUCTOR:
  function SieveMultiLineString(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);

    this.text = "";

    this.whiteSpace = this._createByName("whitespace", "\r\n");
    this.hashComment = null;
  }

  SieveMultiLineString.prototype = Object.create(SieveAbstractElement.prototype);
  SieveMultiLineString.prototype.constructor = SieveMultiLineString;

  // PUBLIC STATIC:
  SieveMultiLineString.isElement
    = function (parser, lexer) {
      return parser.startsWith("text:");
    };

  SieveMultiLineString.nodeName = function () {
    return "string/multiline";
  };

  SieveMultiLineString.nodeType = function () {
    return "string/";
  };

  // PUBLIC:
  SieveMultiLineString.prototype.init
    = function (parser) {
      // <"text:"> *(SP / HTAB) (hash-comment / CRLF)
      /*  if (this._probeByName("string/multiline",parser) == false)
          throw "Multi-line String expected but found: \n"+parser.substr(0,50)+"...";*/

      // remove the "text:"
      parser.extract("text:");

      this.whiteSpace.init(parser, true);

      if (this._probeByName("whitespace/hashcomment", parser))
        this.hashComment = this._createByName("whitespace/hashcomment", parser);

      // we include the previously extracted linebreak. this makes life way easier...
      //  and allows us to match agains the unique "\r\n.\r\n" Pattern instead of
      // ... just ".\r\n"
      parser.rewind(2);

      this.text = parser.extractUntil("\r\n.\r\n");

      // dump the first linebreak and remove dot stuffing
      this.text = this.text.substr(2).replace(/^\.\./mg, ".");

      return this;
    };

  /**
   * Gets or Sets the string's value
   *
   * @param {String} [value]
   *   the value which should be set
   * @return {String}
   *   the current value
   */
  SieveMultiLineString.prototype.value
    = function (value) {
      if (typeof (value) === "undefined")
        return this.text;

      this.text = value;
      return this.text;
    };


  SieveMultiLineString.prototype.toScript
    = function () {
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
    };

  /* ******************************************************************************
      CLASSNAME:
        SieveQuotedString implements SieveObject

      CONSTUCTOR:
        public SieveQuotedString()

      PUBLIC FUNCTIONS:
        public static boolean isQuotedString(String data)
        public boolean parse(String data) throws Exception
        public String toScript()
        public String toXUL()

      MEMBER VARIABLES:
        private String text;

      DESCRIPTION:
        Defines the atomar String which in encapsulated in Quotes (")

  *******************************************************************************/


  // CONSTRUCTOR:
  function SieveQuotedString(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
    this.text = "";
  }

  SieveQuotedString.prototype = Object.create(SieveAbstractElement.prototype);
  SieveQuotedString.prototype.constructor = SieveQuotedString;

  // PUBLIC STATIC:
  SieveQuotedString.isElement
    = function (parser, lexer) {
      return parser.isChar("\"");
    };

  SieveQuotedString.nodeName = function () {
    return "string/quoted";
  };

  SieveQuotedString.nodeType = function () {
    return "string/";
  };

  // PUBLIC:
  SieveQuotedString.prototype.init
    = function (parser) {
      this.text = "";

      parser.extractChar("\"");

      if (parser.skipChar("\"")) {
        this.text = "";
        return this;
      }

      // we should not be tricked by escaped quotes

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
        if (this.text.charAt(this.text.length - 1) !== "\\")
          break;

        // well it is obviously escaped, so we have to check if the escape
        // character is escaped
        if (this.text.length >= 2)
          if (this.text.charAt(this.text.length - 2) === "\\")
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
    };

  /**
   * Gets or Sets the string's value
   *
   * @optional @param {String} value
   *   the value which should be set
   * @return {String}
   *   the current value
   */
  SieveQuotedString.prototype.value
    = function (value) {
      if (typeof (value) === "undefined")
        return this.text;

      if (value.search(/(\r\n|\n|\r)/gm) !== -1)
        throw new Error("Quoted string support only single line strings");

      this.text = value;

      return this.text;
    };


  SieveQuotedString.prototype.toScript
    = function () {
      return "\"" + this.text.replace("\\", "\\\\", "g").replace('"', '\\"', "g") + "\"";
    };

  /* ******************************************************************************
      CLASSNAME:
        SieveStringList implements SieveObject

      CONSTUCTOR:
        public SieveStringList()

      PUBLIC FUNCTIONS:
        public static boolean isStringList(String data)
        public boolean parse(String data) throws Exception
        public String toScript()
        public String toXUL()

      MEMBER VARIABLES:
        private Array[] elements;
        private boolean compact;

      DESCRIPTION:
        A Stringlist is an Array of Quotedstring

  *******************************************************************************/


  // CONSTRUCTOR:
  function SieveStringList(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);

    this.elements = [];

    // if the list contains only one entry...
    // ... use the comact syntac, this means ...
    // ... don't use the "[...]" to encapsulate the string
    this.compact = true;
  }

  SieveStringList.prototype = Object.create(SieveAbstractElement.prototype);
  SieveStringList.prototype.constructor = SieveStringList;

  // PUBLIC STATIC:
  SieveStringList.isElement
    = function (parser, lexer) {
      // the [ is not necessary if the list contains only one enty!
      if (parser.isChar("["))
        return true;

      if (lexer.probeByName("string/quoted", parser))
        return true;

      return false;
    };

  SieveStringList.nodeName = function () {
    return "stringlist";
  };

  SieveStringList.nodeType = function () {
    return "stringlist";
  };

  // PUBLIC:
  SieveStringList.prototype.init
    = function (parser) {
      this.elements = [];

      if (this._probeByName("string/quoted", parser)) {
        this.compact = true;
        let item = [];
        item[1] = this._createByName("string/quoted", parser);
        this.elements[0] = item;

        return this;
      }

      this.compact = false;

      parser.extractChar("[");

      while (!parser.isChar("]")) {
        if (this.elements.length)
          parser.extractChar(",");

        let element = [null, null, null];

        if (this._probeByName("whitespace", parser))
          element[0] = this._createByName("whitespace", parser);

        if (this._probeByName("string/quoted", parser) === false)
          throw new Error("Quoted String expected but found: \n" + parser.bytes(50) + "...");

        element[1] = this._createByName("string/quoted", parser);

        if (this._probeByName("whitespace", parser))
          element[2] = this._createByName("whitespace", parser);

        this.elements.push(element);
      }

      parser.extractChar("]");
      return this;
    };

  SieveStringList.prototype.contains
    = function (str, matchCase) {
      let item = "";

      if (typeof (matchCase) === "undefined")
        str = str.toLowerCase();

      for (let i = 0; i < this.elements.length; i++) {
        if (typeof (matchCase) === "undefined")
          item = this.elements[i][1].value().toLowerCase();
        else
          item = this.elements[i][1].value();

        if (item === str)
          return true;
      }

      return false;
    };

  SieveStringList.prototype.item
    = function (idx, value) {
      if (typeof (value) !== "undefined")
        this.elements[idx][1].value(value);

      return this.elements[idx][1].value();
    };

  SieveStringList.prototype.size
    = function () {
      return this.elements.length;
    };

  /**
   * Adds one or more elements to the end of the string list.
   *
   * @param {string|string[]} str
   *   the a string or array like object with strings which should be added.
   *
   * @return {SieveStringList}
   *   a self recerene to build chains.
   */
  SieveStringList.prototype.append
    = function (str) {
      // Append multiple strings at once...
      if (Array.isArray(str)) {

        str.forEach( (item) => { this.append(item); });
        return this;
      }

      let elm = [null, "", null];
      elm[1] = this._createByName("string/quoted", '""');
      elm[1].value(str);

      this.elements.push(elm);

      return this;
    };

  /**
   * Removes all string list entries.
   *
   * @return {SieveStringList}
   *   a self reference to build chains.
   */
  SieveStringList.prototype.clear
    = function () {
      this.elements = [];

      return this;
    };

  SieveStringList.prototype.remove
    = function (str) {
      for (let i = 0; i < this.elements.length; i++) {
        if (this.elements[i][1].value() !== str)
          continue;

        this.elements.splice(i, 1);
      }
    };


  SieveStringList.prototype.toScript
    = function () {
      if (this.elements.length === 0)
        return '""';

      if (this.compact && this.elements.length <= 1)
        return this.elements[0][1].toScript();

      let result = "[";
      let separator = "";

      for (let i = 0; i < this.elements.length; i++) {
        result = result + separator
          + ((this.elements[i][0] !== null) ? this.elements[i][0].toScript() : "")
          + this.elements[i][1].toScript()
          + ((this.elements[i][2] !== null) ? this.elements[i][2].toScript() : "");

        separator = ",";
      }
      result += "]";

      return result;
    };

  /**
   * Defines an abstracted SieveString primitive by combinig the two atomar String types
   * SieveQuotedString and SieveMultiLineString.
   *
   * It converts automatically between the two string types depending on the context.
   *
   * @param {} docshell
   * @param {} id
   *
   * @constructor
   */
  function SieveString(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
    this.string = this._createByName("string/quoted");
  }

  SieveString.prototype = Object.create(SieveAbstractElement.prototype);
  SieveString.prototype.constructor = SieveString;

  // PUBLIC STATIC:
  SieveString.isElement
    = function (parser, lexer) {
      return lexer.probeByClass(["string/"], parser);
    };

  SieveString.nodeName = function () {
    return "string";
  };

  SieveString.nodeType = function () {
    return "string";
  };

  // PUBLIC:
  SieveString.prototype.init
    = function (parser) {
      this.string = this._createByClass(["string/"], parser);

      return this;
    };


  /**
   * Gets or sets a string's value.
   *
   * When setting a string it automatically adjusts
   * the type to a quoted string or a multiline string.
   *
   * @param {String} [str]
   *   the strings new value in case it should be changed.
   * @return {String}
   *   the string stored in this object
   */
  SieveString.prototype.value
    = function (str) {
      if (typeof str === "undefined")
        return this.string.value();

      // ensure it's a string;
      str = "" + str;

      // Create a dummy object. The conversion might fail
      // and we do not want to loose the original string.
      let string = this.string;

      // Check if we need a type conversion.
      if (str.search(/(\r\n|\n|\r)/gm) !== -1) {

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
    };

  SieveString.prototype.toScript
    = function () {
      return this.string.toScript();
    };


  /**
   * Comparators sepcify the charset which should be used for string comparison
   * By default two matchtypes are supported.
   *
   * "i;octet"
   *   Compares strings byte by byte (octet by octet) used typically with UTF-8 octetts
   *
   * "i;ascii-codemap"
   *   Converts strings before comparison to US-ASCII.
   *   All US-ASCII letters are converted to upercase (0x61-0x7A to 0x41-0x5A)
   *   "hello" equals "HELLO"
   *
   * "i;ascii-numeric"
   *   Interprets the string as decimal positive integer represented in US-ASCII digits (0x30 to 0x39).
   *   The comparison starts from tbe beginning of the string and ends with the first non-digit or the
   *   end of string.
   **/

  function SieveComparator(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
    this.whiteSpace = this._createByName("whitespace", " ");
    this._comparator = this._createByName("string/quoted", "\"i;ascii-casemap\"");
    this.optional = true;
  }

  SieveComparator.prototype = Object.create(SieveAbstractElement.prototype);
  SieveComparator.prototype.constructor = SieveComparator;

  SieveComparator.isElement
    = function (parser, lexer) {
      return (parser.startsWith(":comparator"));
    };

  SieveComparator.nodeName = function () {
    return "comparator";
  };

  SieveComparator.nodeType = function () {
    return "comparison";
  };

  SieveComparator.prototype.init
    = function (parser) {
      // Syntax :
      // <":comparator"> <comparator-name: string>
      parser.extract(":comparator");

      this.whiteSpace.init(parser);

      this._comparator.init(parser);

      this.optional = false;

      return this;
    };

  SieveComparator.prototype.isOptional
    = function (value) {
      if (typeof (value) === "undefined")
        return ((this.optional) && (this._comparator.value() === "i;ascii-casemap"));

      this.optional = value;
    };

  SieveComparator.prototype.comparator
    = function (value) {
      if (typeof (value) === "undefined")
        return this._comparator.value();

      this._comparator.value(value);

      return this;
    };

  SieveComparator.prototype.toScript
    = function () {
      if (this.isOptional())
        return "";

      return ":comparator"
        + this.whiteSpace.toScript()
        + this._comparator.toScript();
    };

  if (!SieveLexer)
    throw new Error("Could not register Strings Elements");

  SieveLexer.register(SieveStringList);
  SieveLexer.register(SieveString);
  SieveLexer.register(SieveQuotedString);
  SieveLexer.register(SieveMultiLineString);
  SieveLexer.register(SieveComparator);

})(window);
