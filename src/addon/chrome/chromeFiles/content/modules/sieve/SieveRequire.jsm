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

  /* global Components */

  // let loaded = new Set();

  /**
   * Emulates loading a commonjs module via a subscript loader
   *
   * @param {string} uri
   *   the path to the file which should be loaded.
   * @returns {Object}
   *   the component to load.
   */
  function require(uri) {

    // To deal with relative path's we need some magic to convert them to an absolute path.
    if (uri.startsWith(".")) {
      uri = "chrome://sieve/content/libs/libManageSieve" + uri.substring(1);
    }

    //  if (loaded.has(uri))
    //    throw new Error("Module " + uri + " already loaded");

    const loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
      .getService(Components.interfaces.mozIJSSubScriptLoader);

    // create a new scope.
    let scope = {};

    // then push a reference to our require function to it
    scope.require = require;
    // and create a dummy modules.exports
    scope.module = { exports: {} };
    // and a exports.
    scope.exports = {};

    // eslint-disable-next-line no-unused-vars, no-shadow
    ((module, exports) => {
      loader.loadSubScript(uri, scope, "UTF-8");
    })(scope.module, exports);

    if (!scope.module || !scope.module.exports)
      throw new Error("Failed to load script" + uri);

    if (Object.getOwnPropertyNames(scope.module.exports).length === 0)
      throw new Error("Module does not export anything " + uri);

    // loaded.add(uri);

    return scope.module.exports;
  }

  exports.require = require;

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  exports.EXPORTED_SYMBOLS.push("require");

})(this);
