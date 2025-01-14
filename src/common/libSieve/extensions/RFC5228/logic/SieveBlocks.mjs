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

import { SieveAbstractParentElement, SieveAbstractElement } from "./../../../toolkit/logic/AbstractElements.mjs";

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";
import { token, items, id, parameters, attribute, optional } from "./../../../toolkit/logic/SieveGrammarHelper.mjs";

/*
// TODO convert into a group or a list because blocks, testlists and stringlist
// are technically the same.

addList

import { group } from "../../../toolkit/logic/SieveGrammarHelper.mjs";
addGroup(
  id("block/body, block/"),

  group("action", "condition", "whitespace"),
)*/

//* ***************************************************************************//


/**
 *
 * @param {SieveDocument} docshell
 *   the document which owns the block.
 * @param {string} id
 *   the blocks unique id.
 */
class SieveBlockBody extends SieveAbstractParentElement {

  /**
   * @inheritdoc
   */
  init(parser) {

    while (this.probeByClass(["@action", "@condition", "@whitespace"], parser))
      this.getChildren().push(
        this.createByClass(["@action", "@condition", "@whitespace"], parser));

    return this;
  }
}


/**
 * Implements a sieve block starting with "{" and closing with "}"
 */
class SieveBlock extends SieveAbstractParentElement {

  /**
   * @inheritdoc
   */
  init(parser) {
    parser.extractChar("{");

    while (this.probeByClass(["@action", "@condition", "@whitespace"], parser))
      this.getChildren().push(
        this.createByClass(["@action", "@condition", "@whitespace"], parser));

    parser.extractChar("}");

    return this;
  }

  /**
   * @inheritdoc
   */
  toScript() {
    return "{" + super.toScript() + "}";
  }
}

/*
SieveGrammar.addBlock(
  id("block/body", "@block/"),
  items("@action", "@condition", "@whitespace")
);

SieveGrammar.addBlock(
  id("block/block", "@block/"),
  token("{"),
  items(["action", "condition", "whitespace"]),
  token("}")
);
*/

SieveGrammar.addGeneric(
  id("block/body", "@block/"),

  SieveBlockBody,
  items("@action", "@condition", "@whitespace"));

SieveGrammar.addGeneric(
  id("block/block", "@block/"),

  SieveBlock,
  token("{")
  // token("{")
  // items(["action", "condition", "whitespace"])
  // token("}")
);

// SieveGrammar.addList(
//   id("block/block", "@block/"),
//   token("{"),
//   items("elements", ["action", "condition", "whitespace"]),
//   token("}")
// );

SieveGrammar.addStructure(
  id("block/rootnode", "@block/"),
  { "matcher" : () => { return false; } },
  parameters(
    attribute("imports", "import"),
    attribute("body", "block/body"))
);

export {
  SieveBlockBody,
  SieveBlock
};
