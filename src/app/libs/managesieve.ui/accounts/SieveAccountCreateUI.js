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
  /* global SieveTemplate */
  /* global SieveIpcClient */

  /**
   * Imports sieve settings from mailers.
   */
  class SieveAccountCreateUI {

    /**
     * Shows the import account dialog.
     */
    async show() {

      const dialog = await (new SieveTemplate())
        .load("./accounts/account.dialog.create.tpl");
      document.querySelector("#ctx").appendChild(dialog);

      return await new Promise((resolve) => {

        dialog
          .querySelector(".sieve-create-account-btn")
          .addEventListener("click", async () => {

            const account = {
              name: dialog.querySelector(".sieve-create-account-displayname").value,
              hostname: dialog.querySelector(".sieve-create-account-hostname").value,
              port: dialog.querySelector(".sieve-create-account-port").value,
              username: dialog.querySelector(".sieve-create-account-username").value
            };

            // fix me remove modal2 from dom.
            await SieveIpcClient.sendMessage("core", "account-create", account);
            $(dialog).modal('hide');
            resolve(true);
          });

        $(dialog).modal('show')
          .on('hidden.bs.modal', () => {
            dialog.parentNode.removeChild(dialog);
            resolve(false);
          });
      });
    }
  }

  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveAccountCreateUI;
  else
    exports.SieveAccountCreateUI = SieveAccountCreateUI;

})(this);
