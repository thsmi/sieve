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

/**
 * Implements a binary base64 encoder.
 * We can not use btoa as is does not support UTF-8
 */
class SieveAbstractBase64Encoder {

  /**
   * Creates a new Encoder instance.
   *
   * @param {Uint8Array|string} decoded
   *   the data to be encoded. Either an byte array or an UTF8 String
   */
  constructor(decoded) {
    this.decoded = decoded;
  }

  /**
   * Encodes the data into base 64 and returns a byte array.
   *
   * @returns {Uint8Array}
   *   the encoded data as byte array
   *
   * @abstract
   */
  toArray() {
    throw new Error("Implement SieveAbstractBase64Encoder");
  }

  /**
   * Encodes the data into base64 and returns a string.
   *
   * @returns {string}
   *   the encoded data as string
   *
   * @abstract
   */
  toUtf8() {
    throw new Error("Implement SieveAbstractBase64Encoder");
  }
}

/**
 * Implements a binary base64 decoded, due to historic reasons
 * browser only support decoding UTF-16 and not UTF-8.
 *
 * Node uses a Buffer for decoding.
 */
class SieveAbstractBase64Decoder {
  /**
   * Creates a new decoder instance
   *
   * @param {string | Uint8Array} encoded
   *   the encoded string which should be decoded
   */
  constructor(encoded) {
    this.encoded = encoded;
  }

  /**
   * Decodes the base64 data into a raw array
   *
   * @returns {Uint8Array}
   *   the output as raw array.
   *
   * @abstract
   */
  toArray() {
    throw new Error(`Implement SieveAbstractBase64Decoder::raw()`);
  }

  /**
   * Decodes the base64 array into a UTF8 String
   *
   * @returns {string}
   *   the decoded array as UTF8 string
   */
  toUtf8() {
    return (new TextDecoder("UTF-8")).decode(this.toArray());
  }
}

export {
  SieveAbstractBase64Decoder,
  SieveAbstractBase64Encoder
};
