/*
 * The content of this file is licensed. You may obtain a copy of
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

(function (exports) {

  "use strict";

  /* global SieveGrammar */

  if (!SieveGrammar)
    throw new Error("Could not register Tests");

  let envelope = {

    node: "test/envelope",
    type: "test",

    requires: "envelope",

    token: "envelope",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "address-part",
        type: "address-part"
      }, {
        id: "match-type",
        type: "match-type"
      }, {
        id: "comparator",
        type: "comparator"
      }]
    }, {
      id: "parameters",

      elements: [{
        id: "envelopes",
        type: "stringlist",
        value: '"To"'
      }, {
        id: "keys",
        type: "stringlist",
        value: '"me@example.com"'

      }]
    }]
  };

  SieveGrammar.addTest(envelope);


  // address [ADDRESS-PART] [COMPARATOR] [MATCH-TYPE]
  //             <header-list: string-list> <key-list: string-list>
  let _address = {
    node: "test/address",
    type: "test",

    token: "address",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "address-part",
        type: "address-part"
      }, {
        id: "comparator",
        type: "comparator"
      }, {
        id: "match-type",
        type: "match-type"

      }]
    }, {
      id: "parameters",

      elements: [{
        id: "headers",
        type: "stringlist",
        value: '"To"'
      }, {
        id: "keys",
        type: "stringlist",
        value: '"me@example.com"'

      }]
    }]
  };

  SieveGrammar.addTest(_address);

  // <"exists"> <header-names: string-list>
  let _exists = {
    node: "test/exists",
    type: "test",

    token: "exists",

    properties: [{
      id: "parameters",

      elements: [{
        id: "headers",
        type: "stringlist",
        value: '"From"'
      }]
    }]
  };

  SieveGrammar.addTest(_exists);

  // <"header"> [COMPARATOR] [MATCH-TYPE] <header-names: string-list> <key-list: string-list>
  let _header = {
    node: "test/header",
    type: "test",

    token: "header",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "comparator",
        type: "comparator"
      }, {
        id: "match-type",
        type: "match-type"
      }]
    }, {
      id: "parameters",

      elements: [{
        id: "headers",
        type: "stringlist",
        value: '"Subject"'
      }, {
        id: "keys",
        type: "stringlist",
        value: '"Example"'
      }]
    }]
  };

  SieveGrammar.addTest(_header);


  /* global SieveLexer */
  /* global SieveAbstractElement */

  /**
   *
   * @param {*} docshell
   * @param {*} id
   *
   * @constructor
   */
  function SieveBoolean(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);

    // first line with deadcode
    this.whiteSpace = this._createByName("whitespace");

    this.value = false;
  }

  SieveBoolean.prototype = Object.create(SieveAbstractElement.prototype);
  SieveBoolean.prototype.constructor = SieveBoolean;

  SieveBoolean.isElement
    = function (parser, lexer) {
      if (parser.startsWith("true"))
        return true;
      if (parser.startsWith("false"))
        return true;

      return false;
    };

  SieveBoolean.nodeName = function () {
    return "test/boolean";
  };

  SieveBoolean.nodeType = function () {
    return "test";
  };

  SieveBoolean.prototype.init
    = function (parser) {

      if (parser.startsWith("true")) {
        parser.extract("true");
        this.value = true;
      }

      if (parser.startsWith("false")) {
        parser.extract("false");
        this.value = false;
      }

      this.whiteSpace.init(parser);

      return this;
    };


  SieveBoolean.prototype.toScript
    = function () {
      if (this.value)
        return "true" + this.whiteSpace.toScript();

      return "false" + this.whiteSpace.toScript();
    };


  /* *****************************************************************************/
  function SieveSize(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);

    this.whiteSpace = [];
    this.whiteSpace[0] = this._createByName("whitespace", " ");
    this.whiteSpace[1] = this._createByName("whitespace", " ");
    this.whiteSpace[2] = this._createByName("whitespace", " ");

    this.over = false;
    this.size = this._createByName("number");
  }

  SieveSize.prototype = Object.create(SieveAbstractElement.prototype);
  SieveSize.prototype.constructor = SieveSize;

  SieveSize.isElement
    = function (parser, lexer) {
      return parser.startsWith("size");
    };

  SieveSize.nodeName = function () {
    return "test/size";
  };

  SieveSize.nodeType = function () {
    return "test";
  };

  SieveSize.prototype.init
    = function (parser) {
      // Syntax :
      // <"size"> <":over" / ":under"> <limit: number>

      parser.extract("size");

      this.whiteSpace[0].init(parser);

      if (parser.startsWith(":over")) {
        parser.extract(":over");
        this.isOver(true);
      }
      else if (parser.startsWith(":under")) {
        parser.extract(":under");
        this.isOver(false);
      }
      else
        throw new Error("Syntaxerror, :under or :over expected");

      this.whiteSpace[1].init(parser);
      this.size.init(parser);
      this.whiteSpace[2].init(parser);

      return this;
    };

  /**
   * Gets and Sets the over operator
   * @param  {boolean} [value]
   * @return {SieveSize}
   */
  SieveSize.prototype.isOver
    = function (value) {
      if (typeof (value) === "undefined")
        return this.over;

      if (typeof (value) === "string")
        value = (("" + value).toLowerCase() === "true") ? true : false;

      this.over = value;

      return this;
    };

  SieveSize.prototype.getSize
    = function () {
      return this.size;
    };

  SieveSize.prototype.toScript
    = function () {
      return "size"
        + this.whiteSpace[0].toScript()
        + ((this.isOver()) ? ":over" : ":under")
        + this.whiteSpace[1].toScript()
        + this.getSize().toScript()
        + this.whiteSpace[2].toScript();
    };


  // TODO Stringlist and testslist are quite simmilar
  function SieveTestList(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
    this.tests = [];
  }

  SieveTestList.prototype = Object.create(SieveAbstractElement.prototype);
  SieveTestList.prototype.constructor = SieveTestList;

  SieveTestList.isElement
    = function (parser, lexer) {
      return parser.isChar("(");
    };

  SieveTestList.nodeName = function () {
    return "test/testlist";
  };

  SieveTestList.nodeType = function () {
    return "test/";
  };

  SieveTestList.prototype.init
    = function (parser) {
      this.tests = [];

      parser.extractChar("(");

      while (!parser.isChar(")")) {
        if (this.tests.length > 0)
          parser.extractChar(",");

        let element = [];

        element[0] = this._createByName("whitespace");
        if (this._probeByName("whitespace", parser))
          element[0].init(parser);

        element[1] = this._createByClass(["test", "operator"], parser);

        element[2] = this._createByName("whitespace");
        if (this._probeByName("whitespace", parser))
          element[2].init(parser);

        this.tests.push(element);
      }

      parser.extractChar(")");

      return this;
    };

  SieveTestList.prototype.append
    = function (elm, sibling) {
      let element = [];

      switch ([].concat(elm).length) {
        case 1:
          element[0] = this._createByName("whitespace", "\r\n");
          element[1] = elm;
          element[2] = this._createByName("whitespace");
          break;

        case 3:
          element = elm;
          break;

        default:
          throw new Error("Can not append element to list");
      }

      // we have to do this first as there is a good chance the the index
      // might change after deleting...
      if (elm.parent())
        elm.remove();

      let idx = this.tests.length;

      if (sibling && (sibling.id() >= 0))
        for (idx = 0; idx < this.tests.length; idx++)
          if (this.tests[idx][1].id() === sibling.id())
            break;

      this.tests.splice(idx, 0, element);
      elm.parent(this);

      return this;
    };

  SieveTestList.prototype.empty
    = function () {
      // The direct descendants of our root node are always considered as
      // not empty. Otherwise cascaded remove would wipe them away.
      if (this.document().root() === this.parent())
        return false;

      for (let i = 0; i < this.tests.length; i++)
        if (this.tests[i][1].widget())
          return false;

      return true;
    };

  SieveTestList.prototype.removeChild
    = function (childId, cascade, stop) {
      // should we remove the whole node
      if (typeof (childId) === "undefined")
        throw new Error("Child ID Missing");
      // return SieveAbstractElement.prototype.remove.call(this);

      // ... or just a child item
      let elm = null;
      // Is it a direct match?
      for (let i = 0; i < this.tests.length; i++) {
        if (this.tests[i][1].id() !== childId)
          continue;

        elm = this.tests[i][1];
        elm.parent(null);

        this.tests.splice(i, 1);

        break;
      }

      if (cascade && this.empty())
        if ((!stop) || (stop.id() !== this.id()))
          return this.remove(cascade, stop);

      if (cascade)
        return this;

      return elm;
    };


  SieveTestList.prototype.toScript
    = function () {
      let result = "(";

      for (let i = 0; i < this.tests.length; i++) {
        result = result
          + ((i > 0) ? "," : "")
          + this.tests[i][0].toScript()
          + this.tests[i][1].toScript()
          + this.tests[i][2].toScript();
      }

      result += ")";

      return result;
    };

  SieveTestList.prototype.require
    = function (imports) {
      for (let i = 0; i < this.tests.length; i++)
        this.tests[i][1].require(imports);
    };


  if (!SieveLexer)
    throw new Error("Could not register Conditional Elements");

  SieveLexer.register(SieveBoolean);
  SieveLexer.register(SieveSize);

  SieveLexer.register(SieveTestList);
  exports.SieveTestList = SieveTestList;

})(window);
