// Create the namespace...

// Our server is implemented within an anonymous method...

(function (exports) {

  "use strict";

  /* global AbstractTestSuite */
  /* global BrowserTestFixture */

  /**
   * Implements a test suite which can be run inside a browser.
   */
  class BrowserTestSuite extends AbstractTestSuite {

    /**
     * @inheritdoc
     */
    create(name, test) {
      return new BrowserTestFixture(name, test);
    }

  }

  exports.BrowserTestSuite = BrowserTestSuite;

})(this);
