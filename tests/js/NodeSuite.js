// Create the namespace...

// Our server is implemented within an anonymous method...

(function (exports) {

  "use strict";

  const {existsSync} = require('fs');
  const { readFile } = require('fs').promises;
  const path = require("path");

  const { AbstractTestSuite } = require("./AbstractTestSuite.js");

  class NodeTestSuite {

    /**
     * Turns tracing on or off
     */
    trace() {
    }

    async run(tests) {
      const queue = [];
      this.tests = tests;

      for (const [name, value] of this.tests.entries()) {

        if (typeof (value) === "undefined")
          continue;

        if (value.disabled)
          continue;

        if (!value.script)
          continue;

        queue.push(name);
      }

      while (queue.length) {
        await this.runTest(queue.shift());
      }
    }

    startLog(test) {
      console.log("\x1b[34mStarting Test");
    }

    logTrace(message) {
      this.log(message, "Trace");
    };

    logError(message) {
      this.log(message, "Error");
    };

    log(message, style) {
      console.log(`${style} ${message}`);
    }

    extend(name) {

      const base = this.tests.get(name);

      if (!base)
        return [];

      let scripts = [];
      if (base.extend)
        scripts = this.extend(base.extend);

      if (!base.require)
        return scripts;

      for (const item of base.require) {
        scripts.push(item);
      }

      return scripts;
    }

    /**
     * Checks it this test can be run in the given environment.
     * Browser implementations are similar but not identical.
     * Especially node diverges a lot from browsers.
     *
     * @param {string} name
     *   the unique test name
     *
     * @returns {boolean}
     *   the in case this test is compatible whit this runtime otherwise false.
     */
    isCompatible(name) {

      const base = this.tests.get(name);

      if (!base.agents)
        return true;

      let agents = base.agents;

      if (!Array.isArray(agents))
        agents = [agents];

      const userAgent = "Node";
      for (const agent of agents) {
        this.logTrace("Checking if environment is compatible with " + agent + " ...");
        if (userAgent.indexOf(agent) > -1) {
          this.logTrace("... Yes");
          return true;
        }

        this.logTrace("... No");
      }

      this.logTrace(" ... no compatible environment found.");
      return false;
    }

    async runTest(name) {

      this.startLog(name);
      this.log("Test profile '" + name + "'", "Header");

      if (!this.isCompatible(name)) {
        this.log("Skipping test " + name + " is incompatible with browser...");
        return;
      }

      const scripts = [
        "./tests/js/NodeUnit.js",
        ... this.extend(name),
        this.tests.get(name).script
      ];

      const vm = require('vm');

      const context = {};
      vm.createContext(context);

      for (let script of scripts) {
        // FixMe remove the path vodoo...
        if (script.startsWith("./../common/"))
          script = path.join("./src/common/", script);

        if (script.startsWith("./validators/"))
          script = path.join("./tests/tests/", script);

        if (script.startsWith("./sieve/"))
          script = path.join("./tests/tests/", script);

        if (!existsSync(script))
          throw new Error(`No such file ${path.resolve(script)}`);

        try {
          console.log("Loading Script "+path.resolve(script));
          (new vm.Script(await readFile(script), { filename: path.resolve(script) }))
            .runInContext(context);
        } catch (ex) {
          console.log(ex);
          console.log(ex.stack);

          throw ex;
        }
      }

      context.net.tschmid.yautt.test.run();
    }
  }

  exports.TestSuite = NodeTestSuite;

})(module.exports || this);
