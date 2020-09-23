/*
 * The contents of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */


import { SieveAbstractResponseParser } from "./SieveAbstractResponseParser.mjs";
const { StringDecoder } = require('string_decoder');

/**
 * Implements a node specific response parser
 */
class SieveNodeResponseParser extends SieveAbstractResponseParser {

  /**
   * @inheritdoc
   **/
  convertToString(byteArray) {
    return new StringDecoder('utf8').end(Buffer.from(byteArray)).toString();
  }

  /**
   * @inheritdoc
   **/
  convertToBase64(decoded) {
    return Buffer.from(decoded).toString('base64');
  }

  /**
   * @inheritdoc
   */
  convertFromBase64(encoded) {
    return Buffer.from(encoded, 'base64').toString("latin1");
  }
}

export { SieveNodeResponseParser };
