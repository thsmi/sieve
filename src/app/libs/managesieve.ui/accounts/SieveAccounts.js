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
  /* global SieveAbstractAccounts */
  /* global SieveIpcClient */
  /* global SieveTemplateLoader */

  /* global SieveImportUI */
  /* global SieveAccountCreateUI */

  /**
   * A UI renderer for a list of sieve accounts
   **/
  class SieveAppAccounts extends SieveAbstractAccounts {

    /**
     * @inheritdoc
     */
    async render() {

      if ($(".siv-accounts-items").length === 0) {
        $(".siv-accounts").append(
          await (new SieveTemplateLoader()).load("./accounts/accounts.tpl"));

        document.getElementById("sieve-account-import")
          .addEventListener("click", async () => {
            await (new SieveImportUI()).show();
            this.render();
          });

        document
          .getElementById("sieve-account-create")
          .addEventListener("click", async () => {
            await (new SieveAccountCreateUI().show());
            this.render();
          });
      }

      super.render();
    }

    /**
     * Removes the account including all settings.
     *
     * @param {SieveAccountUI} account
     *   the account which should be removed.
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

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAccounts = SieveAppAccounts;
  else
    exports.SieveAccounts = SieveAppAccounts;

})(this);
