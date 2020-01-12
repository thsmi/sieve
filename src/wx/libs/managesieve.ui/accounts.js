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

  /**
   * The main entry point for the account view
   */
  async function main() {
    const accounts = new SieveAccountsUI();
    accounts.render();
  }

  $(document).ready(function () {
    (async () => { await main(); })();
  });

})();
