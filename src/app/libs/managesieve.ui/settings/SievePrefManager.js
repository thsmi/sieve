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
     * Returns a specific value.
     * @param {string} key
     *   the key which should be returned.
     * @returns {object}
     *   the value or undefined in case it does not exist.
     */
    getValue(key) {
      return localStorage.getItem(`${this.id}.${key}`);
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
      localStorage.setItem(`${this.id}.${key}`, value);
      return this;
    }
  }

  if (typeof(module) !== "undefined" && module && module.exports)
    module.exports.SievePrefManager = SievePrefManager;
  else
    exports.SievePrefManager = SievePrefManager;

})(this);
