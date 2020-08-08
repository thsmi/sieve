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
import { SieveIpcClient } from "./../utils/SieveIpcClient.js";
import { SieveTemplate } from "./../utils/SieveTemplate.js";

/**
 * Imports sieve settings from mailers.
 */
class SieveAccountCreateUI {

  /**
   * Shows the import account dialog.
   *
   * @returns {boolean}
   *   true in case the dialog as accepted otherwise false.
   */
  async show() {

    const dialog = await (new SieveTemplate())
      .load("./accounts/account.dialog.create.tpl");
    document.querySelector("#ctx").appendChild(dialog);

    return await new Promise((resolve) => {


      const modal = new bootstrap.Modal(dialog);

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
          modal.hide();
          resolve(true);
        });

      modal.show();
      dialog.addEventListener('hidden.bs.modal', () => {
        dialog.parentNode.removeChild(dialog);
        resolve(false);
      });
    });
  }
}

export { SieveAccountCreateUI };
