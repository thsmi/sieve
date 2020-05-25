(function (exports) {

  "use strict";

  const { AbstractTestSuite} = require("./../common/AbstractTestSuite.js");
  const { NodeTestFixture} = require("./NodeTestFixture.js");

  /**
   * Adapts the test fixture to a browser based runtime environment.
   */
  class NodeTestSuite extends AbstractTestSuite {

    /**
     * @inheritdoc
     */
    create(name, test) {
      return new NodeTestFixture(name, test);
    }
  }

  exports.NodeTestSuite = NodeTestSuite;

})(module.exports || this);
