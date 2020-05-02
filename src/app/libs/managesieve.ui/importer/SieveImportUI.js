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
     */
    async show() {
      return await new Promise(async (resolve) => {
        const dialog = await (new SieveTemplateLoader()).load("./importer/account.import.tpl");
        dialog.querySelector(".sieve-import-progress").style.display = "none";
        document.querySelector("#ctx").appendChild(dialog);

        // we need to call it on the main thread because we don't have
        // to all the libraries we need right here.
        const accounts = await SieveIpcClient.sendMessage("core", "import-thunderbird");

        for (let account of accounts) {
          const item = await (new SieveTemplateLoader()).load("./importer/account.import.item.tpl");

          item.querySelector(".sieve-import-username").textContent = account["username"];
          item.querySelector(".sieve-import-hostname").textContent = account["hostname"];
          item.querySelector(".sieve-import-name").textContent = account["name"];

          item.querySelector(".sieve-import-source").textContent = "Thunderbird";

          item.querySelector(".sieve-import-btn").addEventListener("click" , async () => {

            dialog.querySelector(".sieve-import-items").style.display = "none";
            dialog.querySelector(".sieve-import-progress").style.display = "";

            try {
              account = await SieveIpcClient.sendMessage("core", "account-probe", account);
            } catch (ex) {
              alert(`Failed to import ${ex}`);
              resolve(false);

              dialog.querySelector(".sieve-import-items").style.display = "";
              dialog.querySelector(".sieve-import-progress").style.display = "none";
              return;
            }

            // fix me remove modal2 from dom.
            await SieveIpcClient.sendMessage("core", "account-create", account);
            $(dialog).modal('hide');

            resolve(true);
          });

          dialog.querySelector(".sieve-import-items").appendChild(item);
        }

        $(dialog).modal('show')
          .on('hidden.bs.modal', () => {
            dialog.parentNode.removeChild(dialog);
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
