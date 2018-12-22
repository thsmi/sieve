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

  /* global Components */
  /* global Services */

  "use strict";

  Components.utils.import("resource://gre/modules/Services.jsm");

  let {SieveAbstractPrefManager} = require("./settings/SieveAbstractPrefManager.js");

  /**
   * Manages preferences.
   * It uses the DOM's local storage interface
   */
  class SievePrefManager extends SieveAbstractPrefManager {

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

      if (!Services.prefs.prefHasUserValue(this.id + "." + key))
        return fallback;

      let value = Services.prefs.getBoolPref(this.id + "." + key);

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

      Services.prefs.setBoolPref(this.id + "." + key, value);
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

      if (!Services.prefs.prefHasUserValue(this.id + "." + key))
        return fallback;

      let value = Services.prefs.getCharPref(this.id + "." + key);

      if (typeof (value) === "undefined" || value === null)
        return fallback;

      return "" + value;
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
      Services.prefs.setCharPref(this.id + "." + key, "" + value);
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
      if (!Services.prefs.prefHasUserValue(this.id + "." + key))
        return fallback;

      let value = Services.prefs.getIntPref(this.id + "." + key);

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

      value = Number.parseInt(value, 10);

      Services.prefs.setIntPref(this.id + "." + key, value);
      return this;
    }

  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SievePrefManager = SievePrefManager;
  else
    exports.SievePrefManager = SievePrefManager;

})(this);
