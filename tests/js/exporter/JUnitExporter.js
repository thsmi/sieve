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


  /**
   * Exports a report in the JUnit Format. The format details can be found at:
   * https://raw.githubusercontent.com/windyroad/JUnit-Schema/master/JUnit.xsd
   *
   * It is a poor mans xml implementation.
   */
  class JUnitExporter {

    /**
     * Exports a test case into a xml fragment in junit log format.
     *
     * @param {TestCaseReport} report
     *   the report to be exported
     * @returns {string}
     *   the xml fragment as string
     */
    exportTestCase(report) {

      const name = `name="${report.getName()}"`;
      const time = `time="${report.getDuration()}"`;

      const attributes = `${name} ${time}`;

      let errors = "";
      if (report.hasErrors())
        errors = `\n     <error>Something</error>\n`;

      let failures = "";
      if (report.hasFailures())
        failures = `\n     <failure>Something</failure>\n`;

      return `    <testcase ${attributes}>${errors}${failures}</testcase>\n`;
    }

    /**
     * Exports a test fixture including all contained test cases into a
     * xml fragment.
     *
     * @param {TestFixtureReport} report
     *   the report to be exported
     * @returns {string}
     *   the xml fragment as string
     */
    exportTestSuite(report) {

      const failures = `failures="${report.getFailures()}"`;
      const name = `name="${report.getName()}"`;
      const tests = `tests="${report.getReports().length}"`;
      const time = `time="${report.getDuration()}"`;

      const attributes = `${failures} ${name} ${tests} ${time}`;

      let testcases = "";
      for (const subReport of report.getReports())
        testcases += this.exportTestCase(subReport);

      return `  <testsuite ${attributes}>\n${testcases}  </testsuite>\n\n`;

      // system-out
      // system-err
    }

    /**
     * Exports a test suite including all fixtures and test cases into a
     * xml fragment.
     *
     * @param {TestSuiteReport} report
     *   the report to be exported
     * @returns {string}
     *   the xml fragment as string
     */
    exportTestCases(report) {
      let suites = "";

      for (const subReport of report.getReports())
        suites += this.exportTestSuite(subReport);

      const time = `time="${report.getDuration()}"`;
      const name = `name="${report.getName()}"`;
      const tests = `tests=""`;
      const errors = `errors=""`;
      const failures = `failures=""`;

      const attributes = `${time} ${name} ${tests} ${errors} ${failures}`;

      return `<testsuites ${attributes} >\n${suites}\n</testsuites>\n`;
    }

    /**
     * Exports the test suite including all fixtures and test cases into
     * the junit xml report format.
     *
     * @param {TestSuiteReport} report
     *   the report to be exported
     *
     * @returns {string}
     *   the xml as string
     */
    export(report) {
      return `<?xml version="1.0" encoding="UTF-8"?>\n${this.exportTestCases(report)}`;
    }

  }

  exports.JUnitExporter = JUnitExporter;

})(this);
