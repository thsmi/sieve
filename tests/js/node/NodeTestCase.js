(function (exports) {

  "use strict";

  if (!exports.net)
    exports.net = {};

  if (!exports.net.tschmid)
    exports.net.tschmid = {};

  if (!exports.net.tschmid.yautt)
    exports.net.tschmid.yautt = {};

  if (!exports.net.tschmid.yautt.test)
    exports.net.tschmid.yautt.test = {};

  exports.net.tschmid.yautt.test.tests = [];


  function logError(message) {
    exports.net.tschmid.yautt.test.log(message, "Error");
  }

  /**
   * Logs the string at trace level
   * @param {string} message
   *   the message to log.
   *;
   */
  function logTrace(message) {
    exports.net.tschmid.yautt.test.log(message, "Trace");
  }


  /**
   * Checks if the actual value is a equals to true.
   *
   * @param {boolean} actual
   *   the actual value which should be tested
   * @param {string} [message]
   *   the message to display in case of a failure.
   *
   */
  function assertTrue(actual, message) {
    this.assertEquals(true, actual, message);
  }

  /**
   * Checks if the actual value is a equals to false.
   *
   * @param {boolean} actual
   *   the actual value which should be tested
   * @param {string} [message]
   *   the message to display in case of a failure.
   *
   */
  function assertFalse(actual, message) {
    this.assertEquals(false, actual, message);
  }

  /**
   * Checks if the actual value matches the expectation.
   * In case it does not it throws an exception.
   *
   * @param {any} expected
   *   the expected value
   * @param {any} actual
   *   the actual value which should be tested
   * @param {string} [message]
   *   the message to display in case of a failure
   *
   */
  function assertEquals(expected, actual, message) {

    if (expected === actual) {
      logTrace(`Assert successful: ${expected}\n`);
      return;
    }

    if (typeof (message) === 'undefined' || message === null)
      message = `Assert failed\nExpected (${expected.length} Bytes): \n${expected}\n\nBut got (${actual.length} Bytes)\n${actual}`;

    throw new Error(`${message}`);
  }

  /**
   * Registers a function which contains a test to run.
   * @param {*} test
   *   the function to call which contains the test.
   *
   */
  function add(test) {


    if (!exports.net.tschmid.yautt.test.tests)
      exports.net.tschmid.yautt.test.tests = [];

    exports.net.tschmid.yautt.test.tests.push(test);
  }

  function run() {

    const tests = exports.net.tschmid.yautt.test.tests;

    if (!tests || !tests.length)
      throw new Error("Empty test configuration");

    for (const test of tests)
      test();
  }

  exports.net.tschmid.yautt.test.logTrace = logTrace;
  exports.net.tschmid.yautt.test.logError = logError;

  exports.net.tschmid.yautt.test.assertEquals = assertEquals;
  exports.net.tschmid.yautt.test.assertTrue = assertTrue;
  exports.net.tschmid.yautt.test.assertFalse = assertFalse;

  exports.net.tschmid.yautt.test.add = add;

  exports.net.tschmid.yautt.test.run = run;

})(this);

