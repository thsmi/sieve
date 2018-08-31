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
  /**
   * Implements a common and platform independent logging interface.
   * The log level is interpreted as a bit filed with turns logging
   * for the specified scope on and of.
   *
   * The level is concerning scopes and does not diffrentiate between
   * warning, error and info.
   */
  class SieveAbstractLogger {

    /**
     * Creates a new instance
     * @param {String} [prefix]
     *   an optional prefix for this logger.
     */
    constructor(prefix) {
      if (typeof (prefix) === "undefined")
        prefix = "";

      this._level = 0x00;
      this._prefix = "";
    }

    /**
     * Logs the given message to the browser console.
     *
     * @param {String} message
     *   The message which should be logged
     * @param {int} [level]
     *   the log level. If ommited the message will be always logged.
     * @returns {SieveAbstractLogger}
     *   a self reference
     */
    log(message, level) {
      throw new Error("Implement log(" + message + "," + level + ")");
    }


    /**
     * Tests if the loglevel should log.
     *
     * @param {int} level
     *   the level which should be checked.
     * @return {boolean}
     *   true in case the log level is activated otherwise false
     */
    isLoggable(level) {
      if (typeof (level) === "undefined")
        return true;

      return !!(this.level() & level);
    }

    /**
     * Gets and sets the log level to the given bit mask.
     * Note that the loglevel is a bit mask, every bit in the
     * bitmask corresponds to a special logger.
     *
     * In order to activate or deactivate a logger you need to
     * get the level toggle the desired bits and set the new level.
     *
     * @param {int} [level]
     *   the desired loglevel as bit mask.
     * @return {int}
     *   the current log level
     */
    level(level) {
      if (typeof (level) !== "undefined")
        this._level = level;

      return this._level;
    }


    /**
     * @private
     *
     * Padds the given string with leading zeros
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
     * @returns {String}
     *   the current timestamp as string.
     */
    getTimestamp() {

      let date = new Date();
      return this._pad(date.getHours(), TWO_CHARS)
        + ":" + this._pad(date.getMinutes(), TWO_CHARS)
        + ":" + this._pad(date.getSeconds(), TWO_CHARS)
        + "." + this._pad(date.getMilliseconds(), THREE_CHARS);
    }


    /**
     * Gets and sets the loggers prefix. The prefix is appended to every logmessage
     *
     * @param {String} [prefix]
     *   the new prefix.
     * @return {String}
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
