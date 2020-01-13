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

  const { SieveAccount } = require("./SieveAccount.js");
  const { SieveUniqueId } = require("./../utils/SieveUniqueId.js");

  /**
   * Manages the configuration for sieve accounts.
   * It behaves like a directory. Ist just lists the accounts.
   * The inidividual settings are managed by the SieveAccount object
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
    load() {

      const ids = JSON.parse(localStorage.getItem("accounts"));

      this.accounts = {};

      if (!ids)
        return this;

      ids.forEach((id) => {
        this.accounts[id] = new SieveAccount(id);
      });

      return this;
    }

    /**
     * Saves the list of account configurations.
     * @returns {SieveAccounts}
     *   a self reference.
     */
    save() {
      localStorage.setItem("accounts", JSON.stringify([...Object.keys(this.accounts)]));
      return this;
    }

    /**
     * Generates a pseudo unique id.
     * The id is garanteed to be made of alphanumerical characters and dashes.
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
     *  a self reference.
     */
    create(details) {

      // create a unique id;

      const id = this.generateId();

      this.accounts[id] = new SieveAccount(id);

      console.log(Object.keys(this.accounts));

      this.save();

      if (typeof(details) !== "undefined" && details !== null) {
        if ((details.name !== null) && (details.name !== undefined))
          this.accounts[id].getHost().setDisplayName(details.name);
        if ((details.hostname !== null) && (details.hostname !== undefined))
          this.accounts[id].getHost().setHostname(details.hostname);
        if ((details.port !== null) && (details.port !== undefined))
          this.accounts[id].getHost().setPort(details.port);

        if ((details.username !== null) && (details.username !== undefined))
          this.accounts[id].getAuthentication(1).setUsername(details.username);
      }

      return this;
    }

    /**
     * Removes the account including all settings.
     *
     * @param {AccountId} id
     *   the unique id which idendifies the account.
     * @returns {SieveAccounts}
     *   a self reference
     */
    remove(id) {
      // remove the accounts...
      delete this.accounts[id];
      localStorage.removeItem(id);

      // ... as well as the.
      this.save();

      return this;
    }

    /**
     * Returns a list with all accounts.
     * The accounts are returnes as key value pairs (uqique id and Account)
     *
     * @returns { object<string, SieveAccount>}
     *   a list with sieve account.
     */
    getAccounts() {
      this.load();
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
      this.load();
      return this.accounts[id];
    }
  }

  // Require modules need to use export.module
  if (module.exports)
    module.exports.SieveAccounts = SieveAccounts;
  else
    exports.SieveAccounts = SieveAccounts;

})(this);
