/*
 * The contents of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

import { SieveBase64Encoder } from "./SieveBase64.mjs";

/**
 * A helper class used to build standard compliant sieve requests.
 */
class SieveRequestBuilder {

  /**
   * Creates a new instance
   */
  constructor() {
    this.data = "";
  }

  /**
   * Adds a string as quoted base 64 encoded literal to the request.
   *
   * This is typically needed for SASL requests as they have to be
   * base64 encoded by definition.
   *
   * @param {string} token
   *   the string which should be added to the request.
   * @returns {SieveAbstractRequestBuilder}
   *   a self reference
   */
  addQuotedBase64(token) {
    if (token === undefined || token === null)
      throw new Error("Invalid token");

    this.addLiteral(`"${(new SieveBase64Encoder(token)).toUtf8()}"`);
    return this;
  }

  /**
   * Adds a string as quoted literal to the request.
   *
   * This is typically used for string without a line break.
   * In case you know you'll have a line break use the multiline
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
   * string containing a line break.
   *
   * @param {string} token
   *   the string which should be added to the request.
   * @returns {SieveAbstractRequestBuilder}
   *   a self reference
   */
  addMultiLineString(token) {
    // Calculate the length in bytes
    const length = (new TextEncoder()).encode(token).byteLength;
    // return Buffer.byteLength(data, 'utf8');

    this.addLiteral(`{${length}+}\r\n${token}`);
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
   * Returns the current request as it was cached and build up to the call.
   *
   * @returns {string}
   *   the current request including a trailing line break
   */
  getBytes() {
    return this.data + "\r\n";
  }

  /**
   * Escapes a string. All Backslashes are converted to \\  while
   * all quotes are escaped as \"
   *
   * @param {string} str
   *   the string which should be escaped
   * @returns {string}
   *   the escaped string.
   */
  escapeString(str) {
    return str.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  }

}

export { SieveRequestBuilder };
