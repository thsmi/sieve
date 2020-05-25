(function (exports) {

  "use strict";

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
        ... this.extend(name, tests),
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

      for (const fixture of this.tests)
        await fixture.run(report);

      return this;
    }

  }

  exports.AbstractTestSuite = AbstractTestSuite;

})(this);
