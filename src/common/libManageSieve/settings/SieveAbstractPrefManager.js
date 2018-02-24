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
     * @param {String} id
     *   the preferences unique id.
     */
    constructor(id) {
      this.id = id;
    }

    /**
     * Returns the boolean value for the preference.
     *
     * @param {String} key
     *   the preference's key
     * @param {Boolean} [fallback]
     *   the fallback value in case the key does not exist.
     * @return {Boolean}
     *   the key's value as boolean
     */
    getBoolean(key, fallback) {
      throw new Error("Implement getBoolean(" + key + ", " + fallback + ")");
    }

    /**
     * Sets a boolean value for the given key.
     *
     * @param {String} key
     *   the preference's key
     * @param {Boolean} value
     *   the value which should be set
     * @returns {SievePrefManager}
     *   a self reference
     */
    setBoolean(key, value) {
      throw new Error("Implement setBoolean(" + key + ", " + value + ")");
    }

    /**
     * Returns the string value for the preference.
     *
     * @param {String} key
     *   the preference key
     * @param {String} [fallback]
     *   the fallback value in case the key does not exist.
     * @return {String}
     *   the key's value as string
     */
    getString(key, fallback) {
      throw new Error("Implement getString(" + key + ", " + fallback + ")");
    }

    /**
     * The string which should be set for th preference
     *
     * @param {String} key
     *   the preference key
     * @param {String} value
     *   the key's value as string
     * @returns {SievePrefManager}
     *   a self reference
     */
    setString(key, value) {
      throw new Error("Implement setString(" + key + ", " + value + ")");
    }

    /**
     * Returns the integer value for the preference.
     *
     * @param {String} key
     *   the preference's key
     * @param {Integer} [fallback]
     *   the fallback value in case the key does not exist.
     * @return {String}
     *   the key's value as integer
     */
    getInteger(key, fallback) {
      throw new Error("Implement getInteger(" + key + ", " + fallback + ")");
    }

    /**
     * Sets an integer value for the given key.
     *
     * @param {String} key
     *   the preference's key
     * @param {Integer} value
     *   the integer value which should be set.
     * @return {SievePrefManager}
     *   a self reference.
     */
    setInteger(key, value) {
      throw new Error("Implement setInteger(" + key + ", " + value + ")");
    }

  }

  if (typeof(module) !== "undefined" && module && module.exports)
    module.exports.SieveAbstractPrefManager = SieveAbstractPrefManager;
  else
    exports.SieveAbstractPrefManager = SieveAbstractPrefManager;

})(this);
