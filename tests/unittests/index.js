
const { tests } = require("./tests/tests.js");
const { NodeTestSuite } = require("./js/node/NodeTestSuite.js");
const { NodeTestReport } = require("./js/node//NodeTestReport.js");

const { JUnitExporter } = require("./js/exporter/JUnitExporter.js");

const { writeFile } = require('fs').promises;

const EXIT_CODE_ERROR = 1;
const JUNIT_EXPORT_FILE = "./TEST-sieve.xml";

/**
 * The entry point
 */
async function main() {

  const suite = new NodeTestSuite();
  const report = new NodeTestReport("Test");

  await suite.load(tests).run(report);

  await writeFile(JUNIT_EXPORT_FILE, (new JUnitExporter()).export(report));

  report.summary();

  if (report.hasFailed())
    process.exitCode = EXIT_CODE_ERROR;

}

main();
