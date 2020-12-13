/*
 * The contents of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */


import { SieveAbstractRequestBuilder } from "./SieveAbstractRequestBuilder.mjs";

/**
 * Realizes a Request builder which uses native node commands
 */
class SieveNodeRequestBuilder extends SieveAbstractRequestBuilder {

  /**
   * @inheritdoc
   */
  calculateByteLength(data) {
    return Buffer.byteLength(data, 'utf8');
  }

  /**
   * @inheritdoc
   */
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

export { SieveNodeRequestBuilder as SieveRequestBuilder };
