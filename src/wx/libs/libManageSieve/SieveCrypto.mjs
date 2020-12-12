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


import { SieveAbstractCrypto } from "./SieveAbstractCrypto.mjs";

/**
 * Implements a crypto provider which is backed by the web crypto api.
 */
class SieveWebCrypto extends SieveAbstractCrypto {

  /**
   * Returns the hashing implementation for the given name.
   * In case the algorithm is unknown an exception is thrown.
   *
   * @returns {nsICryptoHash}
   *   the Hash type .
   */
  getCryptoHash() {

    if (this.name === "SHA1")
      return "SHA-1";

    if (this.name === "SHA256")
      return "SHA-256";

    if (this.name === "SHA512")
      return "SHA-512";

    throw Error(`Unknown HASH algorithm ${this.name}`);
  }

  /**
   * @inheritdoc
   */
  async HMAC(key, bytes, output) {

    if (!Array.isArray(key))
      key = new TextEncoder().encode(key);

    if (!Array.isArray(bytes))
      bytes = new TextEncoder().encode(bytes);

    key = await crypto.subtle.importKey(
      "raw", new Uint8Array(key),
      { name: "HMAC", hash: {name: this.getCryptoHash()}},
      false, ["sign", "verify"]);

    const signature = crypto.subtle.sign(
      "HMAC", new Uint8Array(key), new Uint8Array(bytes));

    if (typeof (output) !== "undefined" && output === "hex")
      return this.byteArrayToHexString(signature);

    return Array.from(signature);
  }

  /**
   * @inheritdoc
   */
  async H(bytes, output) {

    if (!Array.isArray(bytes)) {
      // bytes = this.strToByteArray(bytes);
      bytes = new TextEncoder().encode(bytes);
    }

    // this.name is the algorithm.
    const digest = await crypto.subtle
      .digest(this.getCryptoHash(), new Uint8Array(bytes));

    if (typeof (output) !== "undefined" && output === "hex")
      return this.byteArrayToHexString(digest);

    return Array.from(digest);
  }

}

export { SieveWebCrypto as SieveCrypto };
