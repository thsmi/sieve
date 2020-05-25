/* eslint-disable no-console */
(function (exports) {

  "use strict";

  const { AbstractTestReport } = require("./../common/AbstractTestReport.js");

  const VERBOSITY_NORMAL = 1;
  const VERBOSITY_INFO = 2;
  const VERBOSITY_TRACE = 3;

  const STATUS_FAILED = 0;
  const STATUS_SUCCESS = 1;
  const STATUS_UNKNOWN = 2;

  /**
   * Renders the test report into the browser
   */
  class NodeTestReport extends AbstractTestReport {

    /**
     * @inheritdoc
     */
    constructor(name) {
      super(name);
      this.verbosity = VERBOSITY_INFO;
      this.reports = new Set();
      this.status = STATUS_UNKNOWN;
    }

    /**
     * @inheritdoc
     */
    addSubReport(name) {
      if (this.verbosity >= VERBOSITY_NORMAL)
        console.log(`\n\u001B[36m\u001b[1mTesting fixture ${name}\u001b[0m\u001b[0m`);

      const report = new NodeTestReport(name);
      report.setVerbosity(this.verbosity);

      this.reports.add(report);

      return report;
    }

    /**
     * Enumerates the tests and returns the status
     *
     * @returns {int}
     *   0 means failed, 1 succeeded and 2 unknown.
     */
    getStatus() {

      if (this.status === STATUS_FAILED)
        return STATUS_FAILED;

      for (const report of this.reports)
        if (report.getStatus() === STATUS_FAILED)
          return STATUS_FAILED;

      return STATUS_SUCCESS;
    }

    /**
     * Sets the verbosity level.
     *
     * @param {int} verbosity
     *   0 means no silent, 1 normal logging, 2 additional info messages and
     *   3 enables tracing.
     * @returns {NodeTestReport}
     *   a self reference
     */
    setVerbosity(verbosity) {
      this.verbosity = verbosity;
      return this;
    }

    /**
     * @inheritdoc
     */
    addInfo(msg) {
      if (this.verbosity < VERBOSITY_INFO)
        return this;

      console.log(msg);
      return this;
    }

    /**
     * @inheritdoc
     */
    addTrace(msg) {
      if (this.verbosity < VERBOSITY_TRACE)
        return this;

      console.log(`\u001B[90m${msg}\u001b[0m`);
      return this;
    }

    /**
     * @inheritdoc
     */
    addError(message, details) {

      this.status = STATUS_FAILED;

      if (this.verbosity < VERBOSITY_NORMAL)
        return this;

      if (message instanceof Error) {
        details = "" + message.stack;
        message = "" + message;
      }

      console.log(`\u001B[31m${message} \u001b[0m`);

      if (details)
        console.log(`\u001B[31m${details} \u001b[0m`);

      return this;
    }

    /**
     * @inheritdoc
     */
    addWarning(msg) {
      if (this.verbosity < VERBOSITY_NORMAL)
        return this;

      console.log(`\u001B[33m⚠ ${msg} \u001b[0m`);
      return this;
    }

    /**
     * @inheritdoc
     */
    addSuccess() {

      this.status = STATUS_SUCCESS;

      if (this.verbosity < VERBOSITY_NORMAL)
        return this;

      console.log("\u001B[32m✓ Test succeeded.\u001b[0m");
      return this;
    }

  }

  exports.NodeTestReport = NodeTestReport;

  exports.STATUS_FAILED = STATUS_FAILED;
  exports.STATUS_SUCCESS = STATUS_SUCCESS;
  exports.STATUS_UNKNOWN = STATUS_UNKNOWN;

})(this);
