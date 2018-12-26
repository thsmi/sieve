/*
 * The contents of this file are licenced. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

/* global window */

(function (exports) {

  "use strict";
  /**
   * Manages the dependencies required by sieve elements and components.
   *
   * Examples for valid dependecy descriptions are:
   *
   *   requires: { any: ["vacation-seconds", "vacation"] }
   *   requires: { all: ["variable", "enotify"] }
   *   requires: "spamtest"
   */
  class SieveCapabilities {

    /**
     * Used manage the dependencies.
     * @param {string[]} capabilities
     *   a list with all supported dependencies.
     */
    constructor(capabilities) {
      this.dependencies = new Set();
      this.capabilities = new Set(capabilities);
    }

    /**
     * Checks it the server supports the given dependencies.
     *
     * @param {string|Object} dependencies
     *   the dependencies which should be checked
     * @returns {boolean}
     *   true in case the dependencie is supported otherwise false.
     */
    isCapable(dependencies) {

      if ((dependencies === null) || (typeof (dependencies) === "undefined"))
        return true;

      // there are test like spamtestplus implies spamtest. You can use either one
      // But you should not use both.
      if (typeof (dependencies.any) !== "undefined")
        return this.isCapableOfAny(dependencies.any);

      // Finally there is the all action which is the default
      if (typeof (dependencies.all) !== "undefined") {
        dependencies = dependencies.all;
      }

      // all
      return this.isCapableOfAll(dependencies);
    }

    /**
     * Checks if all of the fiven dependencies are supported by the server
     * @param {string|string[]} dependencies
     *   the dependency or dependencies to test
     * @returns {boolean}
     *   true in case all of the dependencies are supported. Otherwise false.
     */
    isCapableOfAll(dependencies) {

      if (!Array.isArray(dependencies))
        dependencies = [dependencies];

      for (let dependency of dependencies)
        if (!this.capabilities.has(dependency))
          return false;

      return true;
    }

    /**
     * Checks if at least one of the given dependencies is supported by the server
     * @param {string|string[]} dependencies
     *   the dependency or dependencies to test
     * @returns {boolean}
     *   true in case at least one dependency is supported otherwise false.
     */
    isCapableOfAny(dependencies) {

      if (!Array.isArray(dependencies))
        dependencies = [dependencies];

      for (let dependency of dependencies)
        if (this.capabilities.has(dependency))
          return true;

      return false;
    }

    /**
     * Ensures the given dependenies are supported by the server.
     *
     * @param {string| Object} [dependencies]
     *   It can be a plain string or a more complex object. The complex objects are
     *   used to realize "any" of or "all" of stucts.
     *
     * @returns {SieveCapabilities}
     *   a self reference
     */
    require(dependencies) {

      if ((dependencies === null) || (typeof (dependencies) === "undefined"))
        return this;

      // there are test like spamtestplus which implies spamtest. You can use either one
      // But you should not use both.
      if (typeof (dependencies.any) !== "undefined")
        return this.requireAny(dependencies.any);

      // Finally there is the all action which is the default
      if (typeof (dependencies.all) !== "undefined") {
        dependencies = dependencies.all;
      }

      // all
      return this.requireAll(dependencies);
    }

    /**
     * Ensures all the required dependencies are supported.
     * In case the dependency can not be resolved an exception it thrown.
     *
     * @param  {string} dependencies
     *   the required dependencies which all need to be fullfilled.
     *
     * @returns {SieveCapabilities}
     *   a self reference
     */
    requireAll(dependencies) {

      if (!Array.isArray(dependencies))
        dependencies = [dependencies];

      for (let dependency of dependencies) {

        if (!this.capabilities.has(dependency))
          throw new Error("The required dependency " + dependency + " is not supported by the server");

        this.dependencies.add(dependency);
      }

      return this;
    }

    /**
     * Ensures that at least one onf the required dependencies.
     * The list is ordered which means the firs dependency is the most prefered one.
     * In case it can not be fulfiled  the next one will be tried.
     *
     * In case none of the dependencies match an exception will be throw.
     *
     * @param  {...string} dependencies
     *   a list with dependencies, from which at least one needs to be fullfilled
     *
     * @returns {SieveCapabilities}
     *   a self reference
     */
    requireAny(dependencies) {

      for (let dependency of dependencies) {
        if (!this.capabilities.has(dependency))
          continue;

        this.dependencies.add(dependency);
        return this;
      }

      throw new Error("None of the dependencies " + dependencies + " is supported by the server");
    }

    /**
     * Clears all of the currend dependencies.
     *
     * @returns {SieveCapabilities}
     *   a self reference
     */
    clear() {
      this.dependencies.clear();
      return this;
    }

    /**
     * Checks if the servers supports the given capability string.
     * @param {string} capability
     *   the capability which should be checked.
     * @returns {boolean}
     *   true in case the capability is supported by the server otherwise false.
     */
    hasCapability(capability) {
      return this.capabilities.has(capability);
    }
  }

  exports.SieveCapabilities = SieveCapabilities;

})(window);
