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

import { SieveAbstractElement } from "./../../../toolkit/logic/AbstractElements.mjs";

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";
import { id } from "./../../../toolkit/logic/SieveGrammarHelper.mjs";

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
class SieveBlockBody extends SieveAbstractElement {

  /**
   * @inheritdoc
   */
  constructor(docshell) {
    super(docshell);
    this.elms = [];
  }

  /**
   * @inheritdoc
   */
  init(parser) {

    while (this.probeByClass(["@action", "@condition", "@whitespace"], parser))
      this.elms.push(
        this.createByClass(["@action", "@condition", "@whitespace"], parser));

    return this;
  }

  /**
   * @inheritdoc
   */
  toScript() {
    let str = "";

    for (const elm of this.elms)
      str += elm.toScript();

    return str;
  }

  /**
   * Returns the blocks child elements.
   *
   * @param {int|string} [idx]
   *   optional index of a child element, either as number or
   *   ":last" to address the last element.
   *
   * @returns {SieveElement|SieveElement[]}
   *   all children the selected child element if specified.
   */
  children(idx) {
    if (typeof (idx) === "undefined")
      return this.elms;

    if ((typeof (idx) === "string") && (idx.toLowerCase() === ":last"))
      idx = this.elms.length - 1;

    return this.elms[idx];
  }

  /**
   * Appends an Element to this Element.
   * If the element is already existent,it will be moved.
   *
   * @param {SieveElement} elm
   *   the element that should be appended
   * @param {SieveElement} [sibling]
   *   defines the sibling after which the new element should be inserted.
   *   In case no matching sibling is found, it will be appended at the end.
   * @returns {SieveAbstractBlock}
   *   a self reference
   */
  append(elm, sibling) {
    // we have to do this fist as there is a good chance the the index
    // might change after deleting...
    if (elm.parent())
      elm.remove();

    let idx = this.elms.length;

    if (sibling && (sibling.id() >= 0))
      for (idx = 0; idx < this.elms.length; idx++)
        if (this.elms[idx].id() === sibling.id())
          break;

    this.elms.splice(idx, 0, elm);
    elm.parent(this);

    return this;
  }

  /**
   * Checks if the block has a child with the given identifier
   *
   * @param {string} identifier
   *   the childs unique id
   * @returns {boolean}
   *   true in case the child is known otherwise false.
   */
  hasChild(identifier) {
    for (const elm of this.elms)
      if (elm.id() === identifier)
        return true;

    return false;
  }


  // TODO Merge with "remove" when its working as it should

  /**
   * Removes the node including all child elements.
   *
   * To remove just a child node pass it's id as an argument
   *
   * @param {int} childId
   *  the child id which should be removed.
   * @param {boolean} [cascade]
   * @param {} [stop]
   *
   * @returns {SieveAbstractElement}
   */
  removeChild(childId, cascade, stop) {

    if (typeof (childId) === "undefined")
      throw new Error("Child ID Missing");

    // Let's search and remove the child...
    let elm = null;
    for (let i = 0; i < this.elms.length; i++) {
      if (this.elms[i].id() !== childId)
        continue;

      elm = this.elms[i];
      elm.parent(null);
      this.elms.splice(i, 1);

      break;
    }

    // ... we fail in case we have not found the child
    if (elm === null)
      throw new Error(`Unknown child ${childId}`);

    if (cascade && this.empty())
      if ((!stop) || (stop.id() !== this.id()))
        return this.remove(cascade, stop);

    if (cascade)
      return this;

    return elm;
  }

  /**
   * Checks if the block is empty
   *
   * @returns {boolean}
   *   true in case the block is empty otherwise false.
   */
  empty() {
    // The direct descendants of our root node are always considered as
    // not empty. Otherwise cascaded remove would wipe them away.
    if (this.document().root() === this.parent())
      return false;

    for (let i = 0; i < this.elms.length; i++)
      if (this.elms[i].widget())
        return false;

    return true;
  }

  /**
   * @inheritdoc
   */
  require(imports) {

    for (const elm of this.elms) {
      if (!elm.require)
        continue;

      elm.require(imports);
    }
  }
}


// ****************************************************************************//


/**
 * Implements a sieve block starting with "{" and closing with "}"
 */
class SieveBlock extends SieveBlockBody {

  /**
   * @inheritdoc
   */
  init(parser) {
    parser.extractChar("{");

    super.init(parser);

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


const ROOT_ELEMENT_IMPORT = 0;
const ROOT_ELEMENT_BODY = 1;

/**
 * Implements the documents root node which consists of the import section
 * followed by the root block.
 */
class SieveRootNode extends SieveBlockBody {

  /**
   * @inheritdoc
   */
  constructor(docshell) {

    super(docshell);

    this.elms[ROOT_ELEMENT_IMPORT] = this.createByName("import");
    this.elms[ROOT_ELEMENT_BODY] = this.createByName("block/body");
  }

  /**
   * @inheritdoc
   */
  init(parser) {
    // requires are only valid if they are
    // before any other sieve command!
    if (this.probeByName("import", parser))
      this.elms[ROOT_ELEMENT_IMPORT].init(parser);

    // After the import section only deadcode and actions are valid
    if (this.probeByName("block/body", parser))
      this.elms[ROOT_ELEMENT_BODY].init(parser);

    return this;
  }

  /**
   * @inheritdoc
   */
  toScript() {

    // TODO move this logic to the document's to script
    //
    // hava a block with:
    //  id "imports" which consists only of requires, whitespace and comments.
    //  id "body" which consits of actions, whitespaces and conditions.

    const capabilities = this.document().capabilities();

    capabilities.clear();

    // Step 1: collect requires
    this.elms[ROOT_ELEMENT_BODY].require(capabilities);

    // Step 2: Add require...
    for (const item of capabilities.dependencies)
      this.elms[ROOT_ELEMENT_IMPORT].capability(item);

    // TODO Remove unused requires...

    return super.toScript();
  }
}


SieveGrammar.addGeneric(
  id("block/body", "@block/"),

  SieveBlockBody,
  // FIXME: use a class matcher
  (parser, document) => { return document.probeByClass(["@action", "@condition", "@whitespace"], parser); });

SieveGrammar.addGeneric(
  id("block/block", "@block/"),

  SieveBlock,
  // FIXME: use a token matcher
  (parser) => { return parser.isChar("{"); }
  // token("{")
  // any(["action", "condition", "whitespace"])
);

SieveGrammar.addGeneric(
  id("block/rootnode", "@block/"),
  SieveRootNode,
  () => { return false; }
  //  optional(property("import", "import")),
  //  property("body", "block/body"))
);



export {
  SieveBlockBody,
  SieveBlock
};
