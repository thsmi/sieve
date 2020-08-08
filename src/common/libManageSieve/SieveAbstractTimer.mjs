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
 * Implements an abstract interface for a simple single shot timer.
 */
class SieveAbstractTimer {

  /**
   * Starts the timer. In case the timer is already running it will be restarted
   * @abstract
   *
   * @param {Function} callback
   *   the callback to be invoked when the timer fires.
   * @param {int} ms
   *   the ms after which the timer should fire
   */
  start(callback, ms) {
    throw new Error(`Override SieveAbstractTimer::start(${callback},${ms})`);
  }

  /**
   * Stops the timer. It will fail silently in case the timer is already stopped.
   */
  cancel() {
    throw new Error(`Override SieveAbstractTimer::cancel()`);
  }
}

export { SieveAbstractTimer };
