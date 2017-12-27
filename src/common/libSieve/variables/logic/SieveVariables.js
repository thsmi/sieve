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


  //   Usage:  ":lower" / ":upper" / ":lowerfirst" / ":upperfirst" /
  //           ":quotewildcard" / ":length"

  // set [MODIFIER] <name: string> <value: string>


  /**
   * The "set" action stores the specified value in the variable identified by name.
   * The name MUST be a constant string and conform to the syntax of variable-name.
   * Match variables cannot be set.  A namespace cannot be used unless an extension
   * explicitly allows its use in "set". An invalid name MUST be detected as a syntax error.
   *
   * Variable names are case insensitive.
   *
   * Syntax:  set [MODIFIER] <name: string> <value: string>
   *
   * @param {} docshell
   * @param {} id
   *
   * @constructor
   */
  function SieveSetAction(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);

    this.items = [];

    this.items[0] = this._createByName("whitespace", " ");
    this.items[1] = this._createByName("modifier", "");
    this.items[2] = this._createByName("string", "\"variable\"");
    this.items[3] = this._createByName("whitespace", " ");
    this.items[4] = this._createByName("string", "\"\"");
    this.items[5] = this._createByName("atom/semicolon");
  }

  SieveSetAction.prototype = Object.create(SieveAbstractElement.prototype);
  SieveSetAction.prototype.constructor = SieveSetAction;

  SieveSetAction.isElement
    = function (parser, lexer) {
      return parser.startsWith("set");
    };

  SieveSetAction.isCapable = function (capabilities) {
    return (capabilities["variables"] === true);
  };

  SieveSetAction.prototype.require
    = function (imports) {
      imports["variables"] = true;
    };

  SieveSetAction.nodeName = function () {
    return "action/setvariable";
  };

  SieveSetAction.nodeType = function () {
    return "action";
  };

  SieveSetAction.prototype.init
    = function (parser) {
      parser.extract("set");

      // ... eat the deadcode before the modifier...
      this.items[0].init(parser);

      // the optional modifier
      this.items[1].init(parser);

      // the name
      this.items[2].init(parser);

      // the separating whitespace
      this.items[3].init(parser);

      // the value
      this.items[4].init(parser);

      // semicolon
      this.items[5].init(parser);

      return this;
    };


  SieveSetAction.prototype.toScript
    = function () {
      let result = "set";

      this.items.forEach(function (element, index, array) {
        if (element)
          result += element.toScript();
      });

      return result;
    };


  SieveSetAction.prototype.modifiers
    = function () {
      return this.items[1];
    };

  SieveSetAction.prototype.name
    = function (name) {
      if (typeof (name) === "undefined")
        return this.items[2].value();

      return this.items[2].value(name);
    };

  SieveSetAction.prototype.value
    = function (value) {
      if (typeof (value) === "undefined")
        return this.items[4].value();

      return this.items[4].value(value);
    };

  /**
   *
   *    Usage:  string [MATCH-TYPE] [COMPARATOR]
             <source: string-list> <key-list: string-list>
   * @constructor
   */
  function SieveStringTest(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);

    this.items = [];

    this.items[0] = this._createByName("whitespace", " ");
    // Matchtype
    this.items[1] = this._createByName("match-type");
    this.items[2] = this._createByName("whitespace", " ");
    // Comparator
    this.items[3] = this._createByName("comparator");
    this.items[4] = this._createByName("whitespace", " ");
    // Source
    this.items[5] = this._createByName("stringlist");
    this.items[6] = this._createByName("whitespace", " ");
    // key list
    this.items[7] = this._createByName("stringlist");

  }

  SieveStringTest.prototype = Object.create(SieveAbstractElement.prototype);
  SieveStringTest.prototype.constructor = SieveStringTest;

  SieveStringTest.isElement
    = function (parser, lexer) {
      return parser.startsWith("string");
    };

  SieveStringTest.isCapable
    = function (capabilities) {
      return (capabilities["variables"] === true);
    };

  SieveStringTest.prototype.require
    = function (imports) {
      imports["variables"] = true;

      if (this.items[1])
        this.items[1].require(imports);
    };

  SieveStringTest.nodeName = function () {
    return "test/string";
  };

  SieveStringTest.nodeType = function () {
    return "test";
  };

  SieveStringTest.prototype.init
    = function (parser) {
      parser.extract("string");

      this.items[0].init(parser);

      // match-types
      if (this._probeByName("match-type", parser)) {
        this.items[1] = this._createByName("match-type", parser);
        this.items[2].init(parser);
      }

      // Comparator
      if (this._probeByName("comparator", parser)) {
        this.items[3] = this._createByName("comparator");
        this.items[4].init(parser);
      }

      // Source
      this.items[5].init(parser);
      this.items[6].init(parser);

      // Keylist
      this.items[7].init(parser);

      return this;
    };


  SieveStringTest.prototype.comparator
    = function () {
      return this.items[3];
    };

  SieveStringTest.prototype.matchType
    = function () {
      return this.items[1];
    };

  SieveStringTest.prototype.source
    = function () {
      return this.items[5];
    };

  SieveStringTest.prototype.keyList
    = function () {
      return this.items[7];
    };

  SieveStringTest.prototype.toScript
    = function () {
      let result = "string";

      result += this.items[0].toScript();

      if (!this.items[1].isOptional()) {
        result += this.items[1].toScript();
        result += this.items[2].toScript();
      }

      if (!this.items[3].isOptional()) {
        result += this.items[3].toScript();
        result += this.items[4].toScript();
      }

      result += this.items[5].toScript();
      result += this.items[6].toScript();

      result += this.items[7].toScript();

      return result;
    };


  // *******************************************************************//

  function SieveLowerModifier(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
  }

  SieveLowerModifier.prototype = Object.create(SieveAbstractElement.prototype);
  SieveLowerModifier.prototype.constructor = SieveLowerModifier;

  SieveLowerModifier.nodeName = function () {
    return "modifier/:lower";
  };

  SieveLowerModifier.nodeType = function () {
    return "modifier/";
  };

  SieveLowerModifier.isElement
    = function (parser, lexer) {

      if (parser.startsWith(":lower"))
        return true;

      return false;
    };

  SieveLowerModifier.prototype.getPrecedence
    = function () {
      return 40;
    };

  SieveLowerModifier.prototype.init
    = function (parser) {
      parser.extract(":lower");
      return this;
    };

  SieveLowerModifier.prototype.toScript
    = function () {
      return ":lower";
    };

  // *******************************************************************//

  function SieveUpperModifier(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
  }

  SieveUpperModifier.prototype = Object.create(SieveAbstractElement.prototype);
  SieveUpperModifier.prototype.constructor = SieveUpperModifier;

  SieveUpperModifier.nodeName = function () {
    return "modifier/:upper";
  };

  SieveUpperModifier.nodeType = function () {
    return "modifier/";
  };

  SieveUpperModifier.isElement
    = function (parser, lexer) {

      if (parser.startsWith(":upper"))
        return true;

      return false;
    };

  SieveUpperModifier.prototype.getPrecedence
    = function () {
      return 40;
    };

  SieveUpperModifier.prototype.init
    = function (parser) {
      parser.extract(":upper");
      return this;
    };

  SieveUpperModifier.prototype.toScript
    = function () {
      return ":upper";
    };

  // *******************************************************************//

  function SieveLowerFirstModifier(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
  }

  SieveLowerFirstModifier.prototype = Object.create(SieveAbstractElement.prototype);
  SieveLowerFirstModifier.prototype.constructor = SieveLowerFirstModifier;

  SieveLowerFirstModifier.nodeName = function () {
    return "modifier/:lowerfirst";
  };

  SieveLowerFirstModifier.nodeType = function () {
    return "modifier/";
  };

  SieveLowerFirstModifier.isElement
    = function (parser, lexer) {

      if (parser.startsWith(":lowerfirst"))
        return true;

      return false;
    };

  SieveLowerFirstModifier.prototype.getPrecedence
    = function () {
      return 30;
    };

  SieveLowerFirstModifier.prototype.init
    = function (parser) {
      parser.extract(":lowerfirst");
      return this;
    };

  SieveLowerFirstModifier.prototype.toScript
    = function () {
      return ":lowerfirst";
    };

  // *******************************************************************//

  function SieveUpperFirstModifier(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
  }

  SieveUpperFirstModifier.prototype = Object.create(SieveAbstractElement.prototype);
  SieveUpperFirstModifier.prototype.constructor = SieveUpperFirstModifier;

  SieveUpperFirstModifier.nodeName = function () {
    return "modifier/:upperfirst";
  };

  SieveUpperFirstModifier.nodeType = function () {
    return "modifier/";
  };

  SieveUpperFirstModifier.isElement
    = function (parser, lexer) {

      if (parser.startsWith(":upperfirst"))
        return true;

      return false;
    };

  SieveUpperFirstModifier.prototype.getPrecedence
    = function () {
      return 30;
    };


  SieveUpperFirstModifier.prototype.init
    = function (parser) {
      parser.extract(":upperfirst");
      return this;
    };

  SieveUpperFirstModifier.prototype.toScript
    = function () {
      return ":upperfirst";
    };

  // *******************************************************************//

  function SieveQuoteWildcardModifier(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
  }

  SieveQuoteWildcardModifier.prototype = Object.create(SieveAbstractElement.prototype);
  SieveQuoteWildcardModifier.prototype.constructor = SieveQuoteWildcardModifier;

  SieveQuoteWildcardModifier.nodeName = function () {
    return "modifier/:quotewildcard";
  };

  SieveQuoteWildcardModifier.nodeType = function () {
    return "modifier/";
  };

  SieveQuoteWildcardModifier.isElement
    = function (parser, lexer) {

      if (parser.startsWith(":quotewildcard"))
        return true;

      return false;
    };

  SieveQuoteWildcardModifier.prototype.getPrecedence
    = function () {
      return 20;
    };

  SieveQuoteWildcardModifier.prototype.init
    = function (parser) {
      parser.extract(":quotewildcard");
      return this;
    };

  SieveQuoteWildcardModifier.prototype.toScript
    = function () {
      return ":quotewildcard";
    };



  // *******************************************************************//

  function SieveLengthModifier(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
  }

  SieveLengthModifier.prototype = Object.create(SieveAbstractElement.prototype);
  SieveLengthModifier.prototype.constructor = SieveLengthModifier;

  SieveLengthModifier.nodeName = function () {
    return "modifier/:length";
  };

  SieveLengthModifier.nodeType = function () {
    return "modifier/";
  };

  SieveLengthModifier.isElement
    = function (parser, lexer) {

      if (parser.startsWith(":length"))
        return true;

      return false;
    };

  SieveLengthModifier.prototype.getPrecedence
    = function () {
      return 10;
    };

  SieveLengthModifier.prototype.init
    = function (parser) {
      parser.extract(":length");
      return this;
    };

  SieveLengthModifier.prototype.toScript
    = function () {
      return ":length";
    };

  /* *****************************************************************************/

  function SieveModifierList(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
    this.modifiers = [];
  }

  SieveModifierList.prototype = Object.create(SieveAbstractElement.prototype);
  SieveModifierList.prototype.constructor = SieveModifierList;

  SieveModifierList.isElement
    = function (parser, lexer) {
      return lexer.probeByClass(["modifier/"], parser);
    };

  SieveModifierList.nodeName = function () {
    return "modifier";
  };

  SieveModifierList.nodeType = function () {
    return "modifier";
  };

  SieveModifierList.prototype.init
    = function (parser) {
      this.modifiers = {};

      while (this._probeByClass("modifier/", parser)) {
        this.setItem(
          this._createByClass("modifier/", parser),
          this._createByName("whitespace", parser));
      }

      return this;
    };



  /**
   * Removes an item by the precedence...
   * @param {} precedence
   */
  SieveModifierList.prototype.removeItem
    = function (item) {

      // In case it's a modifier we need to get the precedence
      if (item.getPrecedence)
        item = item.getPrecedence();

      // In case no element exists we are fine
      if (!this.modifiers[item])
        return;

      // oterhwise we get rid of it.
      delete this.modifiers[item];
    };

  /**
   * Adds or replaces a modifier. In case a modifier with the same precedence
   * exists it will be overwritten otherwise it will be added
   */

  SieveModifierList.prototype.getItem
    = function (item) {
      // the getter...
      if (this.modifiers[item] && this.modifiers[item].modifier)
        return this.modifiers[item].modifier;

      return null;
    };

  SieveModifierList.prototype.setItem
    = function (item, whitespace) {
      // the setter logic
      if (typeof (item) === "string")
        item = this._createByClass("modifier/", item);

      // A modifier has to have a precedence...
      if (!item.getPrecedence)
        throw new Error("Not a valid modifier");

      let pred = item.getPrecedence();
      // Replace the existing modifier
      if (!this.modifiers[pred])
        this.modifiers[pred] = {};

      this.modifiers[pred].modifier = item;

      if (!whitespace && !this.modifiers[pred].whitespace)
        whitespace = this._createByName("whitespace", " ");

      if (whitespace)
        this.modifiers[pred].whitespace = whitespace;

    };


  SieveModifierList.prototype.toScript
    = function () {
      let result = "";

      for (let item in this.modifiers) {
        result += this.modifiers[item].modifier.toScript();
        result += this.modifiers[item].whitespace.toScript();
      }

      return result;
    };

  SieveModifierList.prototype.require
    = function (imports) {
      this.modifiers.forEach(function (element, index, array) {
        element.modifier.require(imports);
      });
    };



  if (!SieveLexer)
    throw new Error("Could not register variables extension");

  SieveLexer.register(SieveSetAction);

  SieveLexer.register(SieveStringTest);

  // The order matters here, first the longer strings then the shorter.
  // Otherwise Lower will match before lowerfirst.
  SieveLexer.register(SieveLowerFirstModifier);
  SieveLexer.register(SieveUpperFirstModifier);
  SieveLexer.register(SieveLowerModifier);
  SieveLexer.register(SieveUpperModifier);
  SieveLexer.register(SieveQuoteWildcardModifier);
  SieveLexer.register(SieveLengthModifier);

  SieveLexer.register(SieveModifierList);

})(window);
