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

/**
 * Implements a minimalistic CommonJS compatible implementation.
 *
 * Based on the base loader mozilla-central/source/devtools/shared/base-loader.js and
 * mozilla-central/source/devtools/shared/loader-plugin-raw.jsm from the dev tools.
 */
(function (exports) {

  "use strict";

  const JS_EXTENSION = ".js";

  /* global Components */
  /* global ChromeUtils */

  const { NetUtil } = ChromeUtils.import("resource://gre/modules/NetUtil.jsm");

  /**
   * Reads from the given resource and returns the result.
   *
   * @param {string} uri
   *   the uri to be read
   * @returns {string}
   *   the uri's content as string.
   */
  function readURI(uri) {
    console.log(`Reading url ${uri}`);

    const stream = NetUtil.newChannel({
      uri: NetUtil.newURI(uri, "UTF-8"),
      loadUsingSystemPrincipal: true
    }).open();

    const count = stream.available();
    const data = NetUtil.readInputStreamToString(stream, count, {
      charset: "UTF-8"
    });
    stream.close();

    return data;
  }


  /**
   * Loads a scope with an embedded require function.
   *
   * @param {string} base
   *   the base url.
   * @returns {object}
   *   the new scope with a require function.
   */
  function loadRequire(base) {

    if (base.endsWith("/"))
      base = base.slice(0, -1);

    const cache = new Map();
    /**
     * Emulates loading a commonjs module via a sandbox.
     *
     * @param {string} uri
     *   the path to the file which should be loaded.
     * @returns {object}
     *   the scope with the object loaded by require.
     */
    function require(uri) {

      console.log("Load Require function from " + uri);

      if (!uri.endsWith(JS_EXTENSION))
        throw new Error(`Not a JavaScript file ${uri}`);

      if (uri.startsWith("./"))
        uri = base + uri.substring(1);

      if (cache.has(uri)) {
        console.log("Cache hit for " + uri);
        return cache.get(uri);
      }

      console.log("Loading uri " + uri);
      const script = readURI(uri);

      const systemPrincipal = Components.classes["@mozilla.org/systemprincipal;1"].createInstance(Components.interfaces.nsIPrincipal);

      // TODO we should load everything into the same sandbox...
      // create a new scope.
      const sandbox = new Components.utils.Sandbox(systemPrincipal, {
        wantGlobalProperties: ["XMLHttpRequest", "TextEncoder", "TextDecoder", "atob", "btoa"],
        wantXrays: false,
        freshCompartment: false
        //invisibleToDebugger: true
      });

      sandbox.console = console;
      // then push a reference to our require function to it
      sandbox.require = require;
      sandbox.Error = Error;
      // and create a dummy modules.exports
      sandbox.module = { exports: {} };
      // and a exports.
      sandbox.export = {};


      Components.utils.evalInSandbox(script, sandbox);

      if (!sandbox.module || !sandbox.module.exports)
        throw new Error("Failed to load script" + uri);

      if (Object.getOwnPropertyNames(sandbox.module.exports).length === 0)
        throw new Error("Module does not export anything " + uri);

      cache.set(uri, sandbox.module.exports);
      return sandbox.module.exports;
    }

    return {
      require: require
    };
  }

  exports.loadRequire = loadRequire;

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  exports.EXPORTED_SYMBOLS.push("loadRequire");

})(this);
