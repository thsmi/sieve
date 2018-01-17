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
  /* global SieveTemplateLoader */
  /* global SieveIpcClient */

  /**
     * Imports sieve settings from mailers.
     */
  class SieveImportUI {

    /**
     * Shows the import account dialog.
     * @returns {void}
     */
    async show() {
      return await new Promise(async (resolve) => {
        let dialog = await (new SieveTemplateLoader()).load("./ui/account/account.import.tpl");
        dialog.find(".sieve-import-progress").hide();
        $("#container").append(dialog);

        // we need to call it on the main thread because we don't have
        // to all the libraries we need right here.
        let accounts = await SieveIpcClient.sendMessage("import-thunderbird");

        for (let account of accounts) {
          let item = await (new SieveTemplateLoader()).load("./ui/account/account.import.item.tpl");

          item.find(".sieve-import-username").text(account["username"]);
          item.find(".sieve-import-hostname").text(account["hostname"]);
          item.find(".sieve-import-name").text(account["name"]);

          item.find(".sieve-import-source").text("Thunderbird");

          item.find(".sieve-import-btn").click(async () => {

            dialog.find(".sieve-import-items").hide();
            dialog.find(".sieve-import-progress").show();

            try {
              account = await SieveIpcClient.sendMessage("account-probe", account);
            } catch (ex) {
              alert("Failed to import"+ ex);
              resolve(false);

              dialog.find(".sieve-import-items").show();
              dialog.find(".sieve-import-progress").hide();
              return;
            }

            // fix me remove modal2 from dom.

            await SieveIpcClient.sendMessage("account-create", account);
            dialog.modal('hide');

            resolve(true);
          });

          dialog.find(".sieve-import-items").append(item);
        }

        dialog.modal('show')
          .on('hidden.bs.modal', () => {
            dialog.remove();
            resolve(false);
          });
      });
    }
  }


  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveImportUI;
  else
    exports.SieveImportUI = SieveImportUI;

})(this);
