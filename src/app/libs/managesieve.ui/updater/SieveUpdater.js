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

  const SIEVE_GITHUB_UPDATE_URL = "https://thsmi.github.io/sieve/update.json";
  const MAJOR_VERSION = 0;
  const MINOR_VERSION = 1;
  const PATCH_VERSION = 2;

  /* global $ */

  /**
   * Checks for Updates on github.
   */
  class SieveUpdater {

    /**
     * Converts the given string into an integer
     * @param {string} version
     *   the version number as string which should be converted to integer.
     * @returns {Integer|NaN}
     *   returns the integer value or NaN in case the string is no integer.
     */
    getInt(version) {
      const value = parseInt(version, 10);

      if (Number.isInteger(value))
        return value;

      return Number.NaN;
    }

    /**
     * Checks if the current version is less or equal to the new version.
     *
     * For comparison the string values are converted to an integer.
     * In case no integer comparison is possible a string comparison will be performed.
     *
     * @param {string} newVersion
     *   the new version as string
     * @param {string} currentVersion
     *   the current version as string
     *
     * @returns {boolean}
     *   true in case the new version is less than or equal to the old version
     *   otherwise true
     */
    lessThanOrEqual(newVersion, currentVersion) {
      const newValue = this.getInt(newVersion);
      const currentValue = this.getInt(currentVersion);

      // in case conversion failed we use string comparison
      if (newValue === Number.NaN || currentValue === Number.NaN)
        return (newVersion <= currentVersion);

      // otherwise we compare as int
      return newValue <= currentValue;
    }

    /**
     * Checks if the current version is less than the new version.
     *
     * For comparison the string values are converted to an integer.
     * In case no integer comparison is possible a string comparison will be performed.
     *
     * @param {string} newVersion
     *   the new version as string
     * @param {string} currentVersion
     *   the current version as string
     *
     * @returns {boolean}
     *    false in case the current version is the latest
     *    true in case there is a newer version
     */
    lessThan(newVersion, currentVersion) {

      const newValue = this.getInt(newVersion);
      const currentValue = this.getInt(currentVersion);

      // in case conversion failed we use string comparison
      if (newValue === Number.NaN || currentValue === Number.NaN)
        return (newVersion < currentVersion);

      return newValue < currentValue;
    }

    /**
     * Compares the current version against the manifest.
     * @param {object} manifest
     *   the manifest with the version information
     * @param {string} currentVersion
     *   the apps current version.
     * @returns {boolean}
     *   false if the current version is the latest.
     *   true in case the manifast contains a newer version definition.
     */
    compare(manifest, currentVersion) {
      currentVersion = currentVersion.split(".");
      const items = manifest["addons"]["sieve@mozdev.org"]["updates"];

      for (const item of items) {
        const version = item.version.split(".");

        if (this.lessThan(version[MAJOR_VERSION], currentVersion[MAJOR_VERSION]))
          continue;

        if (this.lessThan(version[MINOR_VERSION], currentVersion[MINOR_VERSION]))
          continue;

        if (this.lessThanOrEqual(version[PATCH_VERSION], currentVersion[PATCH_VERSION]))
          continue;

        return true;
      }

      return false;
    }

    /**
     * Checks the if any updates are published at github.
     * @returns {boolean}
     *  true if newer version are available, otherwise false.
     */
    async check() {
      return await new Promise((resolve, reject) => {

        const currentVersion = require('electron').remote.app.getVersion();

        $.getJSON(SIEVE_GITHUB_UPDATE_URL)
          .done((data) => {
            resolve(this.compare(data, currentVersion));
          })
          .fail(() => {
            reject(new Error("Failed to update script"));
          });
      });
    }
  }


  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveUpdater = SieveUpdater;
  else
    exports.SieveUpdater = SieveUpdater;

})(this);
