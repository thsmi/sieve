
const { tests } = require("./tests/tests.js");
const { NodeTestSuite } = require("./js/node/NodeTestSuite.js");
const { NodeTestReport } = require("./js/node/NodeTestReport.js");

/**
 * The entry point
 */
async function main() {
  "use strict";

  const suite = new NodeTestSuite();
  const report = new NodeTestReport();

  await suite.load(tests).run(report);

  if (report.getStatus() !== 1)
    process.exit(1);
}

main();
