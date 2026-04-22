/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

const ONCE = 1;

/**
 * A simplistic mocking framework.
 */
class Mock {

  /**
   * Adds a new mocked function to the mock object.
   *
   * @param {object} mock
   *   the mock object to which the new functions should be added.
   * @param {string} name
   *   the new methods name.
   * @param {any} [result]
   *   the result to be returned when the mocked function is called.
   *   if omitted the mock will return undefined.
   */
  returns(mock, name, result) {
    mock[`##${name}`] = 0;
    mock[name] = function() {
      mock[`##${name}`]++;
      return result;
    };
  }

  /**
   * Defines an argument list used in the expect method.
   *
   * @param  {...any} expected
   *   the arguments which are expected on the call.
   *
   * @returns {boolean}
   *   true in case the arguments match.
   */
  arguments(...expected) {
    return function(...args) {

      if (args.length !== expected.length)
        throw new Error(`Expected ${expected.length} arguments but got ${args.length}`);

      if (!args.every((value, index) => { return value === expected[index]; }))
        throw new Error(`Expected arguments ${expected} arguments but got ${args}`);

      return true;
    };
  }

  /**
   * Adds a hook to the callback method which checks if it is called with the
   * correct arguments. The check is performed by the callback method.
   *
   * @param {object} mock
   *   the mock object.
   * @param {string} name
   *   the mock methods name.
   * @param {Function} expected
   *   a callback function which is used to check if the arguments are matching.
   */
  expects(mock, name, expected) {
    if (!mock[name])
      mock[name] = this.returns(mock, name);

    const old = mock[name];
    mock[name] = (...args) => {
      if (!expected(...args))
        throw new Error("Got unexpected arguments.");

      return old(...args);
    };
  }

  /**
   * Checks if a mocked method was invoked for the given number of times.
   *
   * @param {object} mock
   *   the mock object.
   * @param {string} name
   *   the mock methods name.
   * @param {number} [times]
   *   the expected number of calls.
   */
  verify(mock, name, times) {
    if (typeof (times) === "undefined" || times === null)
      times = ONCE;

    const count = mock[`##${name}`];

    if (count === undefined)
      throw new Error(`Method ${name} never called`);

    if (count !== times)
      throw new Error(`Expected ${times} calls to ${name} but got ${times}`);
  }
}

export { Mock };
