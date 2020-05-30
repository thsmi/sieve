/*
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

(function (exports) {

  "use strict";

  const STATUS_UNKNOWN = 0;
  const STATUS_RUNNING = 1;
  const STATUS_SUCCESS = 2;
  const STATUS_FAILURE = 3;
  const STATUS_ERROR = 4;

  const STATUS_FIXTURE_UNKNOWN = 0;
  const STATUS_FIXTURE_RUNNING = 1;
  const STATUS_FIXTURE_ERROR = 2;
  const STATUS_FIXTURE_COMPLETE = 3;

  const DEFAULT_DURATION = 0;

  /**
   * Collects and renders te test results.
   */
  class AbstractTestReport {

    /**
     * Creates a new instance.
     *
     * @param {string} name
     *   the report's name.
     * @param {Logger} logger
     *   a reference to a logger.
     */
    constructor(name, logger) {
      this.name = name;
      this.logger = logger;
    }

    /**
     * Sets the start marker
     */
    start() {
      this.startMarker = new Date();
    }

    /**
     * Sets the stop marker
     */
    stop() {
      this.stopMarker = new Date();
    }

    /**
     * Gets the time when the test case was executed.
     *
     * @returns {Date}
     *   the start timestamp.
     */
    getTimestamp() {
      return this.startMarker;
    }

    /**
     * Calculates the execution time. Which are the milliseconds between the
     * start and stop marker.
     *
     * @returns {int}
     *   the duration in ms or 0 in case it was not started or not yet stopped.
     */
    getDuration() {
      if ((!this.startMarker) || (!this.stopMarker))
        return DEFAULT_DURATION;

      return this.stopMarker - this.startMarker;
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
     * Adds an info message to the report.
     *
     * @param {string} msg
     *   the message to be added.
     *
     * @returns {AbstractTestReport}
     *   a self reference.
     */
    addInfo(msg) {
      this.logger.logInfo(msg);
      return this;
    }

    /**
     * Adds a trace message to the report.
     *
     * @param {string} msg
     *   the message to be added.
     *
     * @returns {AbstractTestReport}
     *   a self reference.
     */
    addTrace(msg) {
      this.logger.logTrace(msg);
      return this;
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
      this.logger.warning(`⚠ ${msg}`);
      return this;
    }

    /**
     * Gets the reference to the current logger.
     *
     * @returns {Logger}
     *   a logger instance.
     */
    getLogger() {
      return this.logger;
    }

    /**
     * Logs a message at the given level.
     * It is deprecated and only for backward compatibility.
     * @deprecated
     *
     * @param {string} msg
     *   the message
     * @param {string} level
     *   the log level as string
     */
    log(msg, level) {
      if (typeof (level) !== "string")
        level = "Info";

      if (level === "Trace") {
        this.addTrace(msg);
        return;
      }

      if (level === "Info") {
        this.addInfo(msg);
        return;
      }

      this.addInfo(msg);
    }


  }

  /**
   * A test case can explicitly fail, implicitly succeeded or
   * fail with an unanticipated error.
   */
  class TestCaseReport extends AbstractTestReport {

    /**
     * @inheritdoc
     */
    constructor(name, logger) {
      super(name, logger);
      this.status = STATUS_UNKNOWN;
    }

    /**
     * @inheritdoc
     */
    start() {
      this.status = STATUS_RUNNING;
      super.start();
    }

    /**
     * Marks the report as successful.
     * @abstract
     *
     * @returns {AbstractTestReport}
     *   a self reference.
     */
    success() {
      this.status = STATUS_SUCCESS;
      this.stop();

      this.getLogger().success(`✓ ${this.getName()} (${this.getDuration()} ms)`);

      return this;
    }

    /**
     * An error is when a test case has an unanticipated problem.
     * Typically a syntax or logical error in the implementation.
     * Which triggers an exception.
     *
     * @param {Error} ex
     *   the exception which caused this error.
     *
     * @returns {AbstractTestReport}
     *   a self reference.
     */
    // eslint-disable-next-line no-unused-vars
    error(ex) {
      this.status = STATUS_ERROR;
      this.stop();

      this.logger.logError(`✗ ${ex.stack}  (${this.getDuration()})`);

      return this;
    }

    /**
     * Checks it the test case has failed due to an error.
     *
     * @returns {boolean}
     *   true in case the test case failed otherwise false.
     */
    hasErrors() {
      return (this.status === STATUS_ERROR);
    }

    /**
     * A failure is when a test explicitly failed by using the mechanisms
     * for that purpose. e.g., via an assertEquals.
     *
     * @param {Error} ex
     *   the exception which caused this failure.
     *
     * @returns {AbstractTestReport}
     *   a self reference.
     */
    // eslint-disable-next-line no-unused-vars
    fail(ex) {
      this.status = STATUS_ERROR;
      this.stop();

      this.getLogger().logFailure(
        `✗ ${this.getName()} (${this.getDuration()})\n\n${ex.message}`);
      this.addTrace(ex.stack);
      return this;
    }

    /**
     * Checks if the test case has failed.
     *
     * @returns {boolean}
     *   true in case the test case failed otherwise false.
     */
    hasFailures() {
      return (this.status === STATUS_FAILURE);
    }
  }

  /**
   * Collects and reports information on the fixture.
   */
  class TestFixtureReport extends AbstractTestReport {

    /**
     * @inheritdoc
     */
    constructor(name, logger) {
      super(name, logger);
      this.testCases = [];
      this.status = STATUS_FIXTURE_UNKNOWN;
    }

    /**
     * @inheritdoc
     */
    start() {
      this.status = STATUS_FIXTURE_RUNNING;
      super.start();
    }

    /**
     * Creates a new report for a test case.
     * @param {string} name
     *   the test case name.
     */
    createReport(name) {
      throw new Error(`Implement me ${name}`);
    }

    /**
     * Adds a sub report to this report
     *
     * @param {string} name
     *   the sub reports name
     * @returns {AbstractTestReport}
     *   a self to the new sub report
     */
    addSubReport(name) {

      const report = this.createReport(name);
      this.testCases.push(report);

      return report;
    }

    /**
     * Returns the reports for the test cases included in this fixture.
     *
     * @returns {TestCaseReport[]}
     *   the test case reports.
     */
    getReports() {
      return this.testCases;
    }

    /**
     * Checks if the fixture has failed.
     *
     * A fixture fails in case the fixture ran into an error or any of
     * the tests failed with a failure or an error.
     *
     * @returns {boolean}
     *   true in case the fixture failed otherwise false.
     */
    hasFailed() {
      if (this.status === STATUS_FIXTURE_ERROR)
        return true;

      if (this.getFailures().length)
        return true;

      if (this.getErrors().length)
        return true;

      return false;
    }

    /**
     * Gets the number of failed tests
     *
     * @returns {int}
     *   the number of failed tests.
     */
    getFailures() {
      const failures = [];

      for (const testCase of this.getReports())
        if (testCase.hasFailures())
          failures.push(testCase);

      return failures;
    }

    /**
     * Gets the umber of test cases failed due to an error.
     *
     * @returns {AbstractTestCase[]}
     *   the test cases which errored out.
     */
    getErrors() {
      const errors = [];

      for (const testCase of this.getReports())
        if (testCase.hasErrors())
          errors.push(testCase);

      return errors;
    }

    /**
     * Marks the test fixture as completed
     *
     * @returns {TestFixtureReport}
     *   a self reference
     */
    complete() {
      this.status = STATUS_FIXTURE_COMPLETE;
      this.stop();

      this.addInfo(`Test fixture completed after (${this.getDuration()} ms)`);

      return this;
    }

    /**
     * Sets the test fixture to failed due to an error
     *
     * @param {Error} ex
     *   the exception  which caused the fixture to fail
     *
     * @returns {TestFixtureReport}
     *   a self reference
     */
    error(ex) {
      this.status = STATUS_FIXTURE_ERROR;
      this.stop();

      this.getLogger().logError(ex.stack);

      return this;
    }
  }

  /**
   * A container for test suite reports.
   */
  class TestSuiteReport extends AbstractTestReport {

    /**
     * @inheritdoc
     */
    constructor(name, logger) {
      super(name, logger);
      this.testFixtures = [];
    }

    /**
     * Checks if the test suite has failed.
     *
     * @returns {boolean}
     *   true in case a test case failed otherwise false.
     */
    hasFailed() {

      for (const fixture of this.testFixtures)
        if (fixture.hasFailed())
          return true;

      return false;
    }

    /**
     * Creates a new report for a test fixture.
     *
     * @param {string} name
     *   the fixture name.
     */
    createReport(name) {
      throw new Error(`Implement me ${name}`);
    }

    /**
     * Adds a sub report to this report
     *
     * @param {string} name
     *   the sub reports name
     *
     * @returns {TestFixtureReport}
     *   the newly created report
     */
    addReport(name) {
      const report = this.createReport(name);
      this.testFixtures.push(report);

      return report;
    }

    /**
     * Returns the the reports for all fixtures
     * contained in this test suite.
     *
     * @returns {TestFixtureReport[]}
     *   the fixtures.
     */
    getReports() {
      return this.testFixtures;
    }

    /**
     * Clear any previous status from the report.
     */
    clear() {
      this.testFixtures = [];
    }
  }

  exports.AbstractTestReport = AbstractTestReport;

  exports.TestSuiteReport = TestSuiteReport;
  exports.TestFixtureReport = TestFixtureReport;
  exports.TestCaseReport = TestCaseReport;

})(this);
