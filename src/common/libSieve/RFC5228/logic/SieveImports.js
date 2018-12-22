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
  /* global SieveLexer */
  /* global SieveBlockBody */

  if (!SieveGrammar)
    throw new Error("Could not register default Actions");

  SieveGrammar.addAction({
    node: "import/require",
    type: "import/",
    token: "require",

    properties: [{
      id: "parameters",

      elements: [{
        id: "capabilities",

        type: "stringlist"
      }]
    }]
  });


  /**
   *
   */
  class SieveBlockImport extends SieveBlockBody {

    /**
     * @inheritdoc
     */
    static isElement(parser, lexer) {
      return lexer.probeByClass(["import/", "whitespace"], parser);
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "import";
    }

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "import";
    }

    /**
     * @inheritdoc
     */
    init(parser) {
      // The import section consists of require and deadcode statments...
      while (this._probeByClass(["import/", "whitespace"], parser))
        this.elms.push(
          this._createByClass(["import/", "whitespace"], parser));

      // check if the imports are valid
      for (let item of this.elms) {

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

      let capabilities = this.document().capabilities();

      for (let item of dependencies)
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
      let last = null;

      for (let item of this.elms) {
        if (item.nodeName() !== "import/require")
          continue;

        if (item.getElement("capabilities").contains(require))
          return this;

        last = item;
      }

      let elm = this.document().createByName("import/require");
      elm.getElement("capabilities").values(require);

      this.append(elm, last);

      return this;
    }
  }


  if (!SieveLexer)
    throw new Error("Could not register Import Elements");

  SieveLexer.register(SieveBlockImport);

})(window);
