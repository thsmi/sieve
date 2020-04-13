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

  /* global SieveAbstractAccounts */

  /**
   * @inheritdoc
   */
  class SieveWxAccounts extends SieveAbstractAccounts {

  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAccounts = SieveWxAccounts;
  else
    exports.SieveAccounts = SieveWxAccounts;

})(this);
