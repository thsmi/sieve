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

(function () {

  "use strict";

  /* global $ */
  /* global SieveAccountsUI */
  /* global SieveImportUI */
  /* global SieveUpdaterUI */

  /**
   * The main entry point for the account view
   * @returns {void}
   */
  async function main() {
    let accounts = new SieveAccountsUI();

    accounts.render();

    $("#sieve-account-import").click(async () => {
      await (new SieveImportUI()).show();
      accounts.render();
    });

    $("#sieve-account-create").click(() => {
      let id = accounts.create();
      // TODO show the settings dialog
    });
  }

  $(document).ready(function () {
    (async () => { await main(); })();
  });

  (new SieveUpdaterUI()).check();

})();


function toHex(tmp) {
  let str = "";

  for (let i = 0; i < tmp.length; i++)
    str += ("0" + tmp.charCodeAt(i).toString(16)).slice(-2);

  return str;
}
