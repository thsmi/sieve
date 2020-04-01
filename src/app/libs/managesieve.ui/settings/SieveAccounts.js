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
  const CONFIG_KEY_ACCOUNTS = "accounts";
  const CONFIG_KEY_LOGLEVEL = "loglevel";

  const { SieveLogger } = require("./../utils/SieveLogger.js");

  const { SieveAccount } = require("./SieveAccount.js");
  const { SieveUniqueId } = require("./../utils/SieveUniqueId.js");

  const { SievePrefManager } = require('./SievePrefManager.js');


  /**
   * Manages the configuration for sieve accounts.
   * It behaves like a directory. Ist just lists the accounts.
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

      const items = await (new SievePrefManager(CONFIG_ID_GLOBAL)).getComplexValue(CONFIG_KEY_ACCOUNTS, []);

      const accounts = {};

      SieveLogger.getInstance().level(await this.getLogLevel());

      if (!items)
        return this;

      for (const item of items) {
        // Recreate the accounts only when needed...
        if (this.accounts[item])
          accounts[item] = this.accounts[item];
        else
          accounts[item] = new SieveAccount(item);
      }

      this.accounts = accounts;
      return this;
    }

    /**
     * Saves the list of account configurations.
     *
     * @returns {SieveAccounts}
     *   a self reference.
     */
    async save() {
      await (new SievePrefManager(CONFIG_ID_GLOBAL)).setComplexValue(CONFIG_KEY_ACCOUNTS, [...Object.keys(this.accounts)]);
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
     * Creates a new account.
     * The new account will be initialized with default and then added to the list of accounts
     *
     * @param {object} [details]
     *   the accounts details like the name, hostname, port and username as key value pairs.
     *
     * @returns {SieveAccounts}
     *   a self reference.
     */
    async create(details) {

      // create a unique id;

      const id = this.generateId();

      this.accounts[id] = new SieveAccount(id);

      await this.save();

      if (typeof (details) === "undefined" || details === null)
        return this;

      if ((details.hostname !== null) && (details.hostname !== undefined))
        await (await this.accounts[id].getHost()).setHostname(details.hostname);

      if ((details.port !== null) && (details.port !== undefined))
        await (await this.accounts[id].getHost()).setPort(details.port);

      if ((details.username !== null) && (details.username !== undefined))
        await (await this.accounts[id].getAuthentication(1)).setUsername(details.username);

      if ((details.name !== null) && (details.name !== undefined))
        await (await this.accounts[id].getHost()).setDisplayName(details.name);

      return this;
    }

    /**
     * Removes the account including all settings.
     *
     * @param {AccountId} id
     *   the unique id which identifies the account.
     * @returns {SieveAccounts}
     *   a self reference
     */
    async remove(id) {
      // remove the accounts...
      delete this.accounts[id];
      // ... an persist it.
      await this.save();

      return this;
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
     *
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
      await (new SievePrefManager(CONFIG_ID_GLOBAL)).setInteger(CONFIG_KEY_LOGLEVEL, level);
      return this;
    }

    /**
     * Gets the global log level.
     *
     * @returns {int}
     *   the log level as integer.
     */
    async getLogLevel() {
      return await (new SievePrefManager(CONFIG_ID_GLOBAL)).getInteger(CONFIG_KEY_LOGLEVEL, 0);
    }
  }

  // Require modules need to use export.module
  if (module.exports)
    module.exports.SieveAccounts = SieveAccounts;
  else
    exports.SieveAccounts = SieveAccounts;

})(this);
