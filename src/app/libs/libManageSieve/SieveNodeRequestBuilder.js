/*
 * The contents of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

(function (exports) {

  // Enable Strict Mode
  "use strict";

  /* global require */
  /* global Buffer */

  const { SieveAbstractRequestBuilder } = require("./SieveAbstractRequestBuilder.js");

  /**
   * Realizes a Request builder which uses native node commands
   */
  class SieveNodeRequestBuilder extends SieveAbstractRequestBuilder {

    /**
     * @inheritDoc
     */
    calculateByteLength(data) {
      return Buffer.byteLength(data, 'utf8');
    }

    /**
     * @inheritDoc
     */
    convertToBase64(decoded) {
      return Buffer.from(decoded).toString('base64');
    }

    /**
     * @inheritDoc
     */
    convertFromBase64(encoded) {
      return Buffer.from(encoded, 'base64').toString("latin1");
    }
  }

  exports.SieveNodeRequestBuilder = SieveNodeRequestBuilder;

})(this);
