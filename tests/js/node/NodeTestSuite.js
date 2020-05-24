(function (exports) {

  "use strict";

  const { AbstractTestSuite} = require("./../common/AbstractTestSuite.js");
  const { NodeTestFixture} = require("./NodeTestFixture.js");


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
