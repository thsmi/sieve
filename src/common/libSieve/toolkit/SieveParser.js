/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

/* global window */

(function (exports) {

  "use strict";

  /** the number of bytes to quote in case of an error*/
  const QUOTE_LENGTH = 50;
  const NO_SUCH_TOKEN = -1;

  const IDX_BEGIN = 0;
  const ONE_CHARACTER = 1;
  /**
   * A linear string parser used to tokeizes and extract a string into atoms.
   */
  class SieveParser {

    /**
     * Initalizes the instance.
     *
     * @param {string} data
     *   the data which shall be parsed
     */
    constructor(data) {
      this._data = data;
      this._pos = IDX_BEGIN;
    }

    /**
     * Checks it the character at the given position matches the given whitelist.
     *
     * @param {char | char[]} ch
     *   a character or an array or characters which should matches the current position.
     * @param {int} [offset]
     *   an optional offset. Relative to the current position.
     *   if omitted no offset is used.
     * @returns {boolean}
     *   true in case the current character matches otherwise false
     */
    isChar(ch, offset) {
      if (typeof (offset) === "undefined" || offset === null)
        offset = IDX_BEGIN;

      if (!Array.isArray(ch))
        return (this._data.charAt(this._pos + offset) === ch);

      ch = [].concat(ch);

      for (let item of ch)
        if (this._data.charAt(this._pos + offset) === item)
          return true;

      return false;
    }

    /**
     * Extracts a token terminated by and of the given delimiters.
     * In case the delimiter is not found an exception is thrown.
     *
     * @param {char |char []} delimiter
     *   the delimiters which terminate the token.
     * @returns {string}
     *   the token as string.
     */
    extractToken(delimiter) {
      let offset = IDX_BEGIN;

      while (this.isChar(delimiter, offset))
        offset++;

      if (offset === IDX_BEGIN)
        throw new Error("Delimiter >>" + delimiter + "<< expected but found\n" + this.bytes(QUOTE_LENGTH) + "...");

      let str = this._data.substr(this._pos, offset);

      this._pos += str.length;

      return str;
    }

    /**
     * Extracts a single character
     *
     * @param {char|char[]} [ch]
     *   the extracted character has to be one of the given characters
     *   otherwise an exception is thrown.
     *   If omittes any character will match.
     *
     * @returns {char}
     *   the extracted character.
     */
    extractChar(ch) {
      if (typeof (ch) !== "undefined" && ch !== null)
        if (!this.isChar(ch))
          throw new Error("" + ch + " expected but found:\n" + this.bytes(QUOTE_LENGTH) + "...");

      this._pos++;
      return this._data.charAt(this._pos - ONE_CHARACTER);
    }

    /**
     * Skips a single character.
     *
     * @param {char|char[]} [ch]
     *   The chars which are expected.
     *   If omitted any char will match.
     *
     * @returns {boolean}
     *   true in case the char was skipped otherwise false.
     */
    skipChar(ch) {
      if (typeof (ch) !== "undefined" || ch !== null)
        if (!this.isChar(ch))
          return false;

      this._pos++;
      return true;
    }

    /**
     *  Checks if the current puffer starts with the given token(s)
     *
     *  @param {string|string[]} tokens
     *    the tokens which should be checked
     *
     *  @param {boolean} [ignoreCase]
     *    optional boolean argument default to true
     *
     *  @returns {boolean}
     *    true in case the string starts with one of the tokens
     *    otherwise false
     */
    startsWith(tokens, ignoreCase) {

      if (typeof(ignoreCase) === "undefined" || ignoreCase === null)
        ignoreCase = true;

      if (!Array.isArray(tokens))
        tokens = [tokens];

      for (let token of tokens) {
        let data = this._data.substr(this._pos, token.length);

        if (ignoreCase) {
          token = token.toLowerCase();
          data = data.toLowerCase();
        }

        if (data === token)
          return true;
      }

      return false;
    }

    /**
     * Extracts and/or skips the given number of bytes.
     *
     * You can either pass an integer with the absolute number of bytes or a string.
     *
     * In case you pass a string, the string length will be skipped. But only in case
     * it matches case insensitive. Othewise an exception is thrown.
     *
     * In case the length parameter is neiter a string nor a parameter and exception is thrown.
     *
     * @param {int|string} length
     *   Can be an integer which defines an absolute number of bytes which should be skipped.
     *   Or a string, which will be matched case sensitive and extracted.
     *
     * @returns {string}
     *   the extracted string
     */
    extract(length) {
      let result = null;

      if (typeof (length) === "string") {
        let str = length;

        if (!this.startsWith(str))
          throw new Error("" + str + " expected but found:\n" + this.bytes(QUOTE_LENGTH) + "...");

        result = this.bytes(str.length);
        this._pos += str.length;

        return result;
      }

      if (isNaN(parseInt(length, 10)))
        throw new Error("Extract failed, length parameter is not a number");

      result = this.bytes(length);
      this._pos += length;

      return result;
    }

    /**
     * Searches for the given token.
     * If found all data before the token is returend and
     * the buffer is advanced to the end of the token.
     *
     * In case the token is not found in the buffer an
     * exception will be thrown
     *
     * @param {string} token
     *   the token which is used as delimiter
     * @returns {string}
     *   the data between the token an the delimter
     */
    extractUntil(token) {
      let idx = this._data.indexOf(token, this._pos);

      if (idx === NO_SUCH_TOKEN)
        throw new Error("Token expected: " + token.toString());

      let str = this._data.substring(this._pos, idx);

      this._pos += str.length + token.length;

      return str;
    }

    /**
     * Checks if the current character is numeric.
     *
     * @param {int} [offset]
     *   defaults to zero if omitted
     *
     * @returns {boolean}
     *   true in case the current character is numeric otherwise false.
     */
    isNumber(offset) {
      if (typeof (offset) !== "number")
        offset = IDX_BEGIN;

      if (this._pos + offset > this._data.length)
        throw new Error("Parser out of bounds");

      return !isNaN(parseInt(this._data.charAt(this._pos + offset), 10));
    }

    /**
     * Extracts an integer value starting from the current postion.
     *
     * @returns {int}
     *  the extracted number.
     */
    extractNumber() {
      let offset = IDX_BEGIN;
      while (this.isNumber(offset))
        offset++;

      if (offset === IDX_BEGIN)
        throw new Error("Number expected but found:\n" + this.bytes(QUOTE_LENGTH) + "...");

      let number = this._data.substr(this._pos, offset);

      this._pos += offset;

      return number;
    }

    /**
     * Returns the remainig buffer.
     * @param {int} [length]
     *   optional returns at lost length bytes.
     *   if omitted the complete buffer is returned
     *
     */
    bytes(length) {
      return this._data.substr(this._pos, length);
    }

    /**
     * Checks if the internal string buffer is depleted.
     * Which means it reached the end of the string.
     *
     * @returns {boolean}
     *   true in case the buffer is empty. Otherwise false.
     */
    empty() {
      return (this._pos >= this._data.length);
    }

    /**
     * Rewindes the internal buffer by the given number of bytes
     * @param {int} offset
     *   the number of bytes to rewind.
     *
     */
    rewind(offset) {
      this._pos -= offset;

      if (this._pos < IDX_BEGIN)
        this._pos = IDX_BEGIN;
    }

    /**
     * Gets or sets te current position.
     *
     * @param {int} position
     *   the new position which should be set. You can't exceed the buffer length.
     * @returns {int}
     *   the current position.
     */
    pos(position) {
      if (typeof (position) === "number")
        this._pos = position;

      if (this._pos > this._data.length)
        this._pos = this._data.length;

      if (this._pos < IDX_BEGIN)
        this._pos = IDX_BEGIN;

      return this._pos;
    }
  }

  exports.SieveParser = SieveParser;

})(window);
