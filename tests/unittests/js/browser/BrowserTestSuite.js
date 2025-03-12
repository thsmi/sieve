// Create the namespace...

// Our server is implemented within an anonymous method...

(function (exports) {

  /* global AbstractTestSuite */
  /* global AbstractTestFixture */
  /* global TestCase */


  const RANDOM_SEED_SIZE = 10000000;
  const HEX_STRING = 16;

  /**
   * Uses an iframe to emulate a sandbox.
   */
  class Sandbox {

    /**
     * Initializes the Sandbox with the given scripts.
     *
     * @param {AbstractTestReport} report
     *   a reference to a report.
     * @param {string[]} scripts
     *   the scripts which should be loaded into this sandbox.
     */
    async init(report, scripts) {

      const iframe = document.createElement("iframe");
      iframe.id = this.getUniqueId();

      document
        .querySelector("#divFrame")
        .append(iframe);

      await new Promise((resolve) => {
        iframe.addEventListener('load', () => {
          resolve();
        }, { once: true });

        iframe.src = "./js/browser/sandbox/sandbox.html";
      });

      await this.require(report, scripts);
    }

    /**
     * Loads a script into the sandbox.
     *
     * @param {AbstractTestReport} report
     *   a reference to a report
     * @param {string[]} scripts
     *   the script to be loaded into the sandbox
     */
    async require(report, scripts) {

      const iframe = document.querySelector(`#${this.getUniqueId()}`);

      if (!iframe)
        throw new Error("Sandbox not initialized");

      scripts = scripts.map((script) => {

        if (script.startsWith("${workspace}/"))
          script = script.replace("${workspace}/", "/unittests/wx/");

        if (script.startsWith("./../common/"))
          script = script.replace("./../common/libSieve/", "/gui/libSieve/");

        return script;
      });

      await this.execute(report, "ImportScript", scripts);
    }

    /**
     * Destroys the sandbox and removes the Iframe.
     */
    async destroy() {
      const el = document.querySelector(`#${this.getUniqueId()}`);

      if (el)
        el.remove();
    }

    /**
     * Gets the unique id for the iframe used as sandbox.
     *
     * @returns {string}
     *   the unique id to be returned.
     */
    getUniqueId() {

      if (!this.id) {
        this.id = "siv-"
          + Math.floor(Math.random() * RANDOM_SEED_SIZE).toString(HEX_STRING)
          + Date.now().toString(HEX_STRING);
      }

      return this.id;
    }

    /**
     * Executes the script and returns the test result.
     * @param {string} name
     *   the script name
     * @param {AbstractTestReport} report
     *   a reference to a report.
     *
     * @returns {object}
     *   the actions return value
     */
    async run(name, report) {

      const iframe = document.querySelector(`#${this.getUniqueId()}`);

      if (!iframe)
        throw new Error("Sandbox not initialized");

      const rv = await this.execute(report, "RunTest", name);
      return rv;
    }

    /**
     * Executes a action in the sandbox.
     * In case the action failed it will throw an error.
     *
     * @param {AbstractTestReport} report
     *   a reference to a report
     * @param {string} type
     *   the action name
     * @param {object} data
     *  the action details.
     *
     * @returns {object}
     *   the actions return value
     */
    async execute(report, type, data) {
      const iframe = document.querySelector(`#${this.getUniqueId()}`);

      if (!iframe)
        throw new Error("Sandbox not initialized");

      return new Promise((resolve, reject) => {

        const onMessage = (event) => {
          const msg = JSON.parse(event.data);

          if (msg.type === "LogSignal") {
            report.getLogger().log(msg.payload.message, msg.payload.level);
            return;
          }

          if (msg.type === `${type}Resolve`) {
            window.removeEventListener("message", onMessage);
            resolve(msg.payload);
            return;
          }

          if (msg.type === `${type}Reject`) {
            window.removeEventListener("message", onMessage);
            reject(new Error(msg.payload.message, msg.payload.stack));
            return;
          }
        };

        window.addEventListener("message", onMessage);

        const msg = {
          type: `${type}`,
          payload: data
        };

        iframe.contentWindow.postMessage("" + JSON.stringify(msg), "*");
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
    async getTests(report) {
      return await this.execute(report, "GetTests");
    }
  }

  /**
   * Implements a fixture which can be run inside the browser.
   */
  class BrowserTestFixture extends AbstractTestFixture {

    /**
     * @inheritdoc
     */
    getUserAgent() {
      return window.navigator.userAgent;
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
   * Implements a test suite which can be run inside a browser.
   */
  class BrowserTestSuite extends AbstractTestSuite {

    /**
     * @inheritdoc
     */
    create(name, test) {
      return new BrowserTestFixture(name, test);
    }

  }

  exports.BrowserTestSuite = BrowserTestSuite;

})(this);
