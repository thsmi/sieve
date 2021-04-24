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

import {
  SieveAbstractBase64Decoder,
  SieveAbstractBase64Encoder
} from "./SieveAbstractBase64.mjs";

const DECODED_QUANTUM = 3;
const ENCODED_QUANTUM = 4;

const CHAR_PADDING = 61;

// First Quantum
const Q1_HIGH_OFFSET = 0;
const Q1_HIGH_MASK = 0x3F;
const Q1_HIGH_SHIFT = 2;

const Q1_LOW_OFFSET = 1;
const Q1_LOW_MASK = 0x30;
const Q1_LOW_SHIFT = 4;

// Second Quantum
const Q2_HIGH_OFFSET = 1;
const Q2_HIGH_MASK = 0x0F;
const Q2_HIGH_SHIFT = 4;

const Q2_LOW_OFFSET = 2;
const Q2_LOW_MASK = 0x3C;
const Q2_LOW_SHIFT = 2;

// Third Quantum
const Q3_HIGH_OFFSET = 2;
const Q3_HIGH_MASK = 0x03;
const Q3_HIGH_SHIFT = 6;

const Q3_LOW_OFFSET = 3;
const Q3_LOW_MASK = 0x3F;
const Q3_LOW_SHIFT = 0;

const TWO_QUANTUM = 2;
const ONE_QUANTUM = 1;

// Byte Offsets
const FIRST_BYTE = 0;
const SECOND_BYTE = 1;
const THIRD_BYTE = 2;
const FOURTH_BYTE = 3;

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 *
 */
class SieveWebBase64Encoder extends SieveAbstractBase64Encoder {

  /**
   * @inheritdoc
   */
  constructor(decoded) {

    if (Array.isArray(decoded))
      decoded = new Uint8Array(decoded);

    if (!(decoded instanceof Uint8Array))
      decoded = (new TextEncoder()).encode(decoded);

    super(decoded);
  }

  /**
   * Converts the 6bit integer into the corresponding base64 bytes
   * @param {byte} data
   *   the 6 bit integer to be converted
   * @returns {string}
   *   the corresponding base64 character
   *
   */
  lookup(data) {
    return (BASE64_CHARS[data].charCodeAt());
  }

  /**
   * Encodes the first byte. It is exclusively used by the first
   * quantum.
   *
   * @param {byte} q1
   *   the first quantum to be encoded.
   * @returns {byte}
   *   the encoded quantum
   */
  encodeFirstByte(q1) {
    return this.lookup((q1 >> Q1_HIGH_SHIFT) & Q1_HIGH_MASK);
  }

  /**
   * Encodes the second byte. This byte is shared by the first
   * and second quantum.
   *
   * The second quantum is optional and should be omitted or
   * set to zero in case the end of the decoded data is reached.
   *
   * @param {byte} q1
   *   the first quantum.
   * @param {byte} [q2]
   *   the second quantum.
   * @returns {byte}
   *   the encoded quantum.
   */
  encodeSecondByte(q1, q2) {
    if ((typeof(q2) === "undefined") || (q2 === null))
      return this.lookup((q1 << Q1_LOW_SHIFT) & Q1_LOW_MASK);

    return this.lookup(
      ((q1 << Q1_LOW_SHIFT) & Q1_LOW_MASK)
        + ((q2 >> Q2_HIGH_SHIFT) & Q2_HIGH_MASK));
  }

  /**
   * Encodes the third byte. This byte is shared by the second
   * and third quantum.
   *
   * The third quantum is optional and should be omitted or
   * set to zero in case the end of the decoded date is reached.
   *
   * @param {byte} q2
   *   the second quantum.
   * @param {byte} [q3]
   *   the third quantum.
   * @returns {byte}
   *   the encoded quantum.
   */
  encodeThirdByte(q2, q3) {
    if ((typeof(q3) === "undefined") || (q3 === null))
      return this.lookup(((q2 << Q2_LOW_SHIFT) & Q2_LOW_MASK));

    return this.lookup(
      ((q2 << Q2_LOW_SHIFT) & Q2_LOW_MASK)
        + ((q3 >> Q3_HIGH_SHIFT) & Q3_HIGH_MASK));
  }

