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

import { SieveLexer } from "./../../../toolkit/SieveLexer.js";
import { SieveAbstractBlock } from "./../../../toolkit/logic/AbstractElements.js";

/**
 *
 * @param {*} docshell
 * @param {string} id
 *   the blocks unique id.
 */
function SieveBlockBody(docshell, id) {
  SieveAbstractBlock.call(this, docshell, id);
  this.elms = [];
}

SieveBlockBody.prototype = Object.create(SieveAbstractBlock.prototype);
SieveBlockBody.prototype.constructor = SieveBlockBody;

SieveBlockBody.isElement
  = function (parser, lexer) {
    return lexer.probeByClass(["action", "condition", "whitespace"], parser);
  };

SieveBlockBody.nodeName = function () {
  return "block/body";
};

SieveBlockBody.nodeType = function () {
  return "block/";
};

SieveBlockBody.prototype.init
  = function (parser) {
    while (this._probeByClass(["action", "condition", "whitespace"], parser))
      this.elms.push(
        this._createByClass(["action", "condition", "whitespace"], parser));

    return this;
  };

SieveBlockBody.prototype.toScript
  = function () {
    let str = "";

    for (const key in this.elms)
      str += this.elms[key].toScript();

    return str;
  };

// ****************************************************************************//


/**
 *
 * @param {*} docshell
 * @param {string} id
 *   the blocks unique id.
 */
function SieveBlock(docshell, id) {
  SieveBlockBody.call(this, docshell, id);
}

SieveBlock.prototype = Object.create(SieveBlockBody.prototype);
SieveBlock.prototype.constructor = SieveBlock;

// eslint-disable-next-line no-unused-vars
SieveBlock.isElement = function (parser, lexer) {
  return parser.isChar("{");
};

SieveBlock.nodeName = function () {
  return "block/block";
};

SieveBlock.nodeType = function () {
  return "block/";
};

SieveBlock.prototype.init
  = function (parser) {
    parser.extractChar("{");

    SieveBlockBody.prototype.init.call(this, parser);

    parser.extractChar("}");

    return this;
  };

SieveBlock.prototype.toScript
  = function () {
    return "{" + SieveBlockBody.prototype.toScript.call(this) + "}";
  };

const ROOT_ELEMENT_IMPORT = 0;
const ROOT_ELEMENT_BODY = 1;

const UNKNOWN_ID = -1;

/**
 *
 */
class SieveRootNode extends SieveBlockBody {

  /**
   *
   * @param {*} docshell
   */
  constructor(docshell) {

    super(docshell, UNKNOWN_ID);

    this.elms[ROOT_ELEMENT_IMPORT] = this._createByName("import");
    this.elms[ROOT_ELEMENT_BODY] = this._createByName("block/body");
  }

  /**
   * @inheritdoc
   */
  // eslint-disable-next-line no-unused-vars
  static isElement(token, doc) {
    return false;
  }

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "block/rootnode";
  }

  /**
   * @inheritdoc
   */
  static nodeType() {
    return "block/";
  }


  /**
   * @inheritdoc
   */
  init(parser) {
    // requires are only valid if they are
    // before any other sieve command!
    if (this._probeByName("import", parser))
      this.elms[ROOT_ELEMENT_IMPORT].init(parser);

    // After the import section only deadcode and actions are valid
    if (this._probeByName("block/body", parser))
      this.elms[ROOT_ELEMENT_BODY].init(parser);

    return this;
  }

  /**
   * @inheritdoc
   */
  toScript() {

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

SieveLexer.register(SieveBlockBody);
SieveLexer.register(SieveBlock);
SieveLexer.register(SieveRootNode);

export {
  SieveBlockBody,
  SieveBlock
};
