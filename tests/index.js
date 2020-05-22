
const { tests } = require("./tests/tests.js");
const { TestSuite } = require("./js/NodeSuite.js");

async function main() {
  "use strict";

  const suite = new TestSuite();

  await suite.run(tests);

  console.log("hello");
}

main();
