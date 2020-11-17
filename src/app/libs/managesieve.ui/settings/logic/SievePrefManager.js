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


import { SieveAbstractPrefManager } from "./SieveAbstractPrefManager.js";

/**
 * Manages preferences.
 * It uses the DOM's local storage interface
 */
class SievePrefManager extends SieveAbstractPrefManager {

  /**
   * Returns all the keys contained by this namespace.
   * The keys are returned without any namespace prefix.
   *
   * @returns {Set}
   *   a set with all key names.
   */
  getKeys() {
    const keys = new Set();

    const namespace = `${this.getNamespace()}.`;

    for (let idx = 0; idx < localStorage.length; idx++) {
      const key = localStorage.key(idx);
      if (key.startsWith(namespace))
        keys.add(key.substring(namespace.length));
    }

    return keys;
  }

  /**
   * Clears the complete name space.
   */
  clear() {
    const keys = this.getKeys();

    for (const key of keys)
      localStorage.removeItem(`${this.getNamespace()}.${key}`);
  }

  /**
   * Returns a specific value.
   * @param {string} key
   *   the key which should be returned.
   * @returns {object}
   *   the value or undefined in case it does not exist.
   */
  async getValue(key) {
    return await localStorage.getItem(`${this.getNamespace()}.${key}`);
  }

  /**
   * Sets and persists the given preference.
   *
   * @param {string} key
   *   the preference key which should be written.
   * @param {object} value
   *   the key's value.
   * @returns {SievePrefManager}
   *   a self reference.
   */
  async setValue(key, value) {
    await localStorage.setItem(`${this.getNamespace()}.${key}`, value);
    return this;
  }
}

export { SievePrefManager };
