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

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";
import { SieveAbstractParentElement } from "./../../../toolkit/logic/AbstractElements.mjs";
import {
  id, token,
  parameters, tags, items,
  value,
  tag, number, stringList, attribute
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

SieveGrammar.addTest(
  id("test/envelope", "@test", "envelope"),

  token("envelope"),
  tags(
    tag("address-part"),
    tag("match-type"),
    tag("comparator")),
  parameters(
    stringList("envelopes", "To"),
    stringList("keys", "me@example.com"))
);


// address [ADDRESS-PART] [COMPARATOR] [MATCH-TYPE]
//             <header-list: string-list> <key-list: string-list>
SieveGrammar.addTest(
  id("test/address", "@test"),

  token("address"),
  tags(
    tag("address-part"),
    tag("match-type"),
    tag("comparator")),
  parameters(
    stringList("headers", "To"),
    stringList("keys", "me@example.com"))
);

// <"exists"> <header-names: string-list>
SieveGrammar.addTest(
  id("test/exists", "@test"),

  token("exists"),
  parameters(
    stringList("headers", "From"))
);

// <"header"> [COMPARATOR] [MATCH-TYPE] <header-names: string-list> <key-list: string-list>
SieveGrammar.addTest(
  id("test/header", "@test"),

  token("header"),
  tags(
    tag("comparator"),
    tag("match-type")),
  parameters(
    stringList("headers", "Subject"),
    stringList("keys", "Example"))
);

SieveGrammar.addTest(
  id("test/boolean/true", "@test/boolean/"),
  token("true")
);

SieveGrammar.addTest(
  id("test/boolean/false", "@test/boolean/"),
  token("false")
);

SieveGrammar.addGroup(
  id("test/boolean", "@test"),
  items("@test/boolean/"),
  // Boolean tests don't have an implicit default value

  // FIXME we should wrap this into a mandatory(value("false"))
  value("false", true)
);


// size <":over" / ":under"> <limit: number>

SieveGrammar.addTag(
  id("test/size/operator/over", "@test/size/operator/"),
  token(":over")
);

SieveGrammar.addTag(
  id("test/size/operator/under", "@test/size/operator/"),
  token(":under")
);

SieveGrammar.addGroup(
  id("test/size/operator"),
  items("@test/size/operator/"),

  // Either the :over or the :under operator has to exist
  // there is no default value in case the operator is omitted.
  value(":over", true)
);

SieveGrammar.addTest(
  id("test/size", "@test"),

  token("size"),

  parameters(
    attribute("operator", "test/size/operator"),
    number("limit", "1M"))
);


const LEADING_WHITESPACE = 0;
const TEST = 1;
const TAILING_WHITESPACE = 2;


/**
 * Implements a list with tests.
 */
class SieveTestList extends SieveAbstractParentElement {

  /**
   * @inheritdoc
   */
  init(parser) {

    while (this.getChildren().length)
      this.getChildren().pop();

    parser.extractChar("(");

    while (!parser.isChar(")")) {

      if (this.getChildren().length)
        parser.extractChar(",");

      const element = [];

      element[LEADING_WHITESPACE] = this.createByName("whitespace");
      if (this.probeByName("whitespace", parser))
        element[LEADING_WHITESPACE].init(parser);

      element[TEST] = this.createByClass(["@test", "@operator"], parser);

      element[TAILING_WHITESPACE] = this.createByName("whitespace");
      if (this.probeByName("whitespace", parser))
        element[TAILING_WHITESPACE].init(parser);

      this.getChildren().push(element);
    }

    parser.extractChar(")");

    return this;
  }

  /**
   * @inheritdoc
   */
  hasChild(identifier) {
    for (const elm of this.getChildren())
      if (elm[TEST].id() === identifier)
        return true;

    return false;
  }

  /**
   * Adds a new test to the test list.
   *
   *  @param {SieveAbstractElement} elm
   *   the test which should be added.
   * @param {SieveAbstractElement} [sibling]
   *   the after which the element should be added, if omitted it will
   *   be added to the end.
   *
   * @returns {SieveTestList}
   *   a self reference
   */
  append(elm, sibling) {
    let element = [];

    switch ([].concat(elm).length) {
      case 1:
        element[LEADING_WHITESPACE] = this.createByName("whitespace", "\r\n");
        element[TEST] = elm;
        element[TAILING_WHITESPACE] = this.createByName("whitespace");
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

    let idx = this.getChildren().length;

    if (sibling) {
      if (sibling.id)
        sibling = sibling.id();

      if (sibling >= 0)
        for (idx = 0; idx < this.getChildren(); idx++)
          if (this.getChild(idx)[TEST].id() === sibling)
            break;
    }

    this.getChildren().splice(idx, 0, element);
    elm.parent(this);

    return this;
  }

  /**
   * Removes the given child element from the test list.
   *
   * @param {string} childId
   *  the child element's unique id.
   *
   * @returns {SieveAbstractElement}
   *   the removed element.
   */
  removeChild(childId) {

    if (!childId)
      throw new Error("Child ID Missing");

    // Is it a direct match?
    for (let i = 0; i < this.getChildren().length; i++) {

      const elm = this.getChild(i);
      if (elm[TEST].id() !== childId)
        continue;

      elm[TEST].parent(null);
      this.getChildren().splice(i, 1);

      return elm;
    }

    // ... we fail in case we have not found the child
    throw new Error(`Unknown child ${childId}`);
  }

  /**
   * Checks if the element is empty.
   *
   * @returns {boolean}
   *   if the element is empty otherwise false.
   */
  empty() {
    for (const elm of this.getChildren())
      if (elm[TEST].widget())
        return false;

    return true;
  }

  /**
   * @inheritdoc
   */
  require(imports) {

    for (const elm of this.getChildren())
      elm[TEST].require(imports);
  }

  /**
   * @inheritdoc
   */
  toScript() {
    let result = "(";

    for (let i = 0; i < this.getChildren().length; i++) {
      const elm = this.getChild(i);

      result = result
        + ((i > 0) ? "," : "")
        + elm[LEADING_WHITESPACE].toScript()
        + elm[TEST].toScript()
        + elm[TAILING_WHITESPACE].toScript();
    }

    result += ")";

    return result;
  }
}


SieveGrammar.addGeneric(
  id("test/testlist", "@test/"),

  SieveTestList
);

// SieveGrammar.addList(
//   id("test/testlist", "@test/"),

//   token("("),
//   parameters(
//     items("test", ["@test", "@operator"])),
//   token(")")
// );

export { SieveTestList };
