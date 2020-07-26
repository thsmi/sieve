(function (exports) {

  const { AbstractTestSuite, AbstractTestFixture, TestCase } = require("./../common/AbstractTestSuite.js");

  const { fork } = require('child_process');
  const path = require("path");


  /**
   * Implements a sandbox to run the unit tests.
   * It uses a separate node context.
   */
  class Sandbox {

    /**
     * Initializes the sandbox.
     *
     * @param {AbstractTestReport} report
     *   the report which should be used for logging
     * @param {string[]} scripts
     *   the scripts to be loaded into the sandbox
     */
    async init(report, scripts) {

      const program = path.resolve(path.dirname(process.argv[1]), "child.mjs");
      const args = [];

      const options = {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      };

      this.child = fork(program, args, options);

      // TODO wait until connected.

      this.child.on("exit", () => {
        console.log("Child exited.");
      });

      await this.require(report, scripts);
    }

    /**
     * Loads java script files into the sandbox context.
     *
     * @param {AbstractTestReport} report
     *   a reference  to the an report.
     * @param {string[]} scripts
     *   the scripts to be loaded.
     */
    async require(report, scripts) {

      if (!this.context)
        throw new Error("Sandbox not initialized");

      // todo check if file exists.
      await this.execute(report, "ImportScript", scripts);

      /*// FixMe remove the path voodoo...
      if (script.startsWith("./../common/"))
        script = path.join("./src/common/", script);

      if (script.startsWith("./validators/"))
        script = path.join("./tests/tests/", script);

      if (script.startsWith("./sieve/"))
        script = path.join("./tests/tests/", script);

      if (!existsSync(script))
        throw new Error(`No such file ${path.resolve(script)}`);*/
    }

    /**
     * Destroys the sandbox including the context.
     */
    // eslint-disable-next-line require-await
    async destroy() {
      this.child.kill();
      // TODO Kill the child process
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
      await this.execute(report, "RunTest", name);
    }

    /**
     * Gets the reference to the child process which runs the tests.
     * @returns {ChildProcess}
     *   the child process.
     */
    getChildProcess() {
      return this.child;
    }

    /**
     *
     * @param {*} report
     * @param {*} type
     * @param {*} data
     */
    async execute(report, type, data) {

      return await new Promise((resolve, reject) => {

        const child = this.getChildProcess();

        child.on('message', function onMessage() {

          const msg = JSON.parse(event.data);

          if (msg.type === "LogSignal") {
            report.getLogger().log(msg.message, msg.level);
            return;
          }

          if (msg.type === `${type}Resolve`) {
            resolve(msg.result);
            child.off("message", onMessage);
            return;
          }

          if (msg.type === `${type}Reject`) {
            reject(new Error(msg.message, msg.stack));
            child.off("message", onMessage);
            return;
          }
        });

        const msg = {
          type: `${type}`,
          data: data
        };

        this.child.send("" + JSON.stringify(msg));
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
