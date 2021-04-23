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

/**
 *
 */
class SieveNodeBase64Encoder extends SieveAbstractBase64Encoder {

  /**
   * @inheritdoc
   */
  toUtf8() {
    return Buffer.from(this.decoded).toString('base64');
  }

  /**
   * @inheritdoc
   */
  toArray() {
    return (new TextEncoder()).encode(this.toUtf8());
  }
}

/**
 * Node implements a native base64 decoder which supports UTF-8
 * This simplifies decoding dramatically.
 */
class SieveNodeBase64Decoder extends SieveAbstractBase64Decoder {

  /**
   * @inheritdoc
   */
  toArray() {
    return new Uint8Array(Buffer.from(this.encoded, 'base64'));
  }

}

export {
  SieveNodeBase64Decoder as SieveBase64Decoder,
  SieveNodeBase64Encoder as SieveBase64Encoder
};
