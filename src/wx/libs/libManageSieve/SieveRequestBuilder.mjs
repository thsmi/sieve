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


import { SieveAbstractRequestBuilder } from "./SieveAbstractRequestBuilder.mjs";

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
    const data = new Uint8Array(new TextEncoder().encode(str));
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

    // Convert from a js string to an utf8 byte array
    decoded = new TextEncoder().encode(decoded);

    // and we the byte array into a string. This is done byte by byte
    // not character by character so that we end up with an ASCII string
    // in UTF Encoding.
    decoded = String.fromCodePoint(...new Uint8Array(decoded));

    // This is needed because btoa accepts only ASCII strings. Which then
    // can be converted into base64
    return btoa(decoded);
  }

  /**
   * @inheritdoc
   **/
  convertFromBase64(encoded) {
    return atob(encoded);
  }
}

export { SieveMozRequestBuilder as SieveRequestBuilder };
