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
    HMAC(key, bytes, output) {

      if (typeof(key) === "undefined" || key === null)
        throw new Error("Invalid key");

      if (Array.isArray(key))
        key = Buffer.from(key);

      if (Array.isArray(bytes))
        bytes = Buffer.from(bytes);

      if (typeof(output) === "undefined" || output === null)
        output = "latin1";

      const rv = crypto
        .createHmac(this.name, key)
        .update(bytes)
        .digest(output);

      if (output === "hex")
        return rv;

      return this.strToByteArray(rv);
    }

    /**
     * @inheritdoc
     */
    H(bytes, output) {

      if (typeof(output) === "undefined" || output === null)
        output = "latin1";

      if (Array.isArray(bytes))
        bytes = Buffer.from(bytes);

      const rv = crypto.createHash(this.name)
        .update(bytes)
        .digest(output);

      if (output === "hex")
        return rv;

      return this.strToByteArray(rv);
    }

  }

  exports.SieveCrypto = SieveCrypto;

})(module.exports);
