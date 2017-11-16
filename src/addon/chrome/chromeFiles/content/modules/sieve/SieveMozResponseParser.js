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
  /* global SieveAbstractResponseParser */
  Components.utils.import("chrome://sieve-common/content/libManageSieve/SieveAbstractResponseParser.js");

  function SieveMozResponseParser(data) {
    SieveAbstractResponseParser.call(this, data);
  }

  SieveMozResponseParser.prototype = Object.create(SieveAbstractResponseParser.prototype);
  SieveMozResponseParser.prototype.constructor = SieveMozResponseParser;

  SieveMozResponseParser.prototype.convertToString = function (byteArray) {
    // This is very old mozilla specific code, but it is robust, mature and works as expeced.
    // It will be dropped as soon as the new code has proven to be stable.
    if ((typeof Components !== 'undefined')
      && (typeof Components.classes !== 'undefined')
      && (Components.classes["@mozilla.org/intl/scriptableunicodeconverter"])) {

      let converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
        .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
      converter.charset = "UTF-8";

      return converter.convertFromByteArray(byteArray, byteArray.length);
    }

    // The new code should run with Google and Mozilla
    byteArray = new Uint8Array(byteArray);
    return (new TextDecoder("UTF-8")).decode(byteArray);
  };

  SieveMozResponseParser.prototype.convertToBase64 = function (decoded) {
    return btoa(decoded);
  };

  SieveMozResponseParser.prototype.convertFromBase64 = function (encoded) {
    return atob(encoded);
  };

  exports.SieveMozResponseParser = SieveMozResponseParser;

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  exports.EXPORTED_SYMBOLS.push("SieveMozResponseParser");
})(this);
