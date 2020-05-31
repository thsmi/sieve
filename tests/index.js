
const { tests } = require("./tests/tests.js");
const { NodeTestSuite } = require("./js/node/NodeTestSuite.js");
const { NodeTestReport } = require("./js/node/NodeTestReport.js");

const { JUnitExporter } = require("./js/exporter/JUnitExporter.js");

const { writeFile } = require('fs').promises;

/**
 * The entry point
 */
async function main() {
  "use strict";

  const suite = new NodeTestSuite();
  const report = new NodeTestReport("Test");

  await suite.load(tests).run(report);

  await writeFile("./TEST-sieve.xml", (new JUnitExporter()).export(report));

  report.summary();

  if (report.hasFailed()) {
    process.exit(1);
  }
}

main();
