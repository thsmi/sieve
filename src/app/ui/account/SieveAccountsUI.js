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

  /**
     * A UI renderer for a list of sieve accounts
     */
  class SieveAccountsUI {

    /**
     * Renders the UI for this component.
     *
     */
    async render() {

      let items = await SieveIpcClient.sendMessage("accounts-list");

      $(".siv-accounts").empty();
      console.log("Rendering Accounts...");

      items.forEach((element) => {
        console.log(" + Accounts " + element);
        new SieveAccountUI(this, element).render();
      });
    }

    /**
     * Removes the account including all settings.
     *
     * @param {SieveAccountUI} account
     *   the account which should be removed.
     *
     */
    async remove(account) {

      let rv = await account.send("account-delete", account.id);

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
      let id = await SieveIpcClient.sendMessage("account-create");
      await this.render();

      // Fixme show the settings dialog.

      return id;
    }
  }

  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveAccountsUI;
  else
    exports.SieveAccountsUI = SieveAccountsUI;

})(this);
