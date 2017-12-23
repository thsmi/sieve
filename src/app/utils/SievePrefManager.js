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
  class SievePrefManager {

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
     * Reads and returns all preference values.
     *
     * @returns {Object}
     *   the complete preference structure
     */
    getValues() {
      let prefs = localStorage.getItem(this.id);

      if (prefs === null)
        prefs = "{}";

      return JSON.parse(prefs);
    }

    /**
     * Reads and returns the given preference for the given key as object.
     * @param {String} key
     *   the preference key which should be read.
     * @return {Object}
     *   the key's value.
     */
    getValue(key) {
      return this.getValues()[key];
    }

    /**
     * Sets and persists the given preference.
     *
     * @param {String} key
     *   the prefence key which should be written.
     * @param {Object} value
     *   the key's value.
     * @returns {SievePrefManager}
     *   a self reference.
     */
    setValue(key, value) {
      let prefs = this.getValues();
      prefs[key] = value;

      localStorage.setItem(this.id,JSON.stringify(prefs) );

      return this;
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
     * @param {String} key
     *   the preference's key
     * @param {Boolean} value
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
     * @param {String} key
     *   the preference key
     * @param {String} [fallback]
     *   the fallback value in case the key does not exist.
     * @return {String}
     *   the key's value as string
     */
    getString(key, fallback) {
      let value = this.getValue(key);

      if (typeof (value) === "undefined" || value === null)
        return fallback;

      return ""+value;
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

      value = ""+value;

      this.setValue(key,value);
      return this;
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
      let value = this.getValue(key);

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
     * @param {String} key
     *   the preference's key
     * @param {Integer} value
     *   the integer value which should be set.
     * @return {SievePrefManager}
     *   a self reference.
     */
    setInteger(key, value) {

      value = Number.parseInt(value, 10);

      this.setValue(key,value);

      return this;
    }

  }


  if (module.exports)
    module.exports = SievePrefManager;
  else
    exports.SievePrefManager = SievePrefManager;

})(this);