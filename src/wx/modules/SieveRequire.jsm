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
 * Implements a minimal CommonJS compatible implementation.
 *
 * It emulates the node.js CommonJS implementation as described here
 * http://fredkschott.com/post/2014/06/require-and-the-module-system/
 *
 * The sandbox loading code is based on the base-loader from mozilla's devtools.
 * See mozilla-central/source/devtools/shared/base-loader.js and
 * mozilla-central/source/devtools/shared/loader-plugin-raw.jsm for more details.
 */
(function (exports) {

  "use strict";

  const JS_EXTENSION = ".js";

  /* global Components */
  /* global ChromeUtils */

  const { NetUtil } = ChromeUtils.import("resource://gre/modules/NetUtil.jsm");

  /**
   * Manages a simple CommonJS Module.
   * It implements a sandbox in which the modules code lives.
   */
  class Module {

    /**
     * Creates a new CommonJS Module.
     *
     * @param {Modules} modules
     *   a reference to the parent module.
     * @param {string} uri
     *   the uri to the modules source code.
     */
    constructor(modules, uri) {

      this.modules = modules;
      this.uri = uri;

      const systemPrincipal = Components
        .classes["@mozilla.org/systemprincipal;1"]
        .createInstance(Components.interfaces.nsIPrincipal);

      // create a new scope.
      this.sandbox = new Components.utils.Sandbox(systemPrincipal, {
        wantGlobalProperties: ["XMLHttpRequest", "TextEncoder", "TextDecoder", "atob", "btoa"],
        wantXrays: false,
        freshCompartment: false
        // invisibleToDebugger: true
      });

      // then push a reference to our require function to it
      this.sandbox.require = (url) => { return this.modules.require(url); };
      this.sandbox.Error = Error;
      // and create a dummy modules.exports
      this.sandbox.module = { exports: {} };
      // and a exports.
      this.sandbox.export = {};
    }

    /**
     * Invalidates the module and releases the sandbox.
     * This should immediately remove all references to any sandboxed element
     * including listeners.
     * So be care full when calling this.
     */
    invalidate() {
      if (this.sandbox === null)
        return;

      this.modules.log(`Nuking sandbox for ${this.uri} ...`);

      delete this.sandbox.require;
      delete this.sandbox.Error;
      delete this.sandbox.module;
      delete this.sandbox.export;

      try {
        Components.utils.nukeSandbox(this.sandbox);
      } catch (ex) {
        // If nuke failed we just ignore it as we can't do anything about it.
      }

      this.sandbox = null;
      this.modules = null;
    }

    /**
     * Returns the module's exports
     * In case the module is loaded and empty object is returned.
     *
     * @returns {object}
     *   the modules exports
     */
    getExports() {
      return this.sandbox.module.exports;
    }


    /**
     * Reads from the given resource and returns the result.
     *
     * @param {string} uri
     *   the uri to be read
     * @returns {string}
     *   the uri's content as string.
     */
    readURI(uri) {
      this.modules.log(`Reading url ${uri}`);

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
     * Loads a commonjs module into the sandbox.
     */
    load() {

      if (this.sandbox === null)
        throw new Error("Module was invalidated and cannot be reused.");

      this.modules.log(`Loading CommonJS Module from ${this.uri}`);

      const script = this.readURI(this.uri);

      Components.utils.evalInSandbox(script, this.sandbox);

      if (!this.sandbox.module || !this.sandbox.module.exports)
        throw new Error(`Failed to load CommonJS Module ${this.uri}`);

      if (!Object.getOwnPropertyNames(this.sandbox.module.exports).length)
        throw new Error(`Module does not export anything ${this.uri}`);
    }
  }

  /**
   * Manages the CommonJS modules as well as their cache.
   */
  class Modules {

    /**
     * Creates a new instance.
     *
     * @param {string} base
     *   an optional prefix.
     *
     * @param {Function} [logger]
     *   a function which wraps a logger call.
     *   in case omitted the logger will be disabled
     *
     */
    constructor(base, logger) {

      if (base.endsWith("/"))
        base = base.slice(0, -1);

      this.base = base;

      this.cache = new Map();

      this.logger = logger;
    }

    /**
     * Logs a message in case a logger was set in the constructor.
     *
     * @param {string} msg
     *   the log message
     */
    log(msg) {
      if (typeof(this.logger) === "undefined" || this.logger === null)
        return;

      this.logger(msg);
    }

    /**
     * Resolves and normalizes the given uri. This means it converts
     * a relative uri into an absolute one.
     *
     * @param {string} uri
     *   the uri to be normalized.
     *
     * @returns {string}
     *   the normalize uri
     */
    resolve(uri) {
      this.log(`Resolving ${uri}`);

      if (!uri.endsWith(JS_EXTENSION))
        throw new Error(`Not a JavaScript file ${uri}`);

      if (uri.startsWith("./"))
        uri = this.base + uri.substring(1);

      return uri;
    }

    /**
     * Loads a CommonJS module into this cache.
     *
     * @param {string} uri
     *   the uri of the module to be loaded.
     *
     * @returns {object}
     *   the modules exports
     */
    require(uri) {

      uri = this.resolve(uri);

      this.log(`Loading CommonJS Module from ${uri}`);

      if (this.cache.has(uri)) {
        this.log(`Cache hit for ${uri}`);
        return this.cache.get(uri).getExports();
      }

      const module = new Module(this, uri);
      this.cache.set(uri, module);

      try {
        module.load();
      } catch (ex) {
        this.log(ex);

        this.cache.delete(uri);
        throw ex;
      }

      return module.getExports();
    }

    /**
     * Clears and invalidates all cached values.
     */
    invalidate() {
      for (const item of this.cache.values())
        item.invalidate();

      this.cache.clear();
    }
  }

  exports.Modules = Modules;

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  exports.EXPORTED_SYMBOLS.push("Modules");

})(this);