  /**
   * Encodes the fourth byte. This byte is exclusively used by
   * the fourth quantum.
   *
   * @param {byte} q4
   *   the fourth quantum.
   * @returns {byte}
   *   the encoded quantum.
   */
  encodeFourthByte(q4) {
    return this.lookup((q4 >> Q3_LOW_SHIFT) & Q3_LOW_MASK);
  }

  /**
   * @inheritdoc
   */
  toArray() {

    const decoded = this.decoded;

    const data = new Uint8Array(
      Math.ceil(decoded.byteLength / DECODED_QUANTUM) * ENCODED_QUANTUM);

    const padding = (decoded.length % DECODED_QUANTUM);

    for (let i = 0; i < decoded.length - padding; i += DECODED_QUANTUM) {

      const offset = (i / DECODED_QUANTUM) * ENCODED_QUANTUM;

      data[offset + FIRST_BYTE] = this.encodeFirstByte(decoded[i + FIRST_BYTE]);
      data[offset + SECOND_BYTE]
        = this.encodeSecondByte(decoded[i + FIRST_BYTE], decoded[i + SECOND_BYTE]);
      data[offset + THIRD_BYTE]
        = this.encodeThirdByte(decoded[i + SECOND_BYTE], decoded[i + THIRD_BYTE]);
      data[offset + FOURTH_BYTE] = this.encodeFourthByte(decoded[i + THIRD_BYTE]);
    }

    if (padding === ONE_QUANTUM) {
      const offset = data.length - ENCODED_QUANTUM;

      data[offset + FIRST_BYTE] = this.encodeFirstByte(decoded[decoded.length - 1]);
      data[offset + SECOND_BYTE] = this.encodeSecondByte(decoded[decoded.length - 1]);
      data[offset + THIRD_BYTE] = CHAR_PADDING;
      data[offset + FOURTH_BYTE] = CHAR_PADDING;
    }

    if (padding === TWO_QUANTUM) {
      const offset = data.length - ENCODED_QUANTUM;

      data[offset + FIRST_BYTE] = this.encodeFirstByte(
        decoded[decoded.length - 2]);
      data[offset + SECOND_BYTE] = this.encodeSecondByte(
        decoded[decoded.length - 2], decoded[decoded.length - 1]);
      data[offset + THIRD_BYTE] = this.encodeThirdByte(
        decoded[decoded.length - 1]);
      data[offset + FOURTH_BYTE] = CHAR_PADDING;
    }

    return data;
  }

  /**
   * @inheritdoc
   */
  toUtf8() {
    return (new TextDecoder("UTF-8")).decode(this.toArray());
  }
}

/**
 * Implements a base64 decoded as atob is not capable of
 * decoding an encoded UTF8 string.
 */
class SieveWebBase64Decoder extends SieveAbstractBase64Decoder {

  /**
   * @inheritdoc
   */
  constructor(encoded) {

    if (!(encoded instanceof Uint8Array))
      encoded = new Uint8Array((new TextEncoder()).encode(encoded));

    super(encoded);
  }

  /**
   * Calculates the decoded length.
   * @param {Uint8Array} encoded
   *   the encoded data which should be analyzed
   * @returns {int}
   *   the decoded length in bytes
   */
  calculateLength(encoded) {
    const length = Math.floor((encoded.length / ENCODED_QUANTUM) * DECODED_QUANTUM);

    // If the last character is not equals to "=" then we know
    // the last quantum is fully or empty.
    if (encoded[encoded.length - 1] !== CHAR_PADDING)
      return length;

    // In case the last two bytes are not equal to "=" we know
    // we know the last quantum is 16bit.
    if (encoded[encoded.length - 2] !== CHAR_PADDING)
      return length - ONE_QUANTUM;

    // Otherwise it is a single "=" at the end which means the
    // las quantum is 8 bits.
    return length - TWO_QUANTUM;
  }

