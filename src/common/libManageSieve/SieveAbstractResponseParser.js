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

(function (exports) {

  const CHAR_LF = 10;
  const CHAR_CR = 13;
  const CHAR_SPACE = 32;
  const CHAR_QUOTE = 34;
  const CHAR_BACKSLASH = 92;
  const CHAR_LEFT_BRACES = 123;
  const CHAR_RIGHT_BRACES = 125;

  /**
   * The manage sieve protocol syntax uses a fixed gramar which is based on atomar tokens.
   * This class offers an interface to test for and extract these predefined tokens. It supports
   * Strings (Quoted and Literal), White Space (Line Break, Space ...) as well as arbitraty tokens.
   *
   * This class expects as input a byte array using UTF-8 encoding. It's because the manage sieve
   * protocol is defined to uses UTF-8 encoding and Mozilla sockets return incomming messages streams.
   *
   * The parser does not change or alter the byte array's content. So extracting data does not shrink
   * the array free any bytes. This parser is just somekind of a view to this array.
   *
   * Tokens are automatically converted from UTF-8 encoded byte arrays to JavaScript Unicode Strings
   * during extraction.
   *
   * @param {Byte[]} data
   *   a byte array encoded in UTF-8
   *
   * @constructor
   */
  function SieveAbstractResponseParser(data) {
    if ((typeof (data) === 'undefined') || (data === null))
      throw new Error("Error Parsing Response...\nData is null");

    this.pos = 0;
    this.data = data;
  }

  /**
   * Extracts the given number of bytes from the buffer.
   *
   * @param {int} size
   *   The number of bytes as integer which should be extracted
   * @return {void}
   */
  SieveAbstractResponseParser.prototype.extract
    = function (size) {
      this.pos += size;
    };

  /**
   * Tests if the array starts with a line break (#13#10)
   *
   * @return {Boolean}
   *   true if the buffer with a line break, otherwise false
   */
  SieveAbstractResponseParser.prototype.isLineBreak
    = function () {
      // Are we out of bounds?
      if (this.data.length < this.pos + 1)
        return false;

      // Test for a linebreak #13#10
      if (this.data[this.pos] !== CHAR_CR)
        return false;

      if (this.data[this.pos + 1] !== CHAR_LF)
        return false;

      return true;
    };

  /**
   * Extracts a line break (#13#10) for the buffer
   *
   * If it does not start with a line break an exception is thrown.
   *
   * @returns {SieveAbstractResponseParser}
   *   a self reference
   */
  SieveAbstractResponseParser.prototype.extractLineBreak
    = function () {
      if (this.isLineBreak() === false)
        throw new Error("Linebreak expected but found:\n" + this.getData());

      this.pos += 2;

      return this;
    };

  /**
   * Test if the buffer starts with a space character (#32)
   * @return {Boolean}
   *   true if buffer starts with a space character, otherwise false
   */
  SieveAbstractResponseParser.prototype.isSpace
    = function () {
      if (this.data[this.pos] === CHAR_SPACE)
        return true;

      return false;
    };

  /**
   * Extracts a space character (#32) form the buffer
   *
   * If it does not start with a space character an exception is thrown.
   * @returns {void}
   */
  SieveAbstractResponseParser.prototype.extractSpace
    = function () {
      if (this.isSpace() === false)
        throw new Error("Space expected but found:\n" + this.getData());

      this.pos++;
    };

  // literal = "{" number  "+}" CRLF *OCTET
  SieveAbstractResponseParser.prototype.isLiteral
    = function () {
      if (this.data[this.pos] === CHAR_LEFT_BRACES)
        return true;

      return false;
    };

  // gibt einen string zurück, wenn keiner Existiert wird null übergeben
  // bei syntaxfehlern filegt eine exception;
  SieveAbstractResponseParser.prototype.extractLiteral
    = function () {
      if (this.isLiteral() === false)
        throw new Error("Literal Expected but found\n" + this.getData());

      // remove the "{"
      this.pos++;

      // some sieve implementations are broken, this means ....
      // ... we can get "{4+}\r\n1234" or "{4}\r\n1234"

      let nextBracket = this.indexOf(CHAR_RIGHT_BRACES);
      if (nextBracket === -1)
        throw new Error("Error unbalanced parentheses \"{\" in\n" + this.getData());

      // extract the size, and ignore "+"
      let size = parseInt(this.getData(this.pos, nextBracket).replace(/\+/, ""), 10);

      this.pos = nextBracket + 1;

      this.extractLineBreak();

      // extract the literal...
      let literal = this.getData(this.pos, this.pos + size);
      this.pos += size;

      return literal;
    };

  /**
   * Searches the buffer for a character.
   *
   * @param {byte} character
   *   the chararcter which should be found
   * @param {int} [offset]
   *   an absolut offset, from which to start searching
   * @return {int} character
   *   the characters absolute position within the buffer otherwise -1 if not found
   */
  SieveAbstractResponseParser.prototype.indexOf
    = function (character, offset) {
      if (typeof (offset) === "undefined")
        offset = this.pos;

      for (let i = offset; i < this.data.length; i++)
        if (this.data[i] === character)
          return i;

      return -1;
    };

  /**
   * Test if the buffer starts with a quote character (#34)
   * @return {Boolean}
   *   true if buffer starts with a quote character, otherwise false
   */
  SieveAbstractResponseParser.prototype.isQuoted
    = function () {
      if (this.data[this.pos] === CHAR_QUOTE)
        return true;

      return false;
    };

  /**
   * Extracts a quoted string form the buffer. It is aware of escape sequences.
   *
   * If it does not start with a valid string an exception is thrown.
   *
   * @return {string}
   *   the quoted string extracted, it is garanteed to be free of escape sequences
   */
  SieveAbstractResponseParser.prototype.extractQuoted
    = function () {
      if (this.isQuoted() === false)
        throw new Error("Quoted string expected but found \n" + this.getData());

      // now search for the end. But we need to be aware of escape sequences.
      let nextQuote = this.pos + 1;

      while (this.data[nextQuote] !== CHAR_QUOTE) {

        // Quoted stings can not contain linebreaks...
        if (this.data[nextQuote] === CHAR_LF)
          throw new Error("Linebreak (LF) in Quoted String detected");

        if (this.data[nextQuote] === CHAR_CR)
          throw new Error("Linebreak (CR) in Quoted String detected");

        // is it an escape sequence?
        if (this.data[nextQuote] === CHAR_BACKSLASH) {
          // Yes, it's a backslash so get the next char...
          nextQuote++;

          // ... only \\ and \" are valid escape sequences
          if ((this.data[nextQuote] !== CHAR_BACKSLASH) && (this.data[nextQuote] !== CHAR_QUOTE))
            throw new Error("Invalid Escape Sequence");
        }

        // move to the next character
        nextQuote++;

        if (this.nextQuote >= this.data.length)
          throw new Error("Unterminated Quoted string");
      }

      let quoted = this.getData(this.pos + 1, nextQuote);

      this.pos = nextQuote + 1;

      // Cleanup escape sequences
      quoted = quoted.replace(/\\"/g, '"');
      quoted = quoted.replace(/\\\\/g, '\\');

      return quoted;
    };

  /**
   * Tests if the a quoted or literal string starts at the current position.
   *
   * @return {Boolean}
   *   true if a strings starts, otherwise false
   */
  SieveAbstractResponseParser.prototype.isString
    = function () {
      if (this.isQuoted())
        return true;

      if (this.isLiteral())
        return true;

      return false;
    };

  SieveAbstractResponseParser.prototype.extractString
    = function () {
      if (this.isQuoted())
        return this.extractQuoted();
      if (this.isLiteral())
        return this.extractLiteral();

      throw new Error("String expected but found\n" + this.getData());
    };

  /**
   * Extracts a token form a response. The token is beeing delimited by any
   * separator. The extracted token does not include the separator.
   *
   * Throws an exception if none of the separators is found.
   *
   * @param {byte[]} separators
   *   an array containing possible token separators. The first match always wins.
   * @return {String}
   *   the extracted token.
   */
  SieveAbstractResponseParser.prototype.extractToken
    = function (separators) {
      // Search for the separators, the one with the lowest index which is not...
      // ... equal to -1 wins. The -2 indecates not initalized...
      let index = -1;

      for (let i = 0; i < separators.length; i++) {
        let idx = this.indexOf(separators[i], this.pos);

        if (idx === -1)
          continue;

        if (index === -1)
          index = idx;
        else
          index = Math.min(index, idx);
      }

      if (index === -1)
        throw new Error("Delimiter >>" + separators + "<< not found in: " + this.getData());

      let token = this.getData(this.pos, index);
      this.pos = index;

      return token;
    };

  /**
   * Tests if the buffer starts with the specified bytes.
   *
   * As the buffer is encoded in UTF-8, the specified bytes have to be
   * encoded in UTF-8, otherwise the result is unpredictable.
   *
   * @param {Byte[]} bytes
   *   the bytes to compare as byte array encoded in UTF-8
   *
   * @return {Boolean}
   *   true if bytes match the beginning of the buffer, otherwise false
   */
  SieveAbstractResponseParser.prototype.startsWith
    = function (bytes) {
      if (bytes.length === 0)
        return false;

      for (let i = 0; i < bytes.length; i++) {
        let result = false;

        for (let ii = 0; ii < bytes[i].length; ii++)
          if (bytes[i][ii] === this.data[this.pos + i])
            result = true;

        if (result === false)
          return false;
      }

      return true;
    };

  /**
   * Returns a copy of the current buffer.
   *
   * @return {byte[]}
   *   an a copy of the array's current view. It is encoded in UTF-8
   */
  SieveAbstractResponseParser.prototype.getByteArray
    = function () {
      return this.data.slice(this.pos, this.data.length);
    };

  /**
   * Returns a copy of the response parser's buffer as JavaScript Unicode string.
   *
   * Manage Sieve encodes literals in UTF-8 while network sockets are usualy
   * binary. So we can't use java scripts build in string functions as they expect
   * pure unicode.
   *
   * @param {int} [startIndex]
   *   Optional zero-based index at which to begin.
   * @param {int} [endIndex]
   *   Optional Zero-based index at which to end.
   * @return {String} the copy buffers content
   */
  SieveAbstractResponseParser.prototype.getData
    = function (startIndex, endIndex) {

      if (typeof(endIndex) === "undefined" || endIndex === null)
        endIndex = this.data.length;

      if (typeof(startIndex) === "undefined" || startIndex === null)
        startIndex = this.pos;

      let byteArray = this.data.slice(startIndex, endIndex);
      return this.convertToString(byteArray);
    };


  /**
   * Check if the buffer is empty. This means the buffer does not contain any
   * extractable bytes or tokens.
   *
   * @return {Boolean}
   *   true if the buffer is empty, otherwise false
   */
  SieveAbstractResponseParser.prototype.isEmpty
    = function () {
      if (this.data.length >= this.pos)
        return true;

      return false;
    };

  exports.SieveAbstractResponseParser = SieveAbstractResponseParser;

})(module.exports || this);
