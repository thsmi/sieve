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

import { SieveBlockBody } from "./SieveBlocks.mjs";

import { parameters, stringListField, id, token } from "../../../toolkit/logic/SieveGrammarHelper.mjs";
import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

SieveGrammar.addAction(
  id("import/require", "@import/"),
  token("require"),
  parameters(
    stringListField("capabilities"))
);

const NOT_FOUND = -1;

/**
 *
 */
class SieveBlockImport extends SieveBlockBody {

  /**
   * @inheritdoc
   */
  init(parser) {
    // The import section consists of require and deadcode statements...
    while (this.probeByClass(["@import/", "@whitespace"], parser))
      this.elms.push(
        this.createByClass(["@import/", "@whitespace"], parser));

    // check if the imports are valid
    for (const item of this.elms) {

      if (item.nodeName() !== "import/require")
        continue;

      this.check(
        item.getElement("capabilities").values());
    }

    return this;
  }

  /**
   * Checks if the given import are supported by the sieve implementation.
   * In case an incompatible require is found an exception will be thrown.
   *
   * @param {string[]} dependencies
   *   the require strings to check as string array
   *
   *
   */
  check(dependencies) {

    const capabilities = this.document().capabilities();

    for (const item of dependencies)
      if (!capabilities.hasCapability(item))
        throw new Error('Unknown capability string "' + item + '"');
  }

  /**
   * Add a require to the require statements.
   * In the require is already present, it will be silently skipped.
   *
   * @param {string} require
   *   the require to add.
   * @returns {SieveBlockImport}
   *   a self reference.
   */
  capability(require) {

    // We should try to insert new requires directly after the last require
    // statement otherwise it looks strange. So we just keep track of the
    // last require we found.
    let last = NOT_FOUND;

    for (const [index, item] of this.elms.entries()) {
      if (item.nodeName() !== "import/require")
        continue;

      if (item.getElement("capabilities").contains(require))
        return this;

      last = index;
    }

    // We need to add an import
    const elm = this.createByName("import/require");
    elm.getElement("capabilities").values(require);

    // no other import was found means just push
    if (last === NOT_FOUND) {
      this.elms.push(elm);
      return this;
    }

    this.elms.splice(last, 0, elm);
    return this;
  }
}

SieveGrammar.addGeneric(
  id("import", "@import"),
  SieveBlockImport,
  // FIXME: use a calls matcher.
  (parser, document) => { return document.probeByClass(["@import/", "@whitespace"], parser); });

