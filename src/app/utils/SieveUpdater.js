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
     * Compares the current version against the manifest.
     * @param {object} manifest
     *   the manifest with the version information
     * @param {String} currentVersion
     *   the apps current version.
     * @returns {boolean}
     *   false if the current version is the latest.
     *   true in case the manifast contains a newer version definition.
     */
    compare(manifest, currentVersion) {

      currentVersion = currentVersion.split(".");
      let items = manifest["addons"]["sieve@mozdev.org"]["updates"];

      for (let item of items) {
        let version = item.version.split(".");

        if (version[MAJOR_VERSION] < currentVersion[MAJOR_VERSION])
          continue;

        if (version[MINOR_VERSION] < currentVersion[MINOR_VERSION])
          continue;

        if (version[PATCH_VERSION] <= currentVersion[PATCH_VERSION])
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
      return new Promise((resolve, reject) => {

        let currentVersion = require('electron').remote.app.getVersion();

        $.getJSON(SIEVE_GITHUB_UPDATE_URL)
          .done( (data) => {
            resolve(this.compare(data, currentVersion));
          })
          .fail( () => {
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
