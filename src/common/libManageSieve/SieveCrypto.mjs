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


// eslint-disable-next-line no-magic-numbers
const HASH_SHA1_LENGTH = 20 * 8;
// eslint-disable-next-line no-magic-numbers
const HASH_SHA256_LENGTH = 32 * 8;
// eslint-disable-next-line no-magic-numbers
const HASH_SHA512_LENGTH = 64 * 8;

const HASH_SHA1 = "SHA-1";
const HASH_SHA256 = "SHA-256";
const HASH_SHA512 = "SHA-512";

const MAX_CHAR_CODE = 255;

const HEX_STRING = 16;
const HEX_PREFIX = -2;

/**
 * Implements a crypto provider which is backed by the web crypto api.
 */
class SieveWebCrypto {

  /**
   * Creates a new crypto wrapper.
   * @param {string} name
   *   the crypto algorithms name.
   */
  constructor(name) {

    if ((name !== HASH_SHA1) && (name !== HASH_SHA256) && (name !== HASH_SHA512))
      throw new Error(`Unknown Hash algorithm ${name}`);

    this.name = name;
  }

  /**
   * Loads the the webcrypto api.
   *
   * Normally it is part of the window object. But in node we need to explicitly
   * import the webcrypto from the crypto module.
   *
   * @returns {webcrypto} a reference to the webcrypto api.
   */
  async getCrypto() {

    if ((typeof(window) !== "undefined") && (window !== null))
      if (typeof(window.crypto) !== 'undefined' && (window.crypto !== null))
        return window.crypto;

    return (await import("crypto")).webcrypto;
  }

  /**
   * Returns the hashing algorithm.
   * In case the algorithm is unknown an exception is thrown.
   *
   * @returns {string}
   *   the hash algorithm
   */
  getCryptoHash() {
    return this.name;
  }

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
   * Converts a byte array into a hex string
   * @param {byte[]} tmp
   *   the byte array which should be converted.
   * @returns {string}
   *   the hex string
   * @abstract
   */
  byteArrayToHexString(tmp) {
    let str = "";
    for (let i = 0; i < tmp.length; i++)
      str += ("0" + tmp[i].toString(HEX_STRING)).slice(HEX_PREFIX);

    return str;
  }

  /**
   * Converts a byte array into a string
   *
   * @param {byte[]} bytes
   *   the byte array which should be converted.
   * @returns {string}
   *   the converted string
   */
  byteArrayToStr(bytes) {
    let result = "";

    if (Array.isArray(bytes) === false)
      throw new Error("Parameter bytes is not a byte array");

    for (let i = 0; i < bytes.length; i++) {
      const byte = String.fromCharCode(bytes[i]);
      if (byte > MAX_CHAR_CODE)
        throw new Error(`Byte Array Invalid: ${byte}`);

      result += byte;
    }

    return result;
  }

  /**
   * Converts a binary string into a byte array.
   *
   * @param {string} str
   *   the string which should be converted.
   * @returns {byte[]}
   *   the converted string in byte array representation
   */
  strToByteArray(str) {
    const result = [];

    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) > MAX_CHAR_CODE)
        throw new Error(`Invalid Characters for Binary String: ${str.charCodeAt(i)}`);

      result.push(str.charCodeAt(i));
    }

    return result;
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

    const crypto = await this.getCrypto();

    // Create the base key to derive from.
    key = await crypto.subtle.importKey(
      "raw", key, "PBKDF2", false, ["deriveBits"]);

    const algorithm = {
      "name": "PBKDF2",
      "hash": this.getCryptoHash(),
      "salt": salt,
      "iterations": parseInt(iterations, 10)
    };

    return new Uint8Array(
      await crypto.subtle.deriveBits(
        algorithm, key, this.getCryptoHashLength()));
  }

  /**
   * Calculates the HMAC keyed hash for the given algorithm.
   *
   * @param {byte[]} key
   *   The key as octet string
   * @param {byte[]|string} bytes
   *   The input string as byte array or string
   * @param {string} [output]
   *   The optional output type. Default to byte array. If set to "hex" the return
   *   value is a hex string
   *
   * @returns {byte[]|string}
   *   the calculated HMAC keyed hash for the given input string. E.g. HMAC-SHA-1 hashes are
   *   always always 20 octets long.
   */
  async HMAC(key, bytes, output) {

    if (!Array.isArray(key) && !(key instanceof Uint8Array))
      key = (new TextEncoder()).encode(key);

    if (!Array.isArray(bytes))
      bytes = (new TextEncoder()).encode(bytes);

    const crypto = await this.getCrypto();

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
   * Calculates the Hash for the given algorithm.
   *
   * @param {bytes[]|string} bytes
   *   The input string as byte array or string
   * @param {string} [output]
   *   The optional output type. Default to byte array. If set to "hex" the return
   *   value is a hex string
   *
   * @returns {byte[]|string}
   *   the calculated hash value for the input string as byte array or hex string.
   */
  async H(bytes, output) {

    if (!Array.isArray(bytes)) {
      // bytes = this.strToByteArray(bytes);
      bytes = (new TextEncoder()).encode(bytes);
    }

    const crypto = await this.getCrypto();

    // this.name is the algorithm.
    const hash = new Uint8Array(await crypto.subtle
      .digest(this.getCryptoHash(), new Uint8Array(bytes)));

    if (typeof (output) !== "undefined" && output === "hex") {
      const rv = this.byteArrayToHexString(hash);
      return rv;
    }

    return [...hash];
  }


  /**
   * Applies the SASLprep profile [RFC4013] of the"stringprep" algorithm
   * [RFC3454] to the given UTF-8 encoded byte array.
   *
   * The resulting byte array is also in UTF-8.
   *
   * When applying SASLprep, "str" is treated as a "stored strings", which
   * means that unassigned Unicode codepoints are prohibited.
   *
   * @param {Uint8Array} data
   *   the string to be normalized
   * @returns {Uint8Array}
   *   the normalized string
   */
  normalize(data) {
    return data;
    /*
    // RFC 4013 and 3454
    C12 -> ""
    B1 -> ""

    str = str.normalize("NFKC");

    // Illegal code points
    C12, C21, C22, C3, C4, C5, C6, C7, C8, C9, A1
    -> throw

    // D1 && D2
    -> throw

    // D1 is allowed only one as first or last character
    */
  }

}

export { SieveWebCrypto as SieveCrypto };
