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
     *
     * @param {function} callback
     *   the password callback.
     */
    constructor(callback) {
      this.callback = callback;
      this.accounts = {};
    }

    /**
     * Loads the list of accounts configurations.
     *
     * @returns {SieveAccounts}
     *   a self reference.
     */
    load() {

      let ids = JSON.parse(localStorage.getItem("accounts"));

      this.accounts = {};

      if (!ids)
        return this;

      ids.forEach((id) => {
        this.accounts[id] = new SieveAccount(id, this.callback);
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
     * Creates a new account.
     * The new account will be initialized with default and then added to the list of accounts
     *
     * @returns {SieveAccounts}
     *  a self reference.
     */
    create() {

      // create a unique id;
      let id = "" + (new Date).getTime().toString(36) + "-" + Math.random().toString(36).substr(2, 16);

      this.accounts[id] = new SieveAccount(id, this.callback);

      console.log(Object.keys(this.accounts));

      this.save();

      return this;
    }

    /**
     * Removes the account including all settings.
     *
     * @param {AccountId} id
     *   the unique id which idendifies the account.
     * @return {SieveAccounts}
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
     * @returns { Object<string, SieveAccount>}
     *   a list with sieve account.
     */
    getAccounts() {
      return Object.keys(this.accounts);
    }

    /**
     * Returns a specific sieve account
     * @param {string} id
     *   the accounts unique id.
     * @return {SieveAccount}
     *   the sieve account or undefined.
     */
    getAccountById(id) {
      return this.accounts[id];
    }
  }

  // Require modules need to use export.module
  if (module.exports)
    module.exports.SieveAccounts = SieveAccounts;
  else
    exports.SieveAccounts = SieveAccounts;

})(this);