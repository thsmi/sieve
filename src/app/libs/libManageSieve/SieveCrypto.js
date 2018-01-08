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

  const { SieveAbstractCrypto } = require("./SieveAbstractCrypto.js");

  const crypto = require('crypto');

  /**
   * A Electron specific crypto implementation.
   */
  class SieveCrypto extends SieveAbstractCrypto {

    /**
     * @inheritdoc
     */
    constructor(name) {
      super(name);
    }

    //TODO implement HMAC, H, Hi
  }

  exports.SieveCrypto = SieveCrypto;

})(module.exports);
