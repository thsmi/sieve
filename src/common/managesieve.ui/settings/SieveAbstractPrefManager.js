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

  /**
   * Manages preferences.
   * It uses the DOM's local storage interface
   */
  class SieveAbstractPrefManager {

    /**
     * Initializes the preference manager.
     *
     * @param {string} id
     *   the preferences unique id.
     */
    constructor(id) {
      this.id = id;
    }

    /**
     * Returns a specific value.
     * @abstract
     *
     * @param {string} key
     *   the key which should be returned.
     * @returns {object}
     *   the value or undefined in case it does not exist.
     */
    getValue(key) {
      throw new Error(`Implement SieveAbstractPrefManager::getValue(${key})`);
    }

    /**
     * Sets and persists the given preference.
     * @abstract
     *
     * @param {string} key
     *   the prefence key which should be written.
     * @param {object} value
     *   the key's value.
     * @returns {SievePrefManager}
     *   a self reference.
     */
    setValue(key, value) {
      throw new Error(`Implement SieveAbstractPrefManager::setValue(${key},${value})`);
    }

    /**
     * Returns the boolean value for the preference.
     *
     * @param {string} key
     *   the preference's key
     * @param {boolean} [fallback]
     *   the fallback value in case the key does not exist.
     * @returns {boolean}
     *   the key's value as boolean
     */
    getBoolean(key, fallback) {
      let value = this.getValue(key);

      if (typeof (value) === "undefined" || value === null)
        return fallback;

      // Parse boolean
      value = !!value;

      if (value)
        return true;

      return false;
    }

    /**
     * Sets a boolean value for the given key.
     *
     * @param {string} key
     *   the preference's key
     * @param {boolean} value
     *   the value which should be set
     * @returns {SievePrefManager}
     *   a self reference
     */
    setBoolean(key, value) {
      // ensure it is an boolean...
      value = !!value;

      this.setValue(key, value);
      return this;
    }

    /**
     * Returns the string value for the preference.
     *
     * @param {string} key
     *   the preference key
     * @param {string} [fallback]
     *   the fallback value in case the key does not exist.
     * @returns {string}
     *   the key's value as string
     */
    getString(key, fallback) {
      const value = this.getValue(key);

      if (typeof (value) === "undefined" || value === null)
        return fallback;

      return `${value}`;
    }

    /**
     * The string which should be set for th preference
     *
     * @param {string} key
     *   the preference key
     * @param {string} value
     *   the key's value as string
     * @returns {SievePrefManager}
     *   a self reference
     */
    setString(key, value) {
      this.setValue(key, `${value}`);
      return this;
    }

    /**
     * Returns the integer value for the preference.
     *
     * @param {string} key
     *   the preference's key
     * @param {int} [fallback]
     *   the fallback value in case the key does not exist.
     * @returns {string}
     *   the key's value as integer
     */
    getInteger(key, fallback) {
      const value = this.getValue(key);

      if (typeof (value) === "undefined" || value === null)
        return fallback;

      if (Number.isInteger())
        return value;

      try {
        return Number.parseInt(value, 10);
      } catch (ex) {
        return fallback;
      }
    }

    /**
     * Sets an integer value for the given key.
     *
     * @param {string} key
     *   the preference's key
     * @param {int} value
     *   the integer value which should be set.
     * @returns {SievePrefManager}
     *   a self reference.
     */
    setInteger(key, value) {

      this.setValue(key, Number.parseInt(value, 10));
      return this;
    }

  }

  if (typeof(module) !== "undefined" && module && module.exports)
    module.exports.SieveAbstractPrefManager = SieveAbstractPrefManager;
  else
    exports.SieveAbstractPrefManager = SieveAbstractPrefManager;

})(this);
