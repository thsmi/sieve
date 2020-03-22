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

  /* global $ */
  /* global SieveAccountUI */
  /* global SieveIpcClient */
  /* global SieveLogger */

  /**
   * A UI renderer for a list of sieve accounts
   **/
  class SieveAccountsUI {

    /**
     * Gets an instance to the logger.
     *
     * @returns {SieveLogger}
     *   an reference to the logger instance.
     **/
    getLogger() {
      return SieveLogger.getInstance();
    }

    /**
     * Renders the UI for this component.
     *
     */
    async render() {

      const items = await SieveIpcClient.sendMessage("core", "accounts-list");

      $(".siv-accounts").empty();
      this.getLogger().logWidget("Rendering Accounts...");

      for (const item of items) {
        this.getLogger().logWidget(` + Accounts ${item}`);
        await ((new SieveAccountUI(this, item)).render());
      }
    }

    /**
     * Removes the account including all settings.
     *
     * @param {SieveAccountUI} account
     *   the account which should be removed.
     *
     */
    async remove(account) {

      const rv = await account.send("account-delete", account.id);

      if (rv)
        await this.render();
    }

    /**
     * Create a new account, and initializes it with default settings.
     *
     * @returns {string}
     *   the accounts unique id.
     */
    async create() {
      const id = await SieveIpcClient.sendMessage("core", "account-create");
      await this.render();

      return id;
    }
  }

  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveAccountsUI;
  else
    exports.SieveAccountsUI = SieveAccountsUI;

})(this);
