(function (exports) {

  "use strict";

  // Suite
  // Fixture
  // Case

  class AbstractTestSuite {

    /**
     * Creates a new instance
     */
    constructor() {
      this.tests = new Set();
    }

    logTrace(message) {
      this.log(message, "Trace");
    }

    logError(message) {
      this.log(message, "Error");
    }

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
     *
     * @param {string} name
     * @param {*} tests
     * @returns {AbstractTest}
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
    }

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
