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

  /**
   * Gets the module for the given name.
   * In case it is not loaded into the current scope an exception will be thrown.
   *
   * @param {string} name
   *   the unique module name.
   * @returns {object}
   *   the module.
   */
  function getModule(name) {

    if (exports.module && exports.module.exports && exports.module.exports[name])
      return exports.module.exports[name];

    if (exports[name])
      return exports[name];

    throw new Error(`Module ${name} not loaded into scope`);
  }

  /**
   * Gets a list of modules.
   * It will throw an exceptin in case one or more of the module
   * names could not be loaded from the current scope
   *
   * @param  {...string} names
   *   a list of module names
   * @returns {object}
   *   the modules.
   */
  function getModules(...names) {

    const m = {};

    for (const name of names)
      m[name] = getModule(name);

    return m;
  }

  const globals = new Map();
  globals.set("./SieveUniqueId.js", "SieveUniqueId");
  globals.set("./libs/managesieve.ui/utils/SieveUniqueId.js", "SieveUniqueId");

  globals.set("./SieveAbstractIpcClient.js", "SieveAbstractIpcClient");

  /**
   * A fake CommonJs Module implementation.
   * Temporaily needs as node does not yes support ES6 modules.
   * And mozilla does not really support CommonJS
   *
   * @param {string} module
   *   the module to be loaded
   *
   * @returns {object}
   *   the module or an exception.
   */
  function fakeRequire(module) {

    if (globals.has(module))
      return getModules(globals.get(module));

    throw new Error(`Module ${module} unknown to fake module loader`);
  }


  // In case there is no require in our scope we add our fake.
  if (typeof(exports.require) !== "undefined" && exports.require !== null) {
    exports.require = fakeRequire();
  }


  exports.require = fakeRequire;
})(this);
