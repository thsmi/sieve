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

  /* global Components */

  const { SieveAbstractCrypto } = require("./SieveAbstractCrypto.js");

  /**
   * A Mozilla specific crypto implementation.
   */
  class SieveMozCrypto extends SieveAbstractCrypto {

    /**
     * Returns the HMAC implementation for the given name.
     * In case the algorithm is unknown an exception is thrown.
     *
     * @returns {nsICryptoHMAC}
     *   the HMAC type.
     */
    getCryptoHMAC() {

      if (this.name === "SHA1")
        return Components.interfaces.nsICryptoHMAC.SHA1;

      if (this.name === "SHA256")
        return Components.interfaces.nsICryptoHMAC.SHA256;

      if (this.name === "MD5")
        return Components.interfaces.nsICryptoHMAC.MD5;

      throw Error(`Unknown HMAC algorithm ${this.name}`);
    }

    /**
     * Returns the hashing implementation for the given name.
     * In case the algorithm is unknown an exception is thrown.
     *
     * @returns {nsICryptoHash}
     *   the Hash type .
     */
    getCryptoHash() {
      if (this.name === "SHA1")
        return Components.interfaces.nsICryptoHash.SHA1;

      if (this.name === "SHA256")
        return Components.interfaces.nsICryptoHash.SHA256;

      if (this.name === "MD5")
        return Components.interfaces.nsICryptoHash.MD5;

      throw Error(`Unknown HASH algorithm ${this.name}`);
    }

    /**
     * @inheritdoc
     */
    HMAC(key, bytes, output) {

      if (typeof(key) === "undefined" || key === null)
        throw new Error("Invalid key");

      // Mozilla's api is odd. This means we need some magic here
      // The salt has to be a string while the data needs to be an byte array

      if (Array.isArray(bytes) === false)
        bytes = this.strToByteArray(bytes);

      if (Array.isArray(key) === true)
        key = this.byteArrayToStr(key);

      const crypto = Components.classes["@mozilla.org/security/hmac;1"]
        .createInstance(Components.interfaces.nsICryptoHMAC);
      const keyObject = Components.classes["@mozilla.org/security/keyobjectfactory;1"]
        .getService(Components.interfaces.nsIKeyObjectFactory)
        .keyFromString(Components.interfaces.nsIKeyObject.HMAC, key);

      crypto.init(this.getCryptoHMAC(), keyObject);
      crypto.update(bytes, bytes.length);

      const rv = this.strToByteArray(crypto.finish(false));

      if (typeof (output) !== "undefined" && output === "hex")
        return this.byteArrayToHexString(rv);

      return rv;
    }

    /**
     * @inheritdoc
     */
    H(bytes, output) {

      if (Array.isArray(bytes) === false)
        bytes = this.strToByteArray(bytes);

      const crypto = Components.classes["@mozilla.org/security/hash;1"]
        .createInstance(Components.interfaces.nsICryptoHash);

      crypto.init(this.getCryptoHash());
      crypto.update(bytes, bytes.length);

      const rv = this.strToByteArray(crypto.finish(false));

      if (typeof (output) !== "undefined" && output === "hex")
        return this.byteArrayToHexString(rv);

      return rv;
    }

  }

  exports.SieveCrypto = SieveMozCrypto;

})(module.exports);
