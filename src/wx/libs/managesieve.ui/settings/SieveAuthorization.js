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

  // const { SieveAbstractAuthorization } = require("./settings/SieveAbstractAuthorization.js");

  class SieveAuthorization /*extends SieveAbstractAuthorization*/ {

    constructor(account) {
      this.account = account;
    }

    /**
     * @inheritdoc
     */
    async getUsername() {
      return await browser.sieve.accounts.getUsername(this.account.getId());
    }

  }

  // Require modules need to use export.module
  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAuthorization = SieveAuthorization;
  else
    exports.SieveAuthorization = SieveAuthorization;

})(this);
