(function (exports) {

  "use strict";

  const { AbstractTestSuite, AbstractTestFixture, TestCase } = require("./../common/AbstractTestSuite.js");

  const { existsSync } = require('fs');
  const { readFile } = require('fs').promises;
  const path = require("path");
  const vm = require('vm');


  /**
   * Implements a sandbox to run the unit tests.
   * It uses a separate node context.
   */
  class Sandbox {

    /**
     * Runs the given command inside the report context.
     * So that all log messages end up here.
     *
     * @param {AbstractTestReport} report
     *   a reference to a report
     * @param {Function} callback
     *   the method to be executed
     *
     * @returns {*}
     *   the callbacks return value.
     */
    async runInLoggerContext(report, callback) {
      // Inject the report logger...
      this.context.net.tschmid.yautt.logger = {
        log: (message, level) => { report.log(message, level); }
      };

      let rv;
      try {
        rv = await callback();
      } finally {
        // Replace it with a dummy logger.
        this.context.net.tschmid.yautt.logger = {
          log: () => { }
        };
      }

      return rv;
    }

    /**
     * Initializes the sandbox.
     *
     * @param {AbstractTestReport} report
     *   the report which should be used for logging
     * @param {string[]} scripts
     *   the scripts to be loaded into the sandbox
     */
    async init(report, scripts) {

      const context = { "net": { "tschmid": { "yautt": { "test": {} } } } };

      vm.createContext(context);

      this.context = context;

      await this.runInLoggerContext(report, async () => {
        for (const script of scripts)
          await this.require(script, report);
      });
    }

    /**
     * Loads java script files into the sandbox context.
     * @param {string} script
     *   the script to be loaded.
     * @param {AbstractTestReport} report
     *   a reference  to the an report.
     */
    async require(script, report) {

      if (!this.context)
        throw new Error("Sandbox not initialized");

      // FixMe remove the path voodoo...
      if (script.startsWith("./../common/"))
        script = path.join("./src/common/", script);

      if (script.startsWith("./validators/"))
        script = path.join("./tests/tests/", script);

      if (script.startsWith("./sieve/"))
        script = path.join("./tests/tests/", script);

      if (!existsSync(script))
        throw new Error(`No such file ${path.resolve(script)}`);

      report.addTrace("Loading Script " + path.resolve(script));
      (new vm.Script(await readFile(script), { filename: path.resolve(script) }))
        .runInContext(this.context);
    }

    /**
     * Destroys the sandbox including the context.
     */
    // eslint-disable-next-line require-await
    async destroy() {
      this.context = null;
    }

    /**
     * Returns all test case names which are loaded into the sandbox.
     *
     * @param {AbstractTestReport} report
     *   a reference to a report
     *
     * @returns {string[]}
     *   the test case names.
     */
    // eslint-disable-next-line no-unused-vars
    async getTests(report) {
      return await this.runInLoggerContext(report, async () => {
        return await (this.context.net.tschmid.yautt.test.get());
      });
    }

    /**
     * Returns the test fixtures description.
     *
     * @returns {string[]}
     *   the descriptions as string array. Each entry specifies a separate line.
     */
    async getDescription() {
      return await (this.context.net.tschmid.yautt.text.description());
    }


    /**
     * Runs a test case contained in the sandbox.
     *
     * @param {string} name
     *   the tests name
     * @param {report} report
     *   a reference to a report
     */
    async run(name, report) {
      await this.runInLoggerContext(report, async () => {
        await this.context.net.tschmid.yautt.test.run(name);
      });
    }
  }

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
    getScripts() {
      return [
        "./tests/js/common/AbstractSandboxedFixture.js",
        "./tests/js/node/SandboxedTestFixture.js",
        ...this.test.require,
        this.test.script
      ];
    }

    /**
     * @inheritdoc
     */
    createTestCase(name) {
      return new TestCase(name);
    }

    /**
     * @inheritdoc
     */
    createSandbox() {
      return new Sandbox();
    }
  }

  /**
   * Adapts the test fixture to a browser based runtime environment.
   */
  class NodeTestSuite extends AbstractTestSuite {

    /**
     * @inheritdoc
     */
    create(name, test) {
      return new NodeTestFixture(name, test);
    }
  }

  exports.NodeTestSuite = NodeTestSuite;

})(module.exports || this);
