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

const MIN_SALT_LENGTH = 2;
const MIN_ITERATION_COUNT = 0;

const MAX_CHAR_CODE = 255;

const HEX_STRING = 16;

const HASH_SHA1 = "SHA-1";
const HASH_SHA256 = "SHA-256";
const HASH_SHA512 = "SHA-512";

// eslint-disable-next-line no-magic-numbers
const MAGIC_SALT = [0, 0, 0, 1];


/**
 * Crypto implementations are very browser specific.
 * Which means we need a separate wrapper for each browser.
 */
class SieveAbstractCrypto {

  /**
   * Creates a new crypto wrapper.
   * @param {string} name
   *   the crypto algorithms name.
   */
  constructor(name) {

    if ((name !== HASH_SHA1) && (name !== HASH_SHA256) && (this.name !== HASH_SHA512))
      throw new Error(`Unknown Hash algorithm ${name}`);

    this.name = name;
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
      str += ("0" + tmp[i].toString(HEX_STRING)).slice(-2);

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
   * Calculates the HMAC keyed hash for the given algorithm.
   * @abstract
   *
   * @param {byte[]} key
   *   The key as octet string
   * @param {byte[]|string} bytes
   *   The input string as byte array or string
   * @returns {byte[]}
   *   the calculated HMAC keyed hash for the given input string. E.g. HMAC-SHA-1 hashes are
   *   always always 20 octets long.
   */
  async HMAC(key, bytes) {
    throw new Error(`Implement HMAC Algorithm for ${this.name} with key ${key} and data ${bytes}`);
  }


  /**
   * Calculates the Hash for the given algorithm.
   * @abstract
   *
   * @param {bytes[]|string} bytes
   *   The input string as byte array or string
   * @returns {byte[]}
   *   the calculated hash value for the input string.s
   */
  async H(bytes) {
    throw new Error(`Implement Hashing Algorithm for ${this.name} with data ${bytes}`);
  }

  /**
   * Hi(str, salt, i) is a PBKDF2 [RFC2898] implementation with HMAC() as the
   * pseudorandom function (PRF) and with dkLen == output length of HMAC() == output
   * length of H().
   *
   *  "str" is an octet input string while salt is a random octet string.
   *  "i" is the iteration count, "+" is the string concatenation operator,
   *  and INT(1) is a 4-octet encoding of the integer with the value 1.
   *
   * Hi(str, salt, i):
   *
   *   U1   := HMAC(str, salt + INT(1))
   *   U2   := HMAC(str, U1)
   *   ...
   *   Ui-1 := HMAC(str, Ui-2)
   *   Ui   := HMAC(str, Ui-1)
   *
   *   Hi := U1 XOR U2 XOR ... XOR Ui
   *
   * @param {Uint8Array} key
   *   an octet input string
   * @param {Uint8Array} salt
   *   random octet string
   * @param {int} iterations
   *   iteration count a positive number (>= 1), suggested to be at least 4096
   *
   * @returns {Uint8Array}
   *   the pseudorandom value as byte string
   */
  async Hi(key, salt, iterations) {

    if (!(key instanceof Uint8Array))
      throw new Error("Key not an Uint8Array");

    if (!(salt instanceof Uint8Array))
      throw new Error("Salt not an Uint8Array");

    if (salt.length < MIN_SALT_LENGTH)
      throw new Error("Insufficient salt");

    if (iterations <= MIN_ITERATION_COUNT)
      throw new Error("Invalid Iteration counter");

    salt = new Uint8Array([...salt, ...MAGIC_SALT]);

    salt = await this.HMAC(key, salt);

    const hi = salt;

    while (--iterations) {
      salt = await this.HMAC(key, salt);

      for (let j = 0; j < hi.length; j++)
        hi[j] ^= salt[j];
    }

    return new Uint8Array(hi);
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

export {
  SieveAbstractCrypto
};
