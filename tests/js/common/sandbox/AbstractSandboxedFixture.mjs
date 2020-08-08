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
    this.signal("Ready");
  }

  /**
   * Send a signal to the sandbox owner.
   *
   * @param {string} type
   *   the message type
   * @param {object} data
   *   the data to be send
   */
  send(type, data) {
    throw new Error(`Implement send(${type}, ${data})`);
  }

  /**
   * Send a signal to the sandbox owner.
   *
   * @param {string} type
   *   the signal's message type
   * @param {object} data
   *   the data to be send
   */
  signal(type, data = {}) {
    this.send(`${type}Signal`, data);
  }

  /**
   * Sends a response message to the sandbox owner.
   *
   * @param {string} type
   *   the response messages type.
   * @param {object} data
   *   the data to be send
   */
  response(type, data) {
    this.send(`${type}Resolve`, data);
  }

  /**
   * Sends an error response to the sandbox owner.
   *
   * @param {string} type
   *   the error messages type.
   * @param {object} data
   *   the data to be send
   */
  error(type, data) {
    this.send(`${type}Reject`, data);
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
   *
   * @param {string} message
   *   the log message
   * @param {string} level
   *   the log level
   */
  log(message, level) {
    this.signal("Log", { message: message, level: level });
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

  /**
   * Dispatches the incoming ipc message to the handler and
   * returns the result.
   *
   * It will also signal exceptions to the sender.
   *
   * @param {string} type
   *   the message type as string
   * @param {Function} handler
   *   the message handler which is used to process the message.
   */
  async dispatchMessage(type, handler) {

    try {
      const result = await handler();
      this.response(type, result);
    } catch (ex) {
      this.error(type, { message: ex.message, stack: ex.stack} );
    }
  }

  /**
   * Called when a new ipc message arrives.
   *
   * @param {string} msg
   *   the event for the ipc message
   */
  onMessage(msg) {

    msg = JSON.parse(msg);

    if (msg.type === "Ready") {
      this.signal("ReadySignal");
      return;
    }

    if (msg.type === "ImportScript") {
      this.dispatchMessage(msg.type, async () => { return await this.require(msg.payload); });
      return;
    }

    if (msg.type === "GetTests") {
      this.dispatchMessage(msg.type, async () => {
        return Array.from(await this.get());
      });
      return;
    }

    if (msg.type === "RunTest") {
      this.dispatchMessage(msg.type, async () => { return await this.run(msg.payload); });
      return;
    }
  }

}

export { AbstractSandboxedTestFixture };
