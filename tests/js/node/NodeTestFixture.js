(function (exports) {

  "use strict";

  const { existsSync } = require('fs');
  const { readFile } = require('fs').promises;
  const path = require("path");

  const { AbstractTestFixture} = require("./../common/AbstractTestFixture.js");

  /**
   * Adapts the test fixture to a node based runtime environment.
   */
  class NodeTestFixture extends AbstractTestFixture {

    /**
     * @inheritdoc
     */
    getUserAgent() {
      return "Node";
    }

    /**
     * @inheritdoc
     */
    async _run() {

      const scripts = [
        "./tests/js/node/NodeTestCase.js",
        ...this.test.require,
        this.test.script
      ];

      const vm = require('vm');

      const context = {};
      vm.createContext(context);

      for (let script of scripts) {
        // FixMe remove the path voodoo...
        if (script.startsWith("./../common/"))
          script = path.join("./src/common/", script);

        if (script.startsWith("./validators/"))
          script = path.join("./tests/tests/", script);

        if (script.startsWith("./sieve/"))
          script = path.join("./tests/tests/", script);

        if (!existsSync(script))
          throw new Error(`No such file ${path.resolve(script)}`);

        try {
          this.getReport().addTrace("Loading Script " + path.resolve(script));
          (new vm.Script(await readFile(script), { filename: path.resolve(script) }))
            .runInContext(context);
        } catch (ex) {
          this.getReport().addError(ex);
          throw ex;
        }
      }

      // Inject the report logger...
      context.net.tschmid.yautt.test.log = (message, level) => {

        if (typeof (level) !== "string")
          level = "Info";

        if (level === "Trace") {
          this.getReport().addTrace(message);
          return;
        }

        this.getReport().addInfo(message);
      };


      try {
        await context.net.tschmid.yautt.test.run();
        this.getReport().addSuccess();
      } catch (ex) {
        this.getReport().addError(ex);
      }
    }
  }


  exports.NodeTestFixture = NodeTestFixture;

})(this);
