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

  /* global browser */
  const { SieveAbstractAccount } = require("./SieveAbstractAccount.js");
  const { SieveAbstractAccounts } = require("./SieveAbstractAccounts.js");


  /**
   * Manages the configuration for sieve accounts.
   * It queries thunderbird's account and extracts all needed information.
   *
   * Global settings are stored in the addons persistence.
   */
  class SieveAccounts extends SieveAbstractAccounts{

    /**
     * @inheritdoc
     */
    async load() {

      const items = await (browser.accounts.list());

      const accounts = {};

      if (!items)
        return this;

      for (const item of items) {

        if (item.type !== "imap" && item.type !== "pop3")
          continue;

        accounts[item.id] = new SieveAbstractAccount(item.id);
      }

      this.accounts = accounts;
      return this;
    }

  }

  // Require modules need to use export.module
  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAccounts = SieveAccounts;
  else
    exports.SieveAccounts = SieveAccounts;

})(this);
