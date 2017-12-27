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

"use strict";

(function (exports) {

  /* global Components */
  /* global SieveAbstractRequestBuilder */
  Components.utils.import("chrome://sieve-common/content/libManageSieve/SieveAbstractRequestBuilder.js");

  /**
   * @inheritdoc
   * @constructor
   */
  function SieveMozRequestBuilder() {
    this.data = "";
  }

  SieveMozRequestBuilder.prototype = Object.create(SieveAbstractRequestBuilder.prototype);
  SieveMozRequestBuilder.prototype.constructor = SieveMozRequestBuilder;

  /**
   * Manage Sieve uses for literals UTF-8 as encoding, network sockets are usualy
   * binary, and javascript is something in between. This means we have to convert
   * UTF-8 into a binary by our own...
   *
   * @param {String} str The binary string which should be converted
   * @return {String} The converted string in UTF8
   *
   * @author Thomas Schmid <schmid-thomas@gmx.net>
   * @author Max Dittrich
   */
  SieveMozRequestBuilder.prototype.jsStringToByteArray = function(str)
  {
    // This is very old mozilla specific code, but it is robust, mature and works as expeced.
    // It will be dropped as soon as the new code has proven to be stable.
    if ((typeof Components !== 'undefined')
            && (typeof Components.classes !== 'undefined')
            && (Components.classes["@mozilla.org/intl/scriptableunicodeconverter"])) {

      // ...and convert to UTF-8
      let converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
        .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

      converter.charset = "UTF-8";

      return converter.convertToByteArray(str, {});
    }

    // with chrome we have to use the TextEncoder.
    let data = new Uint8Array(new TextEncoder("UTF-8").encode(str));
    return Array.prototype.slice.call(data);
  };

  SieveMozRequestBuilder.prototype.calculateByteLength = function (data) {
    return this.jsStringToByteArray(data).length;
  };

  SieveMozRequestBuilder.prototype.convertToBase64 = function (decoded) {
    return btoa(decoded);
  };

  SieveMozRequestBuilder.prototype.convertFromBase64 = function (encoded) {
    return atob(encoded);
  };

  exports.SieveMozRequestBuilder = SieveMozRequestBuilder;

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  exports.EXPORTED_SYMBOLS.push("SieveMozRequestBuilder");

})(this);
