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

import {
  id, token,
  parameters, items,
  stringList
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

SieveGrammar.addAction(
  id("import/require", "@import/"),
  token("require"),
  parameters(
    stringList("capabilities"))
);

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

    return this;
  }

}

SieveGrammar.addGeneric(
  id("import", "@import"),

  SieveBlockImport,
  items("@import/", "@whitespace"));

