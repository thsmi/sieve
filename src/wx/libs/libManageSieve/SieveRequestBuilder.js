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

  const { SieveAbstractRequestBuilder } = require("./SieveAbstractRequestBuilder.js");

  /**
   * @inheritdoc
   */
  class SieveMozRequestBuilder extends SieveAbstractRequestBuilder {

    /**
     * Manage Sieve uses for literals UTF-8 as encoding, network sockets are usually
     * binary, and javascript is something in between. This means we have to convert
     * UTF-8 into a binary by our own...
     *
     * @param {string} str The binary string which should be converted
     * @returns {string} The converted string in UTF8
     *
     * @author Thomas Schmid <schmid-thomas@gmx.net>
     */
    jsStringToByteArray(str) {
      // with chrome we have to use the TextEncoder.
      const data = new Uint8Array(new TextEncoder("UTF-8").encode(str));
      return Array.prototype.slice.call(data);
    }

    /**
     * @inheritdoc
     */
    calculateByteLength(data) {
      return this.jsStringToByteArray(data).length;
    }

    /**
     * @inheritdoc
     */
    convertToBase64(decoded) {

      // btoa is a bit strange it requires a javascript (unicode) string
      // which contains only latin1 code point.

      if (Array.isArray(decoded))
        decoded = String.fromCharCode(...new Uint8Array(decoded));

      return btoa(decoded);
    }

    /**
     * @inheritdoc
     **/
    convertFromBase64(encoded) {
      return atob(encoded);
    }
  }

  exports.SieveRequestBuilder = SieveMozRequestBuilder;

})(module.exports);
