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
  /* global SieveGrammar */

  if (!SieveGrammar)
    throw new Error("Could not register Relational");

  /* global SieveAbstractElement */
  /* global SieveLexer */

  /*   MATCH-TYPE =/ COUNT / VALUE

    relational-match = DQUOTE
            ("gt" / "ge" / "lt" / "le" / "eq" / "ne") DQUOTE
            ; "gt" means "greater than", the C operator ">".
            ; "ge" means "greater than or equal", the C operator ">=".
            ; "lt" means "less than", the C operator "<".
            ; "le" means "less than or equal", the C operator "<=".
            ; "eq" means "equal to", the C operator "==".
            ; "ne" means "not equal to", the C operator "!=".
   */

  function SieveRelationalMatch(docshell, id) {

    SieveAbstractElement.call(this, docshell, id);
    this.operator = '"eq"';
  }

  SieveRelationalMatch.prototype = Object.create(SieveAbstractElement.prototype);
  SieveRelationalMatch.prototype.constructor = SieveRelationalMatch;

  SieveRelationalMatch.isElement
    = function (parser) {
      return parser.startsWith(['"gt"', '"ge"', '"lt"', '"le"', '"eq"', '"ne"']);
    };

  SieveRelationalMatch.nodeName = function () {
    return "relational-match";
  };

  SieveRelationalMatch.nodeType = function () {
    return "relational-match";
  };

  SieveRelationalMatch.prototype.require
    = function (imports) {
      imports["relational"] = true;
    };

  SieveRelationalMatch.prototype.init
    = function (parser) {

      if (!parser.startsWith(['"gt"', '"ge"', '"lt"', '"le"', '"eq"', '"ne"']))
        throw new Error("Relational operator expected");

      this.operator = parser.bytes(4);

      parser.extract(4);

      return this;
    };

  SieveRelationalMatch.prototype.toScript
    = function () {
      return "" + this.operator;
    };

  if (!SieveLexer)
    throw new Error("Could not register Relational Elements");

  SieveLexer.register(SieveRelationalMatch);


  // /////////////////

  /* VALUE = ":value" relational-match */

  /**
   * The value match type does a relational comparison between strings
   */

  let value = {
    node: "match-type/value",
    type: "match-type/",

    token: ":value",

    requires: "relational",

    properties: [{
      id: "parameters",

      elements: [{
        id: "relational-match",
        type: "relational-match",

        value: '"eq"'
      }]
    }]

  };

  SieveGrammar.addTag(value);

  /**
   * The count match type determins the number of the specified entities in the
   * message and then does a relational comparison of numbers of entities
   *
   * Count should only be used with a numeric comparator.
   */

  let count = {
    node: "match-type/count",
    type: "match-type/",

    token: ":count",

    requires: "relational",

    properties: [{
      id: "parameters",

      elements: [{
        id: "relational-match",
        type: "relational-match",

        value: '"eq"'
      }]
    }]
  };

  SieveGrammar.addTag(count);

})(window);
