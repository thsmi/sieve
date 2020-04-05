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

// TODO merge with APP most of the code is duplicated

(function (exports) {

  "use strict";

  const CONFIG_ID_GLOBAL = "global";

  /* global browser */
  const { SieveUniqueId } = require("./../../utils/SieveUniqueId.js");
  const { SieveAbstractAccount } = require("./SieveAbstractAccount.js");

  const { SievePrefManager } = require('./SievePrefManager.js');

  /**
   * Manages the configuration for sieve accounts.
   * It behaves like a directory. It just lists the accounts.
   * The individual settings are managed by the SieveAccount object
   *
   * It uses the DOM's local store to persist the configuration data.
   */
  class SieveAccounts {

    /**
     * Creates a new instance
     */
    constructor() {
      this.accounts = {};
    }

    /**
     * Loads the list of accounts configurations.
     *
     * @returns {SieveAccounts}
     *   a self reference.
     */
    async load() {

      const items = await (browser.accounts.list());

      this.accounts = {};

      if (!items)
        return this;

      for (const item of items) {

        if (item.type !== "imap" && item.type !== "pop3")
          continue;

        this.accounts[item.id] = new SieveAbstractAccount(item.id);
      }

      return this;
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
    getAccounts() {
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
      await (new SievePrefManager(CONFIG_ID_GLOBAL)).setInteger("loglevel", level);
      return this;
    }

    /**
     * Gets the global log level.
     *
     * @returns {int}
     *   the log level as integer.
     */
    async getLogLevel() {
      return await (new SievePrefManager(CONFIG_ID_GLOBAL)).getInteger("loglevel", 0);
    }

  }

  // Require modules need to use export.module
  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAccounts = SieveAccounts;
  else
    exports.SieveAccounts = SieveAccounts;

})(this);
