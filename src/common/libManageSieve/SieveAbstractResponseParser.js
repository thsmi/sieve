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

  const CHAR_LF = 10;
  const CHAR_CR = 13;
  const CHAR_SPACE = 32;
  const CHAR_QUOTE = 34;
  const CHAR_BACKSLASH = 92;
  const CHAR_LEFT_BRACES = 123;
  const CHAR_RIGHT_BRACES = 125;

  const NOT_FOUND = -1;
  const CHAR_LEN = 1;

  /**
   * The manage sieve protocol syntax uses a fixed gramar which is based on atomar tokens.
   * This class offers an interface to test for and extract these predefined tokens. It supports
   * Strings (Quoted and Literal), White Space (Line Break, Space ...) as well as arbitraty tokens.
   *
   * The parser does not change or alter the byte array's content. So extracting data does not shrink
   * the array free any bytes. This parser is just somekind of a view to this array.
   *
   * Tokens are automatically converted from UTF-8 encoded byte arrays to JavaScript Unicode Strings
   * during extraction.
   */
  class SieveAbstractResponseParser {

    /**
     * Expects as input a byte array using UTF-8 encoding. It's because the manage sieve
     * protocol is defined to uses UTF-8 encoding and Mozilla sockets return byte based incoming messages streams.
     * @param {byte[]} data
     *   the response which should be parsed as a byte array encoded in UTF-8
     */
    constructor(data) {
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
     *
     */
    extract(size) {
      this.pos += size;
    }

    /**
     * Tests if the array starts with a line break (#13#10)
     *
     * @returns {boolean}
     *   true if the buffer with a line break, otherwise false
     */
    isLineBreak() {
      // Are we out of bounds?
      if (this.data.length < this.pos + CHAR_LEN)
        return false;

      // Test for a linebreak #13#10
      if (this.data[this.pos] !== CHAR_CR)
        return false;

      if (this.data[this.pos + CHAR_LEN] !== CHAR_LF)
        return false;

      return true;
    }

    /**
     * Extracts a line break (#13#10) for the buffer
     *
     * If it does not start with a line break an exception is thrown.
     *
     * @returns {SieveAbstractResponseParser}
     *   a self reference
     */
    extractLineBreak() {
      if (this.isLineBreak() === false)
        throw new Error("Linebreak expected but found:\n" + this.getData());

      this.pos += 2;

      return this;
    }

    /**
     * Test if the buffer starts with a space character (#32)
     * @returns {boolean}
     *   true if buffer starts with a space character, otherwise false
     */
    isSpace() {
      if (this.data[this.pos] === CHAR_SPACE)
        return true;

      return false;
    }

    /**
     * Extracts a space character (#32) form the buffer
     *
     * If it does not start with a space character an exception is thrown.
     *
     */
    extractSpace() {
      if (this.isSpace() === false)
        throw new Error("Space expected but found:\n" + this.getData());

      this.pos++;
    }

    /**
     * Tests if the current buffer position is a literal string.
     * Literals strings are defined as:
     *
     * literal = "{" number  "+}" CRLF *OCTET
     *
     * @returns {boolean}
     *   true in case it is a literal otherwise false.
     */
    isLiteral() {
      if (this.data[this.pos] === CHAR_LEFT_BRACES)
        return true;

      return false;
    }

    /**
     * Extracts a literal string from the current position.
     * Literals strings are defined as:
     *
     * literal = "{" number  "+}" CRLF *OCTET
     *
     * Please not it is perfectly fine to have a literal with a zero byte length.
     *
     * @returns {string}
     *   the string or an exception in case the literal could not be extracted.
     */
    extractLiteral() {
      if (this.isLiteral() === false)
        throw new Error("Literal Expected but found\n" + this.getData());

      // remove the "{"
      this.pos++;

      // some sieve implementations are broken, this means ....
      // ... we can get "{4+}\r\n1234" or "{4}\r\n1234"

      let nextBracket = this.indexOf(CHAR_RIGHT_BRACES);
      if (nextBracket === NOT_FOUND)
        throw new Error("Error unbalanced parentheses \"{\" in\n" + this.getData());

      // extract the size, and ignore "+"
      let size = parseInt(this.getData(this.pos, nextBracket).replace(/\+/, ""), 10);

      this.pos = nextBracket + CHAR_LEN;

      this.extractLineBreak();

      // extract the literal...
      let literal = this.getData(this.pos, this.pos + size);
      this.pos += size;

      return literal;
    }

    /**
     * Searches the buffer for a character.
     *
     * @param {byte} character
     *   the chararcter which should be found
     * @param {int} [offset]
     *   an absolut offset, from which to start searching
     * @returns {int} character
     *   the characters absolute position within the buffer otherwise -1 if not found
     */
    indexOf(character, offset) {
      if (typeof (offset) === "undefined")
        offset = this.pos;

      for (let i = offset; i < this.data.length; i++)
        if (this.data[i] === character)
          return i;

      return NOT_FOUND;
    }

    /**
     * Test if the buffer starts with a quote character (#34)
     * @returns {boolean}
     *   true if buffer starts with a quote character, otherwise false
     */
    isQuoted() {
      if (this.data[this.pos] === CHAR_QUOTE)
        return true;

      return false;
    }

    /**
     * Extracts a quoted string form the buffer. It is aware of escape sequences.
     *
     * If it does not start with a valid string an exception is thrown.
     *
     * @returns {string}
     *   the quoted string extracted, it is garanteed to be free of escape sequences
     */
    extractQuoted() {
      if (this.isQuoted() === false)
        throw new Error("Quoted string expected but found \n" + this.getData());

      // now search for the end. But we need to be aware of escape sequences.
      let nextQuote = this.pos + CHAR_LEN;

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

      let quoted = this.getData(this.pos + CHAR_LEN, nextQuote);

      this.pos = nextQuote + CHAR_LEN;

      // Cleanup escape sequences
      quoted = quoted.replace(/\\"/g, '"');
      quoted = quoted.replace(/\\\\/g, '\\');

      return quoted;
    }

    /**
     * Tests if the a quoted or literal string starts at the current position.
     *
     * @returns {boolean}
     *   true if a strings starts, otherwise false
     */
    isString() {
      if (this.isQuoted())
        return true;

      if (this.isLiteral())
        return true;

      return false;
    }

    /**
     * Extracts a quoted or literal string from the current position
     *
     * @returns {string}
     *   the quote or literal string or an exception in case no string could be extracted.
     */
    extractString() {
      if (this.isQuoted())
        return this.extractQuoted();
      if (this.isLiteral())
        return this.extractLiteral();

      throw new Error("String expected but found\n" + this.getData());
    }

    /**
     * Extracts a token form a response. The token is beeing delimited by any
     * separator. The extracted token does not include the separator.
     *
     * Throws an exception if none of the separators is found.
     *
     * @param {byte[]} separators
     *   an array containing possible token separators. The first match always wins.
     * @returns {string}
     *   the extracted token.
     */
    extractToken(separators) {
      // Search for the separators, the one with the lowest index which is not...
      // ... equal to -1 wins. The -2 indecates not initalized...
      let index = NOT_FOUND;

      for (let i = 0; i < separators.length; i++) {
        let idx = this.indexOf(separators[i], this.pos);

        if (idx === NOT_FOUND)
          continue;

        if (index === NOT_FOUND)
          index = idx;
        else
          index = Math.min(index, idx);
      }

      if (index === NOT_FOUND)
        throw new Error("Delimiter >>" + separators + "<< not found in: " + this.getData());

      let token = this.getData(this.pos, index);
      this.pos = index;

      return token;
    }

    /**
     * Tests if the buffer starts with the specified bytes.
     *
     * As the buffer is encoded in UTF-8, the specified bytes have to be
     * encoded in UTF-8, otherwise the result is unpredictable.
     *
     * @param {Byte[]} bytes
     *   the bytes to compare as byte array encoded in UTF-8
     *
     * @returns {boolean}
     *   true if bytes match the beginning of the buffer, otherwise false
     */
    startsWith(bytes) {
      if (!bytes.length)
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
    }

    /**
     * Returns a copy of the current buffer.
     *
     * @returns {byte[]}
     *   an a copy of the array's current view. It is encoded in UTF-8
     */
    getByteArray() {
      return this.data.slice(this.pos, this.data.length);
    }

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
     * @returns {string} the copy buffers content
     */
    getData(startIndex, endIndex) {

      if (typeof (endIndex) === "undefined" || endIndex === null)
        endIndex = this.data.length;

      if (typeof (startIndex) === "undefined" || startIndex === null)
        startIndex = this.pos;

      let byteArray = this.data.slice(startIndex, endIndex);
      return this.convertToString(byteArray);
    }


    /**
     * Check if the buffer is empty. This means the buffer does not contain any
     * extractable bytes or tokens.
     *
     * @returns {boolean}
     *   true if the buffer is empty, otherwise false
     */
    isEmpty() {
      if (this.data.length >= this.pos)
        return true;

      return false;
    }

    /**
     * Converts a bytearray into an UTF8 encoded string
     *
     * @param {byte[]} byteArray
     *   the byte array which should be converted.
     *
     * @returns {string}
     *   the UT8 encoded string.
     *
     * @abstract
     */
    convertToString(byteArray) {
      throw new Error("convertToString(" + byteArray + ")");
    }

    /**
     * Encodes a clear text string to a base64 encoded string.
     *
     * @param {string} decoded
     *   the clear text string which should be encoded.
     * @returns {string}
     *   the base64 encoded string.
     *
     * @abstract
     */
    convertToBase64(decoded) {
      throw new Error("Implement convertToBase64(" + decoded + ")");
    }


    /**
     * Decodes an base64 encoded string into a cleat text string.
     *
     * @param {string} encoded
     *   the base64 encoded string which should be decoded.
     * @returns {string}
     *   the decoded string.
     *
     * @abstract
     */
    convertFromBase64(encoded) {
      throw new Error("Implement convertFromBase64(" + encoded + ")");
    }
  }

  exports.SieveAbstractResponseParser = SieveAbstractResponseParser;

})(module.exports || this);
