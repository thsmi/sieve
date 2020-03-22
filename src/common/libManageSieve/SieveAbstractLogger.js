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

(function (exports) {

  "use strict";

  const TWO_CHARS = 2;
  const THREE_CHARS = 3;

  // eslint-disable-next-line no-magic-numbers
  const LOG_REQUEST = (1 << 0);
  // eslint-disable-next-line no-magic-numbers
  const LOG_RESPONSE = (1 << 1);
  // eslint-disable-next-line no-magic-numbers
  const LOG_STATE = (1 << 2);
  // eslint-disable-next-line no-magic-numbers
  const LOG_STREAM = (1 << 3);
  // eslint-disable-next-line no-magic-numbers
  const LOG_SESSION_INFO = (1 << 4);

  const DEFAULT_LEVEL = 0;

  /**
   * Implements a common and platform independent logging interface.
   * The log level is interpreted as a bit filed with turns logging
   * for the specified scope on and of.
   *
   * The level is concerning scopes and does not differentiate between
   * warning, error and info.
   */
  class SieveAbstractLogger {

    /**
     * Creates a new instance
     * @param {string} [prefix]
     *   an optional prefix for this logger.
     * @param {int} [level]
     *   the logger level
     *
     */
    constructor(prefix, level) {
      if (typeof (prefix) === "undefined")
        prefix = "";

      if (typeof(level) === "undefined")
        level = DEFAULT_LEVEL;

      this._level = level;
      this._prefix = prefix;
    }

    /**
     * Logs a request related information
     * @param {string} message
     *   the request status to log.
     * @returns {SieveAbstractLogger}
     *   a self reference
     */
    logRequest(message) {
      return this.log(message, LOG_REQUEST);
    }

    /**
     * Logs response related information
     * @param {byte[]} data
     *   the response status to log
     * @returns {SieveAbstractLogger}
     *   a self reference
     */
    logResponse(data) {
      const byteArray = new Uint8Array(data.slice(0, data.length));

      return this.log(
        "Server -> Client\n" + (new TextDecoder("UTF-8")).decode(byteArray),
        LOG_RESPONSE);
    }

    /**
     * Logs state machine information.
     * @param {string} message
     *   the stat information to log.
     * @returns {SieveAbstractLogger}
     *   a self reference
     */
    logState(message) {
      return this.log(message, LOG_STATE);
    }

    /**
     * Dumps raw stream data to the log
     * @param {string} message
     *   the stream information to log.
     * @returns {SieveAbstractLogger}
     *   a self reference
     */
    logStream(message) {
      return this.log(message, LOG_STREAM);
    }

    /**
     * Logs information about the session.
     * @param {string} message
     *   the message to log.
     * @returns {SieveAbstractLogger}
     *   a self reference
     */
    logSession(message) {
      return this.log(message, LOG_SESSION_INFO);
    }

    /**
     * Logs the given message to the browser console.
     *
     * @abstract
     *
     * @param {string} message
     *   The message which should be logged
     * @param {int} [level]
     *   the log level. If omitted the message will be always logged.
     * @returns {SieveAbstractLogger}
     *   a self reference
     */
    log(message, level) {
      throw new Error(`Implement log(${message},${level})`);
    }

    /**
     * Checks if state information should be logged.
     *
     * @returns {boolean}
     *   true in case state information should be logged otherwise false.
     */
    isLevelState() {
      return this.isLoggable(LOG_STATE);
    }

    /**
     * Checks if session information should be logged.
     *
     * @returns {boolean}
     *   true in case session information should be logged otherwise false.
     */
    isLevelSession() {
      return this.isLoggable(LOG_SESSION_INFO);
    }

    /**
     * Tests if the log level should log.
     *
     * @param {int} level
     *   the level which should be checked.
     * @returns {boolean}
     *   true in case the log level is activated otherwise false
     */
    isLoggable(level) {
      if (typeof (level) === "undefined")
        return true;

      return !!(this.level() & level);
    }

    /**
     * Checks if stream data should be logged.
     *
     * @returns {boolean}
     *   true in case the stream data should be logged otherwise false
     */
    isLevelStream() {
      return this.isLoggable(LOG_STREAM);
    }

    /**
     * Checks if request data should be logged.
     *
     * @returns {boolean}
     *   true in case the request data should be logged otherwise false
     */
    isLevelRequest() {
      return this.isLoggable(LOG_REQUEST);
    }

    /**
     * Checks if response data should be logged.
     *
     * @returns {boolean}
     *   true in case the response data should be logged otherwise false
     */
    isLevelResponse() {
      return this.isLoggable(LOG_RESPONSE);
    }

    /**
     * Gets and sets the log level to the given bit mask.
     * Note that the log level is a bit mask, every bit in the
     * bit mask corresponds to a special logger.
     *
     * In order to activate or deactivate a logger you need to
     * get the level toggle the desired bits and set the new level.
     *
     * @param {int} [level]
     *   the desired log level as bit mask.
     * @returns {int}
     *   the current log level
     */
    level(level) {
      if (typeof (level) !== "undefined")
        this._level = level;

      return this._level;
    }


    /**
     * Pads the given string with leading zeros
     * @private
     *
     * @param {string} n
     *   the string which should be padded
     * @param {int} m
     *   the maximum padding.
     *
     * @returns {string}
     *   the padded string
     */
    _pad(n, m) {

      let str = n;

      for (let i = 0; i < m; i++)
        if (n < Math.pow(10, i))
          str = '0' + str;

      return str;
    }

    /**
     * Gets the current time in iso format (hh:mm:ss.SSS)
     *
     * @returns {string}
     *   the current timestamp as string.
     */
    getTimestamp() {

      const date = new Date();
      return this._pad(date.getHours(), TWO_CHARS)
        + ":" + this._pad(date.getMinutes(), TWO_CHARS)
        + ":" + this._pad(date.getSeconds(), TWO_CHARS)
        + "." + this._pad(date.getMilliseconds(), THREE_CHARS);
    }


    /**
     * Gets and sets the loggers prefix. The prefix is appended to
     * every logger message
     *
     * @param {string} [prefix]
     *   the new prefix.
     * @returns {string}
     *   the current prefix.
     */
    prefix(prefix) {

      if (typeof (prefix) !== "undefined")
        this._prefix = prefix;

      return this._prefix;
    }
  }

  exports.SieveAbstractLogger = SieveAbstractLogger;

})(module.exports || this);
