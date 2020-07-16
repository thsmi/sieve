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


const TWO_CHARS = 2;
const THREE_CHARS = 3;
const BASE_10 = 10;


// eslint-disable-next-line no-magic-numbers
const LOG_UI = (1 << 2);
// eslint-disable-next-line no-magic-numbers
const LOG_I18N = (1 << 3);

const DEFAULT_LEVEL = 0x00;

let instance = null;

/**
 * Implements a common and platform independent logging interface.
 * The log level is interpreted as a bit filed with turns logging
 * for the specified scope on and of.
 *
 * The level is concerning scopes and does not differentiate between
 * warning, error and info.
 */
class SieveLogger {

  /**
   * Creates a new instance
   * @param {int} [level]
   *   the logger level
   *
   */
  constructor(level) {

    if (typeof (level) === "undefined")
      level = DEFAULT_LEVEL;

    this._level = level;
  }

  /**
   * Creates or returns a logger instance.
   * It is guaranteed to be a singleton.
   *
   * @returns {SieveLogger}
   *   the logger instance.
   */
  static getInstance() {
    if (instance === null)
      instance = new SieveLogger();

    return instance;
  }



  /**
   * Logs an ui related message.
   *
   * @param {string} message
   *   the log message
   * @returns {SieveLogger}
   *   a self reference
   */
  logWidget(message) {
    return this.log(message, "Ui", LOG_UI);
  }

  /**
   * Logs a i18n related message.
   *
   * @param {string} message
   *   the log message.
   * @returns {SieveLogger}
   *   a self reference.
   */
  logI18n(message) {
    return this.log(message, "I18n", LOG_I18N);
  }

  /**
   * Logs the given message to the browser console.
   *
   * @param {string} message
   *   the message which should be logged
   * @param {string} prefix
   *   the log messages prefix.
   * @param {int} [level]
   *   the log level. If omitted the message will be always logged.
   * @returns {SieveLogger}
   *   a self reference
   */
  log(message, prefix, level) {

    if (!this.isLoggable(level))
      return this;

    if ((typeof (prefix) === "undefined") || prefix === null)
      prefix = "";

    // eslint-disable-next-line no-console
    console.log(`[${this.getTimestamp()} ${prefix}] ${message}`);
    return this;
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
      if (n < Math.pow(BASE_10, i))
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

}

export { SieveLogger };
