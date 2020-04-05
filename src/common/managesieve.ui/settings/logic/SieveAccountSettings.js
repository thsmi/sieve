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

  const CONFIG_DEBUG_ACCOUNT = "debug";

  /**
   * Manages the accounts common settings.
   */
  class SieveAccountSettings {

    /**
     * Creates a new instance.
     *
     * @param {SieveAccount} account
     *   a reference to the parent sieve account.
     */
    constructor(account) {
      this.account = account;
    }

    /**
     * Gets the log levels for the given account.
     *
     * @returns {int}
     *  the current log level
     */
    async getLogLevel() {
      return await this.account.getConfig().getInteger(CONFIG_DEBUG_ACCOUNT, 0);
    }

    /**
     * Sets the log level for the given account.
     *
     * @param {int} level
     *   the new log level
     *
     * @returns {SieveAccountSettings}
     *   a self reference.
     */
    async setLogLevel(level) {
      await this.account.getConfig().setInteger(CONFIG_DEBUG_ACCOUNT, level);
      return this;
    }

  }

  if (typeof (module) !== "undefined" && module && module.exports) {
    module.exports.SieveAccountSettings = SieveAccountSettings;
  } else {
    exports.SieveAccountSettings = SieveAccountSettings;
  }

})(this);
