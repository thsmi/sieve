/* eslint-disable no-console */
(function (exports) {

  "use strict";

  // https://raw.githubusercontent.com/windyroad/JUnit-Schema/master/JUnit.xsd

  class JUnitExporter {

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

    export(report) {
      return `<?xml version="1.0" encoding="UTF-8"?>\n${this.exportTestCases(report)}`;
    }

  }

  exports.JUnitExporter = JUnitExporter;

})(this);
