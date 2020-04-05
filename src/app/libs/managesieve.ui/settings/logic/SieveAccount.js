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

  const { SieveAbstractAccount } = require("./SieveAbstractAccount.js");

  // const SievePasswordManager = require('./utils/SievePasswordManager.js');

  /**
   * Manages the account specific settings
   */
  class SieveAccount extends SieveAbstractAccount {

    getProxy() {
      return {
        getProxyInfo: function () {
          return null;
        }
      };
    }


  }

  // Require modules need to use export.module
  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAccount = SieveAccount;
  else
    exports.SieveAccount = SieveAccount;

})(this);
