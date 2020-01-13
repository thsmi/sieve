/*
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

(function (exports) {

  "use strict";

  const { SieveAbstractResponseParser } = require("./SieveAbstractResponseParser.js");

  /**
   * Implements a mozilla specific response parser
   **/
  class SieveMozResponseParser extends SieveAbstractResponseParser {

    /**
     * @inheritdoc
     **/
    convertToString(byteArray) {
      // The new code should run with Google and Mozilla
      byteArray = new Uint8Array(byteArray);
      return (new TextDecoder("UTF-8")).decode(byteArray);
    }

    /**
     * @inheritdoc
     **/
    convertToBase64(decoded) {
      return btoa(decoded);
    }

    /**
     * @inheritdoc
     **/
    convertFromBase64(encoded) {
      return atob(encoded);
    }
  }

  exports.SieveResponseParser = SieveMozResponseParser;

})(module.exports);
