(function (exports) {

  "use strict";

  /**
   * Collects and renders te test results.
   */
  class AbstractTestReport {

    /**
     * Creates a new instance.
     *
     * @param {string} name
     *   the report's name.
     */
    constructor(name) {
      this.name = name;
    }

    /**
     * Returns the report's name.
     *
     * @returns {string}
     *   the reports name.
     */
    getName() {
      return this.name;
    }

    /**
     * Adds a sub report to this report
     * @abstract
     *
     * @param {string} name
     *   the sub reports name
     * @returns {AbstractTestReport}
     *   a self to the new sub report
     */
    addSubReport(name) {
      throw new Error(`Implement add(${name})`);
    }

    /**
     * Adds an info message to the report.
     * @abstract
     *
     * @param {string} msg
     *   the message to be added.
     *
     * @returns {AbstractTestReport}
     *   a self reference.
     */
    addInfo(msg) {
      throw new Error(`Implement addInfo(${msg})`);
    }

    /**
     * Adds a trace message to the report.
     * @abstract
     *
     * @param {string} msg
     *   the message to be added.
     *
     * @returns {AbstractTestReport}
     *   a self reference.
     */
    addTrace(msg) {
      throw new Error(`Implement addTrace(${msg})`);
    }

    /**
     * Adds an error to the report.
     * @abstract
     *
     * @param {string|Error} message
     *   the message or exception to be added.
     *
     * @param {string} [details]
     *   optional addition details.
     *
     * @returns {AbstractTestReport}
     *   a self reference.
     */
    addError(message, details) {
      throw new Error(`Implement addError(${message},${details})`);
    }

    /**
     * Adds a warning to the report.
     * @abstract
     *
     * @param {string} msg
     *   the message to be added.
     *
     * @returns {AbstractTestReport}
     *   a self reference.
     */
    addWarning(msg) {
      throw new Error(`Implement addWarning(${msg})`);
    }

    /**
     * Marks the report as successful.
     * @abstract
     *
     * @returns {AbstractTestReport}
     *   a self reference.
     */
    addSuccess() {
      throw new Error(`Implement addSuccess()`);
    }
  }

  exports.AbstractTestReport = AbstractTestReport;

})(this);
