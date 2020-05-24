(function (exports) {

  "use strict";

  /* global AbstractTestReport */

  /**
   * Renders the test report into the browser
   */
  class BrowserTestReport extends AbstractTestReport {

    /**
     * @inheritdoc
     */
    addSubReport(name) {

      const container = document.createElement("div");
      container.dataset.name = name;
      document.querySelector("#divOutput").appendChild(container);

      this.log("Test fixture '" + name + "'", "Header");

      return new BrowserTestReport(name);
    }

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
     * @inheritdoc
     **/
    addInfo(msg) {
      this.log(msg, "Info");
    }

    /**
     * @inheritdoc
     **/
    addTrace(msg) {
      this.log(msg, "Trace");
    }

    /**
     * @inheritdoc
     **/
    addError(message, details) {

      if (message instanceof Error) {
        details = "" + message.stack;
        message = "" + message;
      }

      this.log("✗ " + message, "Fail");

      if (details)
        this.log("" + details, "Trace");

      document
        .querySelector(`#tests input[value='${this.getName()}']`)
        .parentNode
        .classList.add("failure");
    }

    /**
     * @inheritdoc
     **/
    addWarning(msg) {
      this.log("⚠ " + msg, "Warning");
    }

    /**
     * @inheritdoc
     **/
    addSuccess() {
      this.log("✓ Test succeeded.", "Success");

      document
        .querySelector(`#tests input[value='${this.getName()}']`)
        .parentNode
        .classList.add("success");
    }

    /**
     * Clears all results...
     */
    clear() {

      const container = document.querySelector("#divOutput");
      while (container.firstChild)
        container.removeChild(container.firstChild);

      for (const elm of document.querySelectorAll("#tests .success"))
        elm.classList.remove("success");

      for (const elm of document.querySelectorAll("#tests .failure"))
        elm.classList.remove("failure");
    }
  }

  exports.BrowserTestReport = BrowserTestReport;

})(this);
