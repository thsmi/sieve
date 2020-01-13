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

  class SieveHost /* extends SieveAbstractHost*/ {

    constructor(account) {
      this.account = account;
    }

    /**
     * @inheritdoc
     */
    async getDisplayName() {
      return await browser.sieve.accounts.getPrettyName(this.account.getId());
    }

    /**
     * @inheritdoc
     */
    async getHostname() {
      // TODO remove me...
      return "localhost";
      return await browser.sieve.accounts.getHostname(this.account.getId());
    }

    /**
     * @inheritdoc
     */
    async getPort() {
      return await "4190";
    }
  }


  // Require modules need to use export.module
  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveHost = SieveHost;
  else
    exports.SieveHost = SieveHost;

})(this);
