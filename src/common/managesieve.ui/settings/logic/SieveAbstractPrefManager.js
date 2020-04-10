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
   */
  class SieveAbstractPrefManager {

    /**
     * Initializes the preference manager.
     *
     * @param {string} [namespace]
     *   the optional preferences namespace.
     */
    constructor(namespace) {
      if ((typeof(namespace) === "undefined") || (namespace === null))
        namespace = "";

      this.namespace = namespace;
    }

    /**
     * Returns the namespace which is added to all preferences
     *
     * @returns {string}
     *   the prefix as string.
     */
    getNamespace() {
      return this.namespace;
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
    // eslint-disable-next-line require-await
    async getValue(key) {
      throw new Error(`Implement SieveAbstractPrefManager::getValue(${key})`);
    }

    /**
     * Sets and persists the given preference.
     * @abstract
     *
     * @param {string} key
     *   the preference key which should be written.
     * @param {object} value
     *   the key's value.
     * @returns {SievePrefManager}
     *   a self reference.
     */
    // eslint-disable-next-line require-await
    async setValue(key, value) {
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
    async getBoolean(key, fallback) {
      const value = await this.getValue(key);

      if (typeof (value) === "undefined" || value === null)
        return fallback;

      // Parse boolean
      if ((value === true) || (value === "true"))
        return true;

      if ((value === false) || (value === "false"))
        return false;

      return fallback;
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
    async setBoolean(key, value) {
      // ensure it is an boolean...
      value = !!value;

      await this.setValue(key, value);
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
    async getString(key, fallback) {
      const value = await this.getValue(key);

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
    async setString(key, value) {
      await this.setValue(key, `${value}`);
      return this;
    }

    /**
     * Returns the integer value for the preference.
     *
     * @param {string} key
     *   the preference's key
     * @param {int} [fallback]
     *   the fallback value in case the key does not exist or is not a number.
     * @returns {string}
     *   the key's value as integer
     */
    async getInteger(key, fallback) {

      let value = await this.getValue(key);

      if (typeof (value) === "undefined" || value === null || Number.isNaN(value))
        return fallback;

      if (Number.isInteger(value))
        return value;

      try {
        value = Number.parseInt(value, 10);
      } catch (ex) {
        return fallback;
      }

      if (Number.isNaN(value))
        return fallback;

      return value;
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
    async setInteger(key, value) {
      await this.setValue(key, Number.parseInt(value, 10));
      return this;
    }

    /**
     * Saves a complex value like an object for the given key.
     * The object needs to be serializable to a json string.
     *
     * @param {string} key
     *   the preference's key
     * @param {object} value
     *   the complex value which should be saved.
     * @returns {SievePrefManager}
     *   a self reference.
     */
    async setComplexValue(key, value) {
      await this.setValue(key, JSON.stringify(value));
      return this;
    }

    /**
     * Returns the complex value for the given key.
     *
     * @param {string} key
     *   the preference's key.
     * @param {object} fallback
     *   the fallback value in case the key does not exist.
     * @returns {object}
     *   the key's complex value.
     */
    async getComplexValue(key, fallback) {
      const value = await this.getValue(key);

      if (typeof (value) === "undefined" || value === null)
        return fallback;

      try {
        return JSON.parse(value);
      } catch (ex) {
        return fallback;
      }
    }

  }

  if (typeof(module) !== "undefined" && module && module.exports)
    module.exports.SieveAbstractPrefManager = SieveAbstractPrefManager;
  else
    exports.SieveAbstractPrefManager = SieveAbstractPrefManager;

})(this);
