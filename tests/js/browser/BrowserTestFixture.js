(function (exports) {

  "use strict";

  /* global AbstractTestFixture */

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
    async _run() {

      const scripts = [
        ...this.test.require,
        this.test.script,
        "./../js/browser/BrowserTestCaseInit.js"
      ];

      return await (new Promise((resolve) => {

        const that = this;

        window.addEventListener("message", function onMessage(event) {

          const msg = JSON.parse(event.data);

          if (msg.type === "LOG") {
            that.getReport().log(msg.data, msg.level);
            return;
          }

          if (msg.type === "FAIL") {
            window.removeEventListener("message", onMessage, false);

            that.onFailure(msg.description, msg.details);
            resolve();
            return;
          }

          if (msg.type === "SUCCEED") {
            window.removeEventListener("message", onMessage, false);

            that.onSuccess();
            resolve();
            return;
          }
        }, false);

        this.createSandbox(scripts);
      }));
    }

    /**
     * Called when the test execution succeeded.
     */
    onSuccess() {
      this.getReport().addSuccess();
      this.destroySandbox();
    }

    /**
     * Called when a test execution failed with an error.
     *
     * @param {string} description
     *   a description about the error which caused the failure.
     *
     * @param {string} [details]
     *   optional details about the error
     */
    onFailure(description, details) {
      this.getReport().addError(description, details);
      this.destroySandbox();
    }

    /**
     * Creates a new sandbox for the test.
     * It will automatically remove any existing sandboxes.
     *
     * As sandbox an Iframe is used.
     *
     * @param {string[]} scripts
     *   the scripts to load.
     */
    createSandbox(scripts) {

      this.destroySandbox();

      const container = document.querySelector("#divFrame");
      const sandbox = document.createElement("iframe");
      sandbox.id = "testFrame";
      sandbox.addEventListener( 'load', () => {
        this.onSandboxCreated(scripts);
      }, { once: true });
      sandbox.src = "./tests/tests.html";

      container.appendChild(sandbox);
    }

    /**
     * Destroys the current sandbox.
     */
    destroySandbox() {
      const container = document.querySelector("#divFrame");

      while (container.firstChild)
        container.removeChild(container.firstChild);
    }

    /**
     * Called as soon as the sandbox is created.
     * @param {string[]} scripts
     *   the scripts which should be loaded
     */
    onSandboxCreated(scripts) {
      const iframe = document.getElementById("testFrame").contentWindow;

      this.getReport().addTrace("Injecting Scripts for " + this.getName() + " ...");

      for (const script of scripts) {
        const msg = { type: "IMPORT", data: script };
        iframe.postMessage("" + JSON.stringify(msg), "*");
      }
    }
  }

  exports.BrowserTestFixture = BrowserTestFixture;

})(this);
