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
   */
  class SieveAbstractRequestBuilder {

    /**
     * Creates a new instance
     */
    constructor() {
      this.data = "";
    }

    /**
     * Adds a string as quoted base 64 encoded literal to the request.
     *
     * This is typically needed for sasl requests as they have to be
     * base64 encoded by definition.
     *
     * @param {string} token
     *   the string which should be added to the request.
     * @returns {SieveAbstractRequestBuilder}
     *   a self reference
     */
    addQuotedBase64(token) {
      this.addLiteral('"' + this.convertToBase64(token) + '"');
      return this;
    }

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
     * @param {string} [token]
     *   the string which should be added to the request.
     *   if omitted an empty string is sent.
     * @returns {SieveAbstractRequestBuilder}
     *   a self reference
     */
    addQuotedString(token) {
      if (typeof (token) === "undefined" || token === null)
        token = "";

      this.addLiteral('"' + this.escapeString(token) + '"');
      return this;
    }

    /**
     * Adds a string as multiline literal to the request.
     *
     * It improves the requests readability in case you need to send a
     * string containing a linebreak.
     *
     * @param {string} token
     *   the string which should be added to the request.
     * @returns {SieveAbstractRequestBuilder}
     *   a self reference
     */
    addMultiLineString(token) {
      this.addLiteral('{' + this.calculateByteLength(token) + '+}\r\n' + token);
      return this;
    }

    /**
     * Adds a literal to the request.
     * The literal will used as it is. It will not be wrapped in a string or escaped.
     * In case you need this use the specialized methods.
     *
     * @param {string} token
     *   the literal which should be added.
     * @returns {SieveAbstractRequestBuilder}
     *   a self reference
     */
    addLiteral(token) {

      if (this.data !== "")
        this.data += " ";

      this.data += token;
      return this;
    }

    /**
     * Returns the current request as it was cached and build upto the call.
     *
     * @returns {string}
     *   the current request including a tailing linebreak
     */
    getBytes() {
      return this.data + "\r\n";
    }

    /**
     * Calculates a strings length in bytes.
     *
     * UTF uses variable length characters. Which means the length in bytes
     * in not nessesarily equivalent to the number of characters.
     *
     * @param {string} data
     *   the string for which the byte length should be calculated.
     * @returns {int}
     *   the string's length in bytes.
     *
     * @abstract
     */
    calculateByteLength(data) {
      throw new Error("Implement SieveAbstractRequestBuilder::calculateByteLength(" + data + ")");
    }

    /**
     * Escapes a string. All Backslashes are converted to \\  while
     * all quotes are esacped as \"
     *
     * @param {string} str
     *   the string which should be escaped
     * @returns {string}
     *   the escaped string.
     */
    escapeString(str) {
      return str.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
    }

    /**
     * Encodes a string into base64
     * @param  {string|byte[]} decoded
     *   the string or byte array which shall be converted to base64
     * @returns {string}
     *   the encoded string.
     *
     * @abstract
     */
    convertToBase64(decoded) {
      throw new Error("Implement SieveAbstractRequestBuilder::convertToBase64(" + decoded + ")");
    }

    /**
     * Decodes a base64 encoded string
     * @param {string} encoded
     *   the base64 encoded string which should be decoded
     * @returns {string}
     *   the decoded string
     *
     * @abstract
     */
    convertFromBase64(encoded) {
      throw new Error("Implement SieveAbstractRequestBuilder::convertFromBase64(" + encoded + ")");
    }
  }

  exports.SieveAbstractRequestBuilder = SieveAbstractRequestBuilder;

})(module.exports || this);
