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


import {SieveAbstractCrypto } from "./SieveAbstractCrypto.mjs";

// eslint-disable-next-line no-magic-numbers
const HASH_SHA1_LENGTH = 20 * 8;
// eslint-disable-next-line no-magic-numbers
const HASH_SHA256_LENGTH = 32 * 8;
// eslint-disable-next-line no-magic-numbers
const HASH_SHA512_LENGTH = 64 * 8;

const HASH_SHA1 = "SHA-1";
const HASH_SHA256 = "SHA-256";
const HASH_SHA512 = "SHA-512";


/**
 * Implements a crypto provider which is backed by the web crypto api.
 */
class SieveWebCrypto extends SieveAbstractCrypto {

  /**
   * Returns the hash length in bits.
   *
   * @returns {int}
   *   the hash length in bits
   */
  getCryptoHashLength() {
    if (this.getCryptoHash() === HASH_SHA1)
      return HASH_SHA1_LENGTH;

    if (this.getCryptoHash() === HASH_SHA256)
      return HASH_SHA256_LENGTH;

    if (this.getCryptoHash() === HASH_SHA512)
      return HASH_SHA512_LENGTH;

    throw new Error(`Unknown Hash algorithm ${this.name}`);
  }


  /**
   * Hi() is a PBKDF2 [RFC2898] implementation with HMAC() as the pseudo random
   * function (PRF) and with dkLen == output length of HMAC() == output
   * length of H().
   *
   * @param {Uint8Array} key
   *   the key as byte array
   * @param {Uint8Array} salt
   *   the salt as byte array
   * @param {int} iterations
   *   iteration count a positive number (>= 1), suggested to be at least 4096
   *
   * @returns {Uint8Array}
   *   the pseudorandom value as byte string
   */
  async Hi(key, salt, iterations) {

    if (!(key instanceof Uint8Array))
      throw new Error("Key is not a Byte Array");

    if (!(salt instanceof Uint8Array))
      throw new Error("Salt is not a byte array");

    // Create the base key to derive from.
    key = await crypto.subtle.importKey(
      "raw", key, "PBKDF2", false, ["deriveBits"]);

    const algorithm = {
      "name": "PBKDF2",
      "hash": this.getCryptoHash(),
      "salt": salt,
      "iterations": iterations
    };

    return new Uint8Array(
      await window.crypto.subtle.deriveBits(
        algorithm, key, this.getCryptoHashLength()));
  }

  /**
   * @inheritdoc
   */
  async HMAC(key, bytes, output) {

    if (!Array.isArray(key) && !(key instanceof Uint8Array))
      key = (new TextEncoder()).encode(key);

    if (!Array.isArray(bytes))
      bytes = (new TextEncoder()).encode(bytes);

    key = await crypto.subtle.importKey(
      "raw", new Uint8Array(key),
      { name: "HMAC", hash: { name: this.getCryptoHash() } },
      false, ["sign", "verify"]);

    const signature = new Uint8Array(await crypto.subtle.sign(
      "HMAC", key, new Uint8Array(bytes)));

    if (typeof (output) !== "undefined" && output === "hex") {
      const rv = this.byteArrayToHexString(signature);
      return rv;
    }

    return [...signature];
  }

  /**
   * @inheritdoc
   */
  async H(bytes, output) {

    if (!Array.isArray(bytes)) {
      // bytes = this.strToByteArray(bytes);
      bytes = (new TextEncoder()).encode(bytes);
    }

    // this.name is the algorithm.
    const hash = new Uint8Array(await crypto.subtle
      .digest(this.getCryptoHash(), new Uint8Array(bytes)));

    if (typeof (output) !== "undefined" && output === "hex") {
      const rv = this.byteArrayToHexString(hash);
      return rv;
    }

    return [...hash];
  }
}

export { SieveWebCrypto as SieveCrypto };
