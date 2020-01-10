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
  /* global SieveAccountCreateUI */

  /**
   * The main entry point for the account view
   */
  $(document).ready(function () {

    const accounts = new SieveAccountsUI();

    accounts.render();

    $("#sieve-account-import").click(async () => {
      await (new SieveImportUI()).show();
      accounts.render();
    });

    $("#sieve-account-create").click(async () => {
      await (new SieveAccountCreateUI().show());
      accounts.render();
    });

    (new SieveUpdaterUI()).check();
  });

})();



