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

  const MIN_SALT_LENGTH = 2;
  const MIN_ITERATION_COUNT = 0;

  const MAX_CHAR_CODE = 255;

  const HEX_STRING = 16;

  /**
   * Crypto implementations are very browser specific.
   * Which means we need a separate wrapper for each browser.
   */
  class SieveAbstractCrypto {

    /**
     * Creates a new crypto wraper.
     * @param {string} name
     *   the crypto algorithms name.
     */
    constructor(name) {
      this.name = name;
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
        let byte = String.fromCharCode(bytes[i]);
        if (byte > MAX_CHAR_CODE)
          throw new Error("Byte Array Invalid: " + byte);

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
      let result = [];

      for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > MAX_CHAR_CODE)
          throw new Error("Invalid Charaters for Binary String :" + str.charCodeAt(i));

        result.push(str.charCodeAt(i));
      }

      return result;
    }

    /**
    * Calculates the HMAC keyed hash for the given algorithm.
    *
    * @param {byte[]} key
    *   The key as octet string
    * @param {byte[]|string} bytes
    *   The input string as byte array or string
    * @returns {byte[]}
    *   the calculated HAMC keyed hash for the given input string. E.g. HMAC-SHA-1 hashes are
    *   always always 20 octets long.
    */
    HMAC(key, bytes) {
      throw new Error("Implement HMAC Algorithm for " + this.name + " with key " + key + " and data " + bytes);
    }


    /**
     * Calculates the Hash for the given algorithm.
     *
     * @param {bytes[]|string} bytes
     *   The input string as byte array or string
     * @returns {byte[]}
     *   the calculated hash value for the input string.s
     */
    H(bytes) {
      throw new Error("Implement Hashing Algorithm for " + this.name + " with data " + bytes);
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
     * @param {byte[]|string} str
     *   an octet input string
     * @param {byte[]|string} salt
     *   random octet string
     * @param {int} i
     *   iteration count a positiv number (>= 1), suggested to be at least 4096
     *
     * @returns {byte[]}
     *   the pseudorandom value as byte string
     */
    Hi(str, salt, i) {

      if (Array.isArray(str) === false)
        str = this.strToByteArray(str);

      if (Array.isArray(salt) === false)
        salt = this.strToByteArray(salt);

      if (salt.length < MIN_SALT_LENGTH)
        throw new Error("Insufficient salt");

      if (i <= MIN_ITERATION_COUNT)
        throw new Error("Invalid Iteration counter");

      salt.push(0, 0, 0, 1);

      salt = this.HMAC(str, salt);

      let hi = salt;

      while (--i) {
        salt = this.HMAC(str, salt);

        for (let j = 0; j < hi.length; j++)
          hi[j] ^= salt[j];
      }

      return hi;
    }
  }


  exports.SieveAbstractCrypto = SieveAbstractCrypto;

})(module.exports);
