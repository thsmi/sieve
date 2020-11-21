(function (exports) {

  const { AbstractTestSuite, AbstractTestFixture, TestCase } = require("./../common/AbstractTestSuite.js");

  const { fork } = require('child_process');
  const path = require("path");
  const fs = require('fs');

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

      const program = path.resolve(`${__dirname}/sandbox/Sandbox.mjs`);

      if (!fs.existsSync(program))
        throw new Error(`Could not find sandbox ${program}`);

      const args = [];

      const options = {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      };

      this.child = fork(program, args, options);

      this.child.on("error", (err) => {
        // eslint-disable-next-line no-console
        console.log("Executing Sandbox failed with an error" + err);
      });

      await this.connect(report);

      await this.require(report, scripts);
    }

    /**
     * Initiates a connection. It waits until the sandbox signals
     * its readiness.
     *
     * @returns {Promise<undefined>}
     */
    async connect() {
      return await new Promise((resolve, reject) => {

        const child = this.getChildProcess();

        let cleanup = null;

        const onMessage = function(msg) {

          msg = JSON.parse(msg);

          if (msg.type === `ReadySignal`) {
            cleanup();
            resolve(msg.result);
            return;
          }
        };

        const onExit = function() {
          cleanup();
          reject( new Error("Child process unexpectedly terminated"));
        };

        cleanup = () => {
          child.off("message", onMessage);
          child.off("exit", onExit);
        };

        child.on('exit', onExit);
        child.on('message', onMessage);

        const msg = {
          type: "ready",
          payload: ""
        };

        this.child.send("" + JSON.stringify(msg));
      });
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

      if (!this.child)
        throw new Error("Sandbox not initialized");

      scripts = scripts.map((script) => {
        if (script.startsWith("./../common/"))
          script = path.join(__dirname, "./../../../src/common/", script);

        if (script.startsWith("./validators/"))
          script = path.join(__dirname, "./../../tests/", script);

        if (!fs.existsSync(script))
          throw new Error(`No such file ${path.resolve(script)}`);

        return `file://${script}`;
      });

      await this.execute(report, "ImportScript", scripts);
    }

    /**
     * Destroys the sandbox including the context.
     *
     * @returns {Promise<undefined>}
     */
    async destroy() {

      return new Promise((resolve, reject) => {
        this.child.on("exit", () => {
          resolve();
        });

        if (!this.child.kill()) {
          reject(new Error("Could not terminate child process"));
        }
      });
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
      return await this.execute(report, "GetTests");
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

        child.on('message', function onMessage(msg) {

          msg = JSON.parse(msg);

          if (msg.type === "LogSignal") {
            // console.log(msg.message);
            report.getLogger().log(
              msg.payload.message, msg.payload.level);
            return;
          }

          if (msg.type === `${type}Resolve`) {
            resolve(msg.payload);
            child.off("message", onMessage);
            return;
          }

          if (msg.type === `${type}Reject`) {
            reject(new Error(msg.payload.message, msg.payload.stack));
            child.off("message", onMessage);
            return;
          }
        });

        const msg = {
          type: `${type}`,
          payload: data
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
