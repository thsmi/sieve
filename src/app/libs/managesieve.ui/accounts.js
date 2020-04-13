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

  /* global SieveAccounts */
  /* global SieveUpdaterUI */
  /* global SieveIpcClient */
  /* global SieveLogger */

  /**
   * The main entry point for the account view
   * Called as soon as the DOM is ready.
   */
  async function main() {

    SieveLogger.getInstance().level(
      await SieveIpcClient.sendMessage("core", "settings-get-loglevel"));

    const accounts = new SieveAccounts();
    accounts.render();

    (new SieveUpdaterUI()).check();
  }

  if (document.readyState !== 'loading')
    main();
  else
    document.addEventListener('DOMContentLoaded', () => { main(); }, { once: true });

})();



