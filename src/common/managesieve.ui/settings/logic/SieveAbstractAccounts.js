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

  const CONFIG_ID_GLOBAL = "global";
  const CONFIG_KEY_LOG_LEVEL = "loglevel";

  const DEFAULT_LOG_LEVEL = 0;

  const { SieveUniqueId } = require("./../../utils/SieveUniqueId.js");
  const { SievePrefManager } = require('./SievePrefManager.js');
  const { SieveEditorSettings } = require("./SieveEditorSettings.js");

  /**
   * Abstract class which manages sieve accounts.
   */
  class SieveAbstractAccounts {

    /**
     * Creates a new instance
     */
    constructor() {
      this.accounts = {};
    }

    /**
     * Loads the list of accounts configurations.
     * @abstract
     *
     * @returns {SieveAccounts}
     *   a self reference.
     */
    // eslint-disable-next-line require-await
    async load() {
      throw new Error("Implement me");
    }

    /**
     * Generates a pseudo unique id.
     * The id is guaranteed to be made of alphanumerical characters and dashes.
     *
     * @returns {string}
     *   the unique id in string representation.
     */
    generateId() {
      return (new SieveUniqueId()).generate();
    }

    /**
     * Returns a list with all accounts.
     * The accounts are returned as key value pairs (unique id and Account)
     *
     * @returns { object<string, SieveAccount>}
     *   a list with sieve account.
     */
    getAccountIds() {
      return Object.keys(this.accounts);
    }

    /**
     * Returns a specific sieve account
     * @param {string} id
     *   the accounts unique id.
     * @returns {SieveAccount}
     *   the sieve account or undefined.
     */
    getAccountById(id) {
      return this.accounts[id];
    }

    /**
     * Sets the global log level.
     *
     * @param {int} level
     *   the global log level as integer.
     * @returns {SieveAccounts}
     *   a self reference.
     */
    async setLogLevel(level) {
      await (new SievePrefManager(CONFIG_ID_GLOBAL)).setInteger(CONFIG_KEY_LOG_LEVEL, level);
      return this;
    }

    /**
     * Gets the global log level.
     *
     * @returns {int}
     *   the log level as integer.
     */
    async getLogLevel() {
      return await (new SievePrefManager(CONFIG_ID_GLOBAL))
        .getInteger(CONFIG_KEY_LOG_LEVEL, DEFAULT_LOG_LEVEL);
    }

    /**
     * Gets the object managing the editor's default settings.
     *
     * @returns {SieveEditorSettings}
     *   the settings object
     */
    getEditor() {
      return new SieveEditorSettings(new SievePrefManager("editor"));
    }

  }

  // Require modules need to use export.module
  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAbstractAccounts = SieveAbstractAccounts;
  else
    exports.SieveAbstractAccounts = SieveAbstractAccounts;

})(this);
