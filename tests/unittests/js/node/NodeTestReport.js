(function (exports) {

  const { TestSuiteReport, TestFixtureReport, TestCaseReport } = require("./../common/AbstractTestReport.js");

  const VERBOSITY_NORMAL = 1;
  const VERBOSITY_INFO = 2;
  const VERBOSITY_TRACE = 3;

  /**
   * A node specific logger implementation.
   * It logs everything to a console.
   */
  class Logger {

    /**
     * Creates a new logger instance.
     *
     * @param {int} [verbosity]
     *   the verbosity, if omitted VERBOSITY_NORMAL is used
     */
    constructor(verbosity) {

      if (typeof (verbosity) === "undefined" || verbosity === null)
        verbosity = VERBOSITY_INFO;

      this.verbosity = verbosity;
    }

    /**
     * Logs a generic message with of the given type
     * @param {string} msg
     *   the message to be logged
     * @param {string} [type]
     *   the message type if omitted "Trace" is used.
     */
    log(msg, type) {
      if ((typeof(type) === "undefined") || (type === "Trace")) {
        this.logTrace(msg);
        return;
      }

      console.warn(` ${type}  ${msg}`);
    }

    /**
     * Logs a trace message.
     *
     * @param {string} msg
     *   the trace message to be logged.
     */
    logTrace(msg) {
      if (this.verbosity < VERBOSITY_TRACE)
        return;

      // eslint-disable-next-line no-console
      console.log(`\u001B[90m${msg}\u001B[0m`);
    }

    /**
     * Logs an info message.
     *
     * @param {string} msg
     *   the info message to be logged.
     */
    logInfo(msg) {
      if (this.verbosity < VERBOSITY_INFO)
        return;

      // eslint-disable-next-line no-console
      console.log(msg);
    }

    /**
     * Logs an error message.
     *
     * @param {string} msg
     *   the error message to be logged.
     */
    logError(msg) {
      if (this.verbosity < VERBOSITY_NORMAL)
        return;

      // eslint-disable-next-line no-console
      console.log(`\u001B[31m${msg}\u001B[0m`);
    }

    /**
     * Logs a failure message.
     *
     * @param {string} msg
     *   the failure message to be logged.
     */
    logFailure(msg) {
      if (this.verbosity < VERBOSITY_NORMAL)
        return;

      // eslint-disable-next-line no-console
      console.log(`\u001B[31m${msg}\n\u001B[0m`);
    }

    /**
     * Logs a success message
     *
     * @param {string} msg
     *   the success message to be logged.
     */
    success(msg) {

      if (this.verbosity < VERBOSITY_NORMAL)
        return;

      // eslint-disable-next-line no-console
      console.log(`\u001B[32m${msg}\u001B[0m`);
    }

    /**
     * Logs a header, title or chapter.
     * Used to structure the log.
     *
     * @param {string} msg
     *   the headers message to be displayed.
     */
    header(msg) {
      if (this.verbosity < VERBOSITY_NORMAL)
        return;

      // eslint-disable-next-line no-console
      console.log(`\n\u001B[36m\u001B[1m${msg}\u001B[0m\u001B[0m`);
    }

    /**
     * Logs a warning message.
     *
     * @param {string} msg
     *   the warning to be logged.
     */
    warning(msg) {
      if (this.verbosity < VERBOSITY_NORMAL)
        return;

      // eslint-disable-next-line no-console
      console.log(`\u001B[33m${msg}\u001B[0m`);
    }
  }


  /**
   * A fixture contains a set of test cases.
   * All tests contained in a fixture are run in the same context.
   *
   * It can either run to completion or fails with an error.
   */
  class NodeTestFixtureReport extends TestFixtureReport {

    /**
     * @inheritdoc
     */
    createReport(name) {
      return new TestCaseReport(name, this.getLogger());
    }
  }

  /**
   * A test suite contains a set of fixtures.
   */
  class NodeTestSuiteReport extends TestSuiteReport {

    /**
     * Creates a new instance.
     *
     * @param {string} name
     *   the test suites name.
     * @param {int} [verbosity]
     *   the log level. Defaults to VERBOSITY_NORMAL if omitted
     */
    constructor(name, verbosity) {
      super(name, new Logger(verbosity));
    }

    /**
     * @inheritdoc
     */
    createReport(name) {

      this.getLogger().header(`Testing fixture ${name}`);
      return new NodeTestFixtureReport(name, this.getLogger());
    }

    /**
     * Prints a summary
     */
    summary() {
      let total = 0;
      let failures = 0;
      let errors = 0;

      for (const report of this.getReports()) {
        total += report.getReports().length;
        failures += report.getFailures().length;
        errors += report.getErrors().length;
      }

      const fixtures = this.getReports().length;
      const duration = this.getDuration();

      this.getLogger().header("Summary");
      this.getLogger().logInfo(
        `Ran ${fixtures} fixtures with ${total} Tests in ${duration} ms.`);

      if (this.hasFailed())
        this.getLogger().logError(`${failures} tests failed ${errors} test errored`);

    }

  }

  exports.NodeTestReport = NodeTestSuiteReport;

  exports.VERBOSITY_INFO = VERBOSITY_INFO;
  exports.VERBOSITY_NORMAL = VERBOSITY_NORMAL;
  exports.VERBOSITY_TRACE = VERBOSITY_TRACE;

})(this);
