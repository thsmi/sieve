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
  class SieveAccountCreateUI {

    /**
     * Shows the import account dialog.
     */
    async show() {
      return await new Promise(async (resolve) => {
        const dialog = await (new SieveTemplateLoader()).load("./accounts/account.create.tpl");
        $("#container").append(dialog);

        dialog.find(".sieve-create-account-btn").click(async () => {

          const account = {
            name : dialog.find(".sieve-create-account-displayname").val(),
            hostname : dialog.find(".sieve-create-account-hostname").val(),
            port : dialog.find(".sieve-create-account-port").val(),
            username : dialog.find(".sieve-create-account-username").val()
          };

          // fix me remove modal2 from dom.
          await SieveIpcClient.sendMessage("core", "account-create", account);
          dialog.modal('hide');
          resolve(true);
        });

        dialog.modal('show')
          .on('hidden.bs.modal', () => {
            dialog.remove();
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
