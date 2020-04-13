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
  /* global SieveAccountUI */
  /* global SieveIpcClient */
  /* global SieveLogger */

  /**
   * A UI renderer for a list of sieve accounts
   **/
  class SieveAbstractAccounts {

    /**
     * Gets an instance to the logger.
     *
     * @returns {SieveLogger}
     *   an reference to the logger instance.
     **/
    getLogger() {
      return SieveLogger.getInstance();
    }

    /**
     * Renders the UI for this component.
     */
    async render() {

      $(".siv-accounts-items").empty();
      this.getLogger().logWidget("Rendering Accounts...");

      const items = await SieveIpcClient.sendMessage("core", "accounts-list");

      for (const item of items) {
        this.getLogger().logWidget(` + Accounts ${item}`);
        await ((new SieveAccountUI(this, item)).render());
      }
    }
  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAbstractAccounts = SieveAbstractAccounts;
  else
    exports.SieveAbstractAccounts = SieveAbstractAccounts;

})(this);
