/*
 * The contents of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

// Enable Strict Mode
"use strict";

(function(exports) {

  /* global require */
  /* global Buffer */

  const { SieveAbstractResponseParser } = require("./SieveAbstractResponseParser.js");
  const { StringDecoder } = require('string_decoder');

  /**
   * Realizes a response parser which uses node components.
   *
   * @param {String} data
   *   the response which should be parsed
   * @constructor
   */
  function SieveNodeResponseParser(data)
  {
    SieveAbstractResponseParser.call(this, data);
  }

  SieveNodeResponseParser.prototype = Object.create(SieveAbstractResponseParser.prototype);
  SieveNodeResponseParser.prototype.constructor = SieveNodeResponseParser;

  SieveNodeResponseParser.prototype.convertToString = function(byteArray) {
    return new StringDecoder('utf8').end(Buffer.from(byteArray)).toString();
  };

  /**
   * Encodes a clear text string to a base64 encoded string.
   *
   * @param {String} decoded
   *   the clear text string which should be encoded.
   * @returns {String}
   *   the base64 encoded string.
   */
  SieveNodeResponseParser.prototype.convertToBase64 = function(decoded) {
    return Buffer.from(decoded).toString('base64');
  };

  /**
   * Decodes an base64 encoded string into a cleat text string.
   *
   * @param {String} encoded
   *   the base64 encoded string which should be decoded.
   * @returns {string}
   *   the decoded string.
   */
  SieveNodeResponseParser.prototype.convertFromBase64 = function(encoded) {
    return Buffer.from(encoded, 'base64').toString("latin1");
  };

  exports.SieveNodeResponseParser = SieveNodeResponseParser;

})(this);
