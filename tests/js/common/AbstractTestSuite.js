(function (exports) {

  const TOKEN_FOUND = -1;

  /**
   * Runs the actual test case inside the sandbox.
   */
  class TestCase {

    /**
     * Creates a new instance.
     * @param {string} name
     *   the test case name.
     */
    constructor(name) {
      this.name = name;
    }

    /**
     * Returns the test case name.
     *
     * @returns {string}
     *   the test case name
     */
    getName() {
      return this.name;
    }

    /**
     * Runs the test case inside the sandbox.
     *
     * @param {AbstractTestReport} report
     *  a reference to a report.
     * @param {Sandbox} sandbox
     *   a reference to a sandbox.
     */
    async run(report, sandbox) {

      report = report.addSubReport(this.getName());

      try {
        report.start();

        await sandbox.run(this.getName(), report);

        report.success();
      } catch (ex) {
        report.fail(ex);
      }
    }
  }

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
     * @param {object} test
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
     * @returns {AbstractTestFixtureReport}
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
     *   the runtime versioning string.
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

        if (userAgent.indexOf(agent) > TOKEN_FOUND) {
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
     * @param {TestFixtureReport} report
     *   the report to which the test data should be added.
     *
     * @returns {AbstractTestFixture}
     *   a self reference
     */
    async run(report) {

      this.report = report.addReport(this.getName());

      if (this.isDisabled()) {
        this.getReport().addWarning("Skipped, it is disabled");
        return this;
      }

      if (!this.isCompatible(this.getUserAgent())) {
        this.getReport().addWarning("Skipped, it is incompatible with your runtime");
        return this;
      }

      // Create a sandbox
      const sandbox = this.createSandbox();

      try {
        this.getReport().start();

        await sandbox.init(this.getReport(), this.getScripts());

        // and run the scripts
        for (const name of await sandbox.getTests()) {
          const test = this.createTestCase(name);
          await test.run(this.getReport(), sandbox);
        }

        this.getReport().complete();
      } catch (ex) {
        this.getReport().error(ex);
      }

      await sandbox.destroy();

      return this;
    }
  }



  /**
   * Implements an abstract test suite
   *
   * A test suite has fixtures and fixtures have test cases.
   */
  class AbstractTestSuite {

    /**
     * Creates a new instance.
     */
    constructor() {
      this.tests = new Set();
    }

    /**
     * Loads the test definitions into this test suite.
     *
     * @param {*} tests
     *   the test definition
     *
     * @returns {AbstractTestSuite}
     *   a self reference.
     */
    load(tests) {
      this.tests.clear();

      for (const [name, value] of tests.entries()) {

        if (typeof (value) === "undefined")
          continue;

        if (!value.script)
          continue;

        this.add(name, tests);
      }

      return this;
    }

    /**
     * Adds a test to this test suite.
     * It will clone the test specification.
     *
     * @param {string} name
     *   the test fixtures name.
     * @param {*} tests
     *   the test definitions.
     *
     * @returns {AbstractTest}
     *   a self reference.
     */
    add(name, tests) {
      // Clone the test description...
      const test = JSON.parse(JSON.stringify(tests.get(name)));

      if (!Array.isArray[test.require])
        test.require = [];

      // ... and extend it...
      test.require = [
        ...this.extend(name, tests),
        ...test.require
      ];

      this.tests.add(
        this.create(name, test));

      return this;
    }

    /**
     * The extends the given test resolving the
     * dependency inheritance.
     *
     * @param {string} name
     *   the test name to be extended.
     * @param {*} tests
     *   the test definition which is used for the lookup.
     *
     * @returns {AbstractTestSuite}
     *   a self reference.
     */
    extend(name, tests) {

      const base = tests.get(name);

      if (!base)
        return [];

      let scripts = [];
      if (base.extend)
        scripts = this.extend(base.extend, tests);

      if (!base.require)
        return scripts;

      for (const item of base.require) {
        scripts.push(item);
      }

      return scripts;
    }

    /**
     * Runs the test suite including all tests.
     *
     * @param {AbstractTestReport} report
     *   the report which should be used to store the test results.
     *
     * @returns {AbstractTestSuite}
     *   a self reference
     */
    async run(report) {

      report.start();

      for (const fixture of this.tests) {
        await fixture.run(report);
      }

      report.stop();

      return this;
    }

  }

  exports.TestCase = TestCase;
  exports.AbstractTestFixture = AbstractTestFixture;
  exports.AbstractTestSuite = AbstractTestSuite;

})(this);