  /**
   * Decodes the first byte or quantum
   *
   * @param {int} offset
   *   the offset which points to the first group of the encoded data.
   * @param {Uint8Array} encoded
   *   the encoded data.
   * @returns {byte}
   *   The first byte or quantum.
   */
  decodeFirstQuantum(offset, encoded) {
    return ((this.lookup(encoded[offset + Q1_HIGH_OFFSET]) & Q1_HIGH_MASK) << Q1_HIGH_SHIFT)
      + ((this.lookup(encoded[offset + Q1_LOW_OFFSET]) & Q1_LOW_MASK) >> Q1_LOW_SHIFT);
  }

  /**
   * Decodes the second byte or quantum
   *
   * @param {int} offset
   *   the offset which points to the first group of the encoded data.
   * @param {Uint8Array} encoded
   *   the encoded data.
   * @returns {byte}
   *   The second byte or quantum.
   */
  decodeSecondQuantum(offset, encoded) {
    return ((this.lookup(encoded[offset + Q2_HIGH_OFFSET]) & Q2_HIGH_MASK) << Q2_HIGH_SHIFT)
      + ((this.lookup(encoded[offset + Q2_LOW_OFFSET]) & Q2_LOW_MASK) >> Q2_LOW_SHIFT);
  }

  /**
   * Decodes the third byte or quantum
   *
   * @param {int} offset
   *   the offset which points to the first group of the encoded data.
   * @param {Uint8Array} encoded
   *   the encoded data.
   * @returns {byte}
   *   The third byte or quantum.
   */
  decodeThirdQuantum(offset, encoded) {

    return ((this.lookup(encoded[offset + Q3_HIGH_OFFSET]) & Q3_HIGH_MASK) << Q3_HIGH_SHIFT)
      + ((this.lookup(encoded[offset + Q3_LOW_OFFSET]) & Q3_LOW_MASK) << Q3_LOW_SHIFT);
  }

  /**
   * Converts a the base64 code point value to the decoded value.
   * @param {byte} data
   *   the base64 code point
   * @returns {byte}
   *   the decoded value.
   */
  lookup(data) {
    return BASE64_CHARS.indexOf(String.fromCharCode(data));
  }

  /**
   * @inheritdoc
   */
  toArray() {

    const encoded = this.encoded;
    // adjust the array view to the padding

    const data = new Uint8Array(this.calculateLength(encoded));

    for (let i = 0; i < data.length - 1; i += DECODED_QUANTUM) {
      const offset = (i / DECODED_QUANTUM) * ENCODED_QUANTUM;

      data[i + FIRST_BYTE] = this.decodeFirstQuantum(offset, encoded);
      data[i + SECOND_BYTE] = this.decodeSecondQuantum(offset, encoded);
      data[i + THIRD_BYTE] = this.decodeThirdQuantum(offset, encoded);
    }

    const padding = (data.length % DECODED_QUANTUM);

    if (padding === TWO_QUANTUM) {
      const offset = ((data.length - padding) / DECODED_QUANTUM) * ENCODED_QUANTUM;
      data[data.length - 2] = this.decodeFirstQuantum(offset, encoded);
      data[data.length - 1] = this.decodeSecondQuantum(offset, encoded);
    }

    if (padding === ONE_QUANTUM) {
      const offset = ((data.length - padding) / DECODED_QUANTUM) * ENCODED_QUANTUM;
      data[data.length - 1] = this.decodeFirstQuantum(offset, encoded);
    }

    return data;
  }
}

export {
  SieveWebBase64Decoder as SieveBase64Decoder,
  SieveWebBase64Encoder as SieveBase64Encoder
};
