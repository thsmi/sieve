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

(function (exports) {

  "use strict";

  const LEADING_WHITESPACE = 0;
  const TEST = 1;
  const TAILING_WHITESPACE = 2;

  /* global SieveGrammar */

  /* global SieveLexer */
  /* global SieveAbstractElement */

  if (!SieveGrammar)
    throw new Error("Could not register Tests");

  SieveGrammar.addTest({

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
  });


  // address [ADDRESS-PART] [COMPARATOR] [MATCH-TYPE]
  //             <header-list: string-list> <key-list: string-list>
  SieveGrammar.addTest({
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
  });

  // <"exists"> <header-names: string-list>
  SieveGrammar.addTest({
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
  });

  // <"header"> [COMPARATOR] [MATCH-TYPE] <header-names: string-list> <key-list: string-list>
  SieveGrammar.addTest({
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
  });

  SieveGrammar.addTest({
    node: "test/boolean/true",
    type: "test/boolean/",

    token: "true"
  });


  SieveGrammar.addTest({
    node: "test/boolean/false",
    type: "test/boolean/",

    token: "false"
  });

  SieveGrammar.addGroup({
    node: "test/boolean",
    type: "test",

    // Boolean tests don't have an implicit default value
    value: "false",
    mandatory: true,

    items: ["test/boolean/"]
  });


  // size <":over" / ":under"> <limit: number>

  SieveGrammar.addTag({
    node: "test/size/operator/over",
    type: "test/size/operator/",

    token: ":over"
  });

  SieveGrammar.addTag({
    node: "test/size/operator/under",
    type: "test/size/operator/",

    token: ":under"
  });

  SieveGrammar.addGroup({
    node: "test/size/operator",
    type: "test/size/operator",

    // Either the :over or the :under operator has to exist
    // there is no default value in case the operator is omitted.
    value: ":over",
    mandatory: true,

    items: ["test/size/operator/"]
  });

  SieveGrammar.addTest({
    node: "test/size",
    type: "test",

    token: "size",

    properties: [{
      id: "parameters",

      elements: [{
        id: "operator",
        type: "test/size/operator"
      }, {
        id: "limit",
        type: "number"
      }]
    }]
  });

  // TODO Stringlist and testslist are quite similar

  /**
   *
   * @param {*} docshell
   * @param {*} id
   */
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

        const element = [];

        element[LEADING_WHITESPACE] = this._createByName("whitespace");
        if (this._probeByName("whitespace", parser))
          element[LEADING_WHITESPACE].init(parser);

        element[TEST] = this._createByClass(["test", "operator"], parser);

        element[TAILING_WHITESPACE] = this._createByName("whitespace");
        if (this._probeByName("whitespace", parser))
          element[TAILING_WHITESPACE].init(parser);

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
          element[LEADING_WHITESPACE] = this._createByName("whitespace", "\r\n");
          element[TEST] = elm;
          element[TAILING_WHITESPACE] = this._createByName("whitespace");
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
          if (this.tests[idx][TEST].id() === sibling.id())
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
        if (this.tests[i][TEST].widget())
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
        if (this.tests[i][TEST].id() !== childId)
          continue;

        elm = this.tests[i][TEST];
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
          + this.tests[i][LEADING_WHITESPACE].toScript()
          + this.tests[i][TEST].toScript()
          + this.tests[i][TAILING_WHITESPACE].toScript();
      }

      result += ")";

      return result;
    };

  SieveTestList.prototype.require
    = function (imports) {
      for (let i = 0; i < this.tests.length; i++)
        this.tests[i][TEST].require(imports);
    };


  if (!SieveLexer)
    throw new Error("Could not register Conditional Elements");

  SieveLexer.register(SieveTestList);

  exports.SieveTestList = SieveTestList;

})(window);
