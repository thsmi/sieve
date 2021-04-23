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

// The hash names as they are used the web crypto api.
const HASH_SHA1 = "SHA-1";
const HASH_SHA256 = "SHA-256";
const HASH_SHA512 = "SHA-512";

// Node sadly node uses a slightly different naming scheme.
const NODE_HASH_SHA1 = "SHA1";
const NODE_HASH_SHA256 = "SHA256";
const NODE_HASH_SHA512 = "SHA512";

/**
 * A Electron specific crypto implementation.
 *
 * @deprecated
 * Node implements since version 15.x the web crypto api which makes
 * this class obsolete as soon as the new api is marked as mature.
 * See https://nodejs.org/api/webcrypto.html for more details.
 *
 */
class SieveNodeCrypto extends SieveAbstractCrypto {

  /**
   * @inheritdoc
   */
  getCryptoHash() {

    if (this.name === HASH_SHA1)
      return NODE_HASH_SHA1;

    if (this.name === HASH_SHA256)
      return NODE_HASH_SHA256;

    if (this.name === HASH_SHA512)
      return NODE_HASH_SHA512;

    throw new Error(`Unknown Hash algorithm ${name}`);
  }

  /**
   * Loads the crypto module either as classic commonsjs or as ecma module.
   * @returns {Crypto}
   *   the crypto module.
   */
  async getCrypto() {
    if (typeof(require) !== "undefined")
      return require("crypto");

    return await import("crypto");
  }

  /**
   * @inheritdoc
   */
  async HMAC(key, bytes, output) {

    if (typeof (key) === "undefined" || key === null)
      throw new Error("Invalid key");

    if (Array.isArray(key))
      key = Buffer.from(key);

    if (Array.isArray(bytes))
      bytes = Buffer.from(bytes);

    if (typeof (output) === "undefined" || output === null)
      output = "latin1";

    const rv =
      (await this.getCrypto()).createHmac(this.getCryptoHash(), key)
        .update(bytes)
        .digest(output);

    if (output === "hex")
      return rv;

    return this.strToByteArray(rv);
  }

  /**
   * @inheritdoc
   */
  async H(bytes, output) {

    if (typeof (output) === "undefined" || output === null)
      output = "latin1";

    if (Array.isArray(bytes))
      bytes = Buffer.from(bytes);

    const rv = (await this.getCrypto()).createHash(this.getCryptoHash())
      .update(bytes)
      .digest(output);

    if (output === "hex")
      return rv;

    return this.strToByteArray(rv);
  }

}

export { SieveNodeCrypto as SieveCrypto };
