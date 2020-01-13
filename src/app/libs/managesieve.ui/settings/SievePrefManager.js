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

  const { SieveAbstractPrefManager } = require("./SieveAbstractPrefManager.js");

  /**
   * Manages preferences.
   * It uses the DOM's local storage interface
   */
  class SievePrefManager extends SieveAbstractPrefManager {

    /**
     * Reads and returns all preference values.
     *
     * @returns {object}
     *   the complete preference structure
     */
    getValues() {
      let prefs = localStorage.getItem(this.id);

      if (prefs === null)
        prefs = "{}";

      return JSON.parse(prefs);
    }

    /**
     * Returns a specific value.
     * @param {string} key
     *   the key which should be returned.
     * @returns {object}
     *   the value or undefined in case it does not exist.
     */
    getValue(key) {
      const values = this.getValues();
      return values[key];
    }

    /**
     * Sets and persists the given preference.
     *
     * @param {string} key
     *   the prefence key which should be written.
     * @param {object} value
     *   the key's value.
     * @returns {SievePrefManager}
     *   a self reference.
     */
    setValue(key, value) {
      const prefs = this.getValues();
      prefs[key] = value;

      localStorage.setItem(this.id, JSON.stringify(prefs));

      return this;
    }

    /**
     * @inheritdoc
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
     * @inheritdoc
     */
    setBoolean(key, value) {
      // ensure it is an boolean...
      value = !!value;

      this.setValue(key, value);
      return this;
    }

    /**
     * @inheritdoc
     */
    getString(key, fallback) {
      const value = this.getValue(key);

      if (typeof (value) === "undefined" || value === null)
        return fallback;

      return "" + value;
    }

    /**
     * @inheritdoc
     */
    setString(key, value) {

      value = "" + value;

      this.setValue(key, value);
      return this;
    }

    /**
     * @inheritdoc
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
     * @inheritdoc
     */
    setInteger(key, value) {

      value = Number.parseInt(value, 10);

      this.setValue(key, value);

      return this;
    }
  }

  if (typeof(module) !== "undefined" && module && module.exports)
    module.exports.SievePrefManager = SievePrefManager;
  else
    exports.SievePrefManager = SievePrefManager;

})(this);
