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

/**
 * Implements a facade which allows the sandbox to test fixture
 * to be controlled from outside the sandbox
 */
class AbstractSandboxedTestFixture {

  /**
   * Creates a new sand boxed fixture.
   */
  constructor() {
    this.tests = new Map();
  }

  /**
   * Sets a description for this test fixture.
   *
   * @param {string|string[]} lines
   *   the description which should be echoed.
   */
  description(lines) {
    if (!Array.isArray(lines))
      lines = [lines];

    for (const line of lines)
      this.log(line);
  }

  /**
   * Logs a generic log message
   * @abstract
   *
   * @param {string} message
   *   the message
   * @param {string} type
   *   the message type
   */
  log(message, type) {
    throw new Error(`Implement log(${message},${type})`);
  }

  /**
   * Logs the string at trace level
   *
   * @param {string} message
   *   the message to log.
   */
  logTrace(message) {
    this.log(message, "Trace");
  }

  /**
   * Returns a list with all registered test names.
   *
   * @returns {string[]}
   *   a string list with the test case names
   */
  get() {
    return this.tests.keys();
  }

  /**
   * Runs the test case
   *
   * @param {string} [name]
   *   the test case name, if omitted all test cases are run.
   */
  async run(name) {

    if (!this.tests.has(name))
      throw new Error(`No test ${name}`);

    await (this.tests.get(name))(this);
  }

  /**
   * Registers a function which contains a test to run.
   * @param {string} name
   *   the test case name.
   * @param {*} test
   *   the function to call which contains the test.
   *
   */
  add(name, test) {
    this.tests.set(name, test);
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
  assertTrue(actual, message) {
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
  assertFalse(actual, message) {
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
  assertEquals(expected, actual, message) {

    if (expected === actual) {
      this.logTrace(`Assert successful: ${expected}\n`);
      return;
    }

    if (typeof (message) === 'undefined' || message === null)
      message = `Assert failed\nExpected (${expected.length} Bytes): \n${expected}\n\nBut got (${actual.length} Bytes)\n${actual}`;

    throw new Error(`${message}`);
  }

}

export { AbstractSandboxedTestFixture };
