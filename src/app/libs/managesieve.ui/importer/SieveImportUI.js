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

  /* global bootstrap */
import { SieveTemplate } from "./../utils/SieveTemplate.js";
import { SieveIpcClient } from "./../utils/SieveIpcClient.js";

/**
 * Imports sieve settings from mailers.
 */
class SieveImportUI {

  /**
   * Shows the import account dialog.
   */
  async show() {

    const dialog = await (new SieveTemplate()).load("./importer/account.import.tpl");
    dialog.querySelector(".sieve-import-progress").classList.add("d-none");
    document.querySelector("#ctx").appendChild(dialog);

    // we need to call it on the main thread because we don't have
    // to all the libraries we need right here.
    const accounts = await SieveIpcClient.sendMessage("core", "import-thunderbird");

      const modal = new bootstrap.Modal(dialog);
    await new Promise((resolve) => {

      accounts.forEach(async (account) => {
        const item = await (new SieveTemplate()).load("./importer/account.import.item.tpl");

        item.querySelector(".sieve-import-username").textContent = account["username"];
        item.querySelector(".sieve-import-hostname").textContent = account["hostname"];
        item.querySelector(".sieve-import-name").textContent = account["name"];

        item.querySelector(".sieve-import-source").textContent = "Thunderbird";

        item.querySelector(".sieve-import-btn").addEventListener("click", async () => {

          dialog.querySelector(".sieve-import-items").classList.add("d-none");
          dialog.querySelector(".sieve-import-progress").classList.remove("d-none");

          let account2;
          try {
            account2 = await SieveIpcClient.sendMessage("core", "account-probe", account);
          } catch (ex) {
            alert(`Failed to import ${ex}`);
            resolve(false);

            dialog.querySelector(".sieve-import-items").classList.remove("d-none");
            dialog.querySelector(".sieve-import-progress").classList.add("d-none");
            return;
          }

          // fix me remove modal2 from dom.
          await SieveIpcClient.sendMessage("core", "account-create", account2);
            modal.hide();

          resolve(true);
        });

        dialog.querySelector(".sieve-import-items").appendChild(item);

      });


        modal.show();

        dialog.addEventListener('hidden.bs.modal', () => {
          dialog.parentNode.removeChild(dialog);
          resolve(false);
        });
      });
  }
}

export { SieveImportUI };
