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

  /**
   * A helper class used to build standard compliant sieve requests.
   * @constructor
   */
  function SieveAbstractRequestBuilder() {
    this.data = "";
  }

  /**
   * Adds a string as quoted base 64 encoded literal to the request.
   *
   * This is typically needed for sasl requests as they have to be
   * base64 encoded by definition.
   *
   * @param {String} token
   *   the string which should be added to the request.
   * @return {SieveAbstractRequestBuilder}
   *   a self reference
   */
  SieveAbstractRequestBuilder.prototype.addQuotedBase64 = function (token) {
    this.addLiteral('"' + this.convertToBase64(token) + '"');
    return this;
  };

  /**
   * Adds a string as quoted literal to the request.
   *
   * This is typically used for string without a linebreak.
   * In case you know you'll have a linebreak use the multiline
   * version for better readability.
   *
   * Do not use this for any sasl method. All sasl strings
   * have to be base 64 encoded. Refer to addQuotedBase64String instead.
   *
   * @param {String} token
   *   the string which should be added to the request.
   * @return {SieveAbstractRequestBuilder}
   *   a self reference
   */
  SieveAbstractRequestBuilder.prototype.addQuotedString = function (token) {
    this.addLiteral('"' + this.escapeString(token) + '"');
    return this;
  };

  /**
   * Adds a string as multiline literal to the request.
   *
   * It improves the requests readability in case you need to send a
   * string containing a linebreak.
   *
   * @param {String} token
   *   the string which should be added to the request.
   * @return {SieveAbstractRequestBuilder}
   *   a self reference
   */
  SieveAbstractRequestBuilder.prototype.addMultiLineString = function (token) {
    this.addLiteral('{' + this.calculateByteLength(token) + '+}\r\n' + token);
    return this;
  };

  /**
   * Adds a literal to the request.
   * The literal will used as it is. It will not be wrapped in a string or escaped.
   * In case you need this use the specialized methods.
   *
   * @param {String} token
   *   the literal which should be added.
   * @return {SieveAbstractRequestBuilder}
   *   a self reference
   */
  SieveAbstractRequestBuilder.prototype.addLiteral = function (token) {

    if (this.data !== "")
      this.data += " ";

    this.data += token;
    return this;
  };

  /**
   * Returns the current request as it was cached and build upto the call.
   *
   * @returns {String}
   *   the current request including a tailing linebreak
   */
  SieveAbstractRequestBuilder.prototype.getBytes = function () {
    return this.data + "\r\n";
  };

  /**
   * Calculates a strings length in bytes.
   *
   * UTF uses variable length characters. Which means the length in bytes
   * in not nessesarily equivalent to the number of characters.
   *
   * @param {String} data
   *   the string for which the byte length should be calculated.
   * @returns {int}
   *   the string's length in bytes.
   *
   * @abstract
   */
  SieveAbstractRequestBuilder.prototype.calculateByteLength = function (data) {
    throw new Error("Implement SieveAbstractRequestBuilder::calculateByteLength(" + data + ")");
  };

  /**
   * Escapes a string. All Backslashes are converted to \\  while
   * all quotes are esacped as \"
   *
   * @param {string} str
   *   the string which should be escaped
   * @return {string}
   *   the escaped string.
   */
  SieveAbstractRequestBuilder.prototype.escapeString = function (str) {
    return str.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  };

  /**
   * Encodes a string into base64
   * @param  {String} decoded
   *   the string which shall be converted to base64
   * @returns {String}
   *   the encoded string.
   *
   * @abstract
   */
  SieveAbstractRequestBuilder.prototype.convertToBase64 = function (decoded) {
    throw new Error("Implement SieveAbstractRequestBuilder::convertToBase64(" + decoded + ")");
  };

  /**
   * Decodes a base64 encoded string
   * @param  {String} encoded
   *   the base64 encoded string which should be decoded
   * @returns {String}
   *   the decoded string
   *
   * @abstract
   */
  SieveAbstractRequestBuilder.prototype.convertFromBase64 = function (encoded) {
    throw new Error("Implement SieveAbstractRequestBuilder::convertFromBase64(" + encoded + ")");
  };

  exports.SieveAbstractRequestBuilder = SieveAbstractRequestBuilder;

  // Expose as mozilla module...

  /* global Components */
  if (typeof (Components) !== "undefined" && Components.utils && Components.utils.import) {
    if (!exports.EXPORTED_SYMBOLS)
      exports.EXPORTED_SYMBOLS = [];

    exports.EXPORTED_SYMBOLS.push("SieveAbstractRequestBuilder");
  }

})(this);
