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

  function SieveParser(data) {
    this._data = data;
    this._pos = 0;
  }

  SieveParser.prototype.isChar
    = function (ch, offset) {
      if (typeof (offset) === "undefined")
        offset = 0;

      if (!Array.isArray(ch))
        return (this._data.charAt(this._pos + offset) === ch);

      ch = [].concat(ch);

      for (let i = 0; i < ch.length; i++)
        if (this._data.charAt(this._pos + offset) === ch[i])
          return true;

      return false;
    };

  SieveParser.prototype.extractToken
    = function (delimiter) {
      let offset = 0;

      while (this.isChar(delimiter, offset))
        offset++;

      if (offset === 0)
        throw new Error("Delimiter >>" + delimiter + "<< expected but found\n" + this.bytes(QUOTE_LENGTH) + "...");

      let str = this._data.substr(this._pos, offset);

      this._pos += str.length;

      return str;
    };

  SieveParser.prototype.extractChar
    = function (ch) {
      if (typeof (ch) !== "undefined")
        if (!this.isChar(ch))
          throw new Error("" + ch + " expected but found:\n" + this.bytes(QUOTE_LENGTH) + "...");

      this._pos++;
      return this._data.charAt(this._pos - 1);
    };

  // TODO better naming
  // Skip tries to skip Char, if possible returns true if not false
  SieveParser.prototype.skipChar
    = function (ch) {
      if (typeof (ch) !== "undefined")
        if (!this.isChar(ch))
          return false;

      this._pos++;
      return true;
    };

  /**
   *  Checks if the current puffer starts with the given token(s)
   *
   *  @param {String|String[]} tokens
   *    the tokens which should be checked
   *
   *  @return {boolean}
   *    true in case the string starts with one of the tokens
   *    otherwise false
   */
  SieveParser.prototype.startsWith
    = function (tokens) {

      if (!Array.isArray(tokens))
        tokens = [tokens];

      for (let i in tokens) {
        let data = this._data.substr(this._pos, tokens[i].length);

        if (data === tokens[i])
          return true;
      }

      return false;
    };

  // TODO rename to skip
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
   * @return {String}
   *   a self reference
   */
  SieveParser.prototype.extract
    = function (length) {
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
    };

  // Delimiter
  SieveParser.prototype.extractUntil
    = function (token) {
      let idx = this._data.indexOf(token, this._pos);

      if (idx === NO_SUCH_TOKEN)
        throw new Error("Token expected: " + token.toString());

      let str = this._data.substring(this._pos, idx);

      this._pos += str.length + token.length;

      return str;
    };

  SieveParser.prototype.isNumber
    = function (offset) {
      if (typeof (offset) !== "number")
        offset = 0;

      if (this._pos + offset > this._data.length)
        throw new Error("Parser out of bounds");

      return !isNaN(parseInt(this._data.charAt(this._pos + offset), 10));
    };

  SieveParser.prototype.extractNumber
    = function () {
      let i = 0;
      while (this.isNumber(i))
        i++;

      let number = this._data.substr(this._pos, i);

      this._pos += i;

      return number;
    };

  SieveParser.prototype.bytes
    = function (length) {
      return this._data.substr(this._pos, length);
    };


  SieveParser.prototype.empty
    = function () {
      return (this._pos >= this._data.length);
    };

  SieveParser.prototype.rewind
    = function (offset) {
      this._pos -= offset;
    };

  /**
   * Gets or sets te current position.
   *
   * @param {int} position
   *   the new position which should be set. You can't exceed the buffer length.
   * @return {int}
   *   the current position.
   */
  SieveParser.prototype.pos
    = function (position) {
      if (typeof (position) === "number")
        this._pos = position;

      if (this._pos > this._data.length)
        this._pos = this._data.length;

      return this._pos;
    };

  exports.SieveParser = SieveParser;

})(window);
