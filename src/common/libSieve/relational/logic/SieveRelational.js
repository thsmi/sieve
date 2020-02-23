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
  /* global SieveGrammar */

  if (!SieveGrammar)
    throw new Error("Could not register Relational");

  /*
    relational-match = DQUOTE
            ("gt" / "ge" / "lt" / "le" / "eq" / "ne") DQUOTE
            ; "gt" means "greater than", the C operator ">".
            ; "ge" means "greater than or equal", the C operator ">=".
            ; "lt" means "less than", the C operator "<".
            ; "le" means "less than or equal", the C operator "<=".
            ; "eq" means "equal to", the C operator "==".
            ; "ne" means "not equal to", the C operator "!=".
   */

  SieveGrammar.addTag({
    node: "relational-match/gt",
    type: "relational-match/",

    token: '"gt"'
  });

  SieveGrammar.addTag({
    node: "relational-match/ge",
    type: "relational-match/",

    token: '"ge"'
  });

  SieveGrammar.addTag({
    node: "relational-match/lt",
    type: "relational-match/",

    token: '"lt"'
  });

  SieveGrammar.addTag({
    node: "relational-match/le",
    type: "relational-match/",

    token: '"le"'
  });

  SieveGrammar.addTag({
    node: "relational-match/eq",
    type: "relational-match/",

    token: '"eq"'
  });

  SieveGrammar.addTag({
    node: "relational-match/ne",
    type: "relational-match/",

    token: '"ne"'
  });

  SieveGrammar.addGroup({
    node: "relational-match",
    type: "relational-match",

    value: '"eq"',

    items: ["relational-match/"]
  });

  /**
   * The value match type does a relational comparison between strings
   *
   *  VALUE = ":value" relational-match
   */
  SieveGrammar.addTag({
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
  });

  /**
   * The count match type determines the number of the specified entities in the
   * message and then does a relational comparison of numbers of entities
   *
   * Count should only be used with a numeric comparator.
   */
  SieveGrammar.addTag({
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
  });

})(window);
