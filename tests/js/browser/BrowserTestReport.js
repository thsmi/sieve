(function (exports) {

  /* global TestSuiteReport */
  /* global TestFixtureReport */
  /* global TestCaseReport */

  /**
   * Logs messages and renders them inside a browser window.
   */
  class Logger {

    /**
     * Renders a message to the test Report.
     *
     * @param {string} message
     *   the message to be logged
     * @param {string} style
     *   the css style
     */
    log(message, style) {

      if (typeof (style) !== "string")
        style = "logInfo";
      else
        style = "log" + style;

      const div = document.createElement("div");
      div.classList.add(style);
      div.textContent = message;

      document
        .querySelector("#divOutput > div:last-child")
        .appendChild(div);
    }

    /**
     * Logs a trace message.
     *
     * @param {string} msg
     *   the trace message to be logged.
     */
    logTrace(msg) {
      this.log(msg, "Trace");
    }

    /**
     * Logs an info message.
     *
     * @param {string} msg
     *   the info message to be logged.
     */
    logInfo(msg) {
      this.log(msg, "Info");
    }

    /**
     * Logs an error message.
     *
     * @param {string} msg
     *   the error message to be logged.
     */
    logError(msg) {
      this.log(msg, "Error");
    }

    /**
     * Logs a failure message.
     *
     * @param {string} msg
     *   the failure message to be logged.
     */
    logFailure(msg) {
      this.log(msg, "Failure");
    }

    /**
     * Logs a success message
     *
     * @param {string} msg
     *   the success message to be logged.
     */
    success(msg) {
      this.log(msg, "Success");
    }

    /**
     * Logs a header, title or chapter.
     * Used to structure the log.
     *
     * @param {string} msg
     *   the headers message to be displayed.
     */
    header(msg) {
      this.log(msg, "Header");
    }

    /**
     * Logs a warning message.
     *
     * @param {string} msg
     *   the warning to be logged.
     */
    warning(msg) {
      this.log(msg, "Warning");
    }
  }


  /**
   * Reports a fixtures status, and renders the results in a browser window.
   */
  class BrowserTestFixtureReport extends TestFixtureReport {

    /**
     * @inheritdoc
     */
    createReport(name) {
      return new TestCaseReport(name, this.getLogger());
    }

    /**
     * @inheritdoc
     */
    log(msg, level) {
      this.getLogger().log(msg, level);
    }

    /**
     * @inheritdoc
     */
    complete() {

      super.complete();

      document
        .querySelector(`#tests input[value='${this.getName()}']`)
        .parentNode
        .classList.add("success");

      return this;
    }

    /**
     * @inheritdoc
     */
    error(ex) {

      super.error(ex);

      document
        .querySelector(`#tests input[value='${this.getName()}']`)
        .parentNode
        .classList.add("failure");

      return this;
    }
  }

  /**
   * Reports the status of a test suite and renders the results in a browser windows.
   */
  class BrowserTestSuiteReport extends TestSuiteReport {

    /**
     * @inheritdoc
     */
    constructor(name) {
      super(name, new Logger());
    }

    /**
     * @inheritdoc
     */
    createReport(name) {

      const div = document.createElement("div");
      div.dataset.name = name;

      document
        .querySelector("#divOutput")
        .appendChild(div);

      this.getLogger().header(`Test fixture '${name}'`);
      return new BrowserTestFixtureReport(name, this.getLogger());
    }

    /**
     * Clears all results...
     */
    clear() {

      super.clear();

      const container = document.querySelector("#divOutput");
      while (container.firstChild)
        container.removeChild(container.firstChild);

      for (const elm of document.querySelectorAll("#tests .success"))
        elm.classList.remove("success");

      for (const elm of document.querySelectorAll("#tests .failure"))
        elm.classList.remove("failure");
    }

  }

  exports.BrowserTestReport = BrowserTestSuiteReport;

})(this);
