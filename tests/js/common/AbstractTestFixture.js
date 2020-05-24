(function (exports) {

  "use strict";

  /**
   * Runs unit tests which run in a common context.
   * The context can be to startup and teardown mocks.
   */
  class AbstractTestFixture {

    /**
     * Creates a new instance.
     *
     * @param {string} name
     *   the fixtures unique name.
     * @param {} test
     *   the tests to run
     */
    constructor(name, test) {
      this.name = name;
      this.test = test;
      this.report = null;
    }

    /**
     * Returns the tests unique name.
     *
     * @returns {string}
     *   the name
     */
    getName() {
      return this.name;
    }

    /**
     * Returns the current test report.
     * It may be null if the fixture did not run.
     *
     * @returns {AbstractTestReport}
     *   the test report for this fixture, may be null.
     */
    getReport() {
      return this.report;
    }

    /**
     * Checks if the test is disabled.
     *
     * @returns {boolean}
     *   true in case the test was disabled, otherwise false.
     */
    isDisabled() {
      return (this.test.disabled === true);
    }

    /**
     * Checks it this test can be run in the given environment.
     * Browser implementations are similar but not identical.
     * Especially node diverges a lot from browsers.
     *
     * @param {string} userAgent
     *   the runtime's versioning string.
     *
     * @returns {boolean}
     *   the in case this test is compatible whit this runtime otherwise false.
     */
    isCompatible(userAgent) {

      if (!this.test.agents)
        return true;

      let agents = this.test.agents;

      if (!Array.isArray(agents))
        agents = [agents];

      for (const agent of agents) {

        this.getReport().addTrace(
          "Checking if environment is compatible with " + agent + " ...");

        if (userAgent.indexOf(agent) > -1) {
          this.getReport().addTrace("... Yes");
          return true;
        }

        this.getReport().addTrace("... No");
      }

      this.getReport().addTrace(" ... no compatible environment found.");
      return false;
    }

    /**
     * Runs the test fixture including all of the unit tests.
     *
     * @param {AbstractTestReport} report
     *   the report to which the test data should be added.
     *
     * @returns {AbstractTestFixture}
     *   a self reference
     */
    async run(report) {

      this.report = report.addSubReport(this.name);

      if (this.isDisabled()) {
        this.getReport().addWarning("Skipped, it is disabled");
        return this;
      }

      if (!this.isCompatible(this.getUserAgent())) {
        this.getReport().addWarning("Skipped, it is incompatible with your runtime");
        return this;
      }

      // TODO call without await to run in parallel.
      await this._run();

      return this;
    }

    /**
     * Runs the unit tests, needs to be overwritten by the child
     * In case of an error an exception should be thrown.
     * @abstract
     */
    async _run() {
      throw new Error("Implement run");
    }
  }

  exports.AbstractTestFixture = AbstractTestFixture;

})(this);
