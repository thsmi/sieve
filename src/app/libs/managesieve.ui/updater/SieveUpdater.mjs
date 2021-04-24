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


const SIEVE_GITHUB_UPDATE_URL = "https://thsmi.github.io/sieve/update.json";
const MAJOR_VERSION = 0;
const MINOR_VERSION = 1;
const PATCH_VERSION = 2;

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
    const value = Number.parseInt(version, 10);

    if (Number.isInteger(value))
      return value;

    return Number.NaN;
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
  isLessThan(newVersion, currentVersion) {

    const newValue = this.getInt(newVersion);
    const currentValue = this.getInt(currentVersion);

    // in case conversion failed we use string comparison
    if (newValue === Number.NaN || currentValue === Number.NaN)
      return (newVersion < currentVersion);

    return newValue < currentValue;
  }

  /**
   * Checks if the current version is greater than the new version.
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
   *    true in case the new version is larger than the current
   *    false in the new version is smaller than the current.
   */
  isGreaterThan(newVersion, currentVersion) {
    const newValue = this.getInt(newVersion);
    const currentValue = this.getInt(currentVersion);

    // in case conversion failed we use string comparison
    if (newValue === Number.NaN || currentValue === Number.NaN)
      return (newVersion > currentVersion);

    return newValue > currentValue;
  }

  /**
   * Compares if the next version is older than the current version.
   *
   * @param {string} next
   *   the next version as dot separated string.
   * @param {string} current
   *   the current version as dot separated string.
   * @returns {boolean}
   *   true in case the current version is older than the next version otherwise false.
   */
  isOlder(next, current) {
    current = current.split(".");
    next = next.split(".");

    // In case the new major is larger, then this version is definitely older.
    if (this.isGreaterThan(next[MAJOR_VERSION], current[MAJOR_VERSION]))
      return false;
    // In case the new major is smaller, then this version is definitely newer.
    if (this.isLessThan(next[MAJOR_VERSION], current[MAJOR_VERSION]))
      return true;

    // In case it is equal we need to check at the minor version
    // In case the new minor is larger, then this version is definitely older.
    if (this.isGreaterThan(next[MINOR_VERSION], current[MINOR_VERSION]))
      return false;
    // In case the new minor is smaller, then this version is definitely newer.
    if (this.isLessThan(next[MINOR_VERSION], current[MINOR_VERSION]))
      return true;

    // In case it is equal we need to check the patch level.
    // It is newer if it is larger
    if (this.isGreaterThan(next[PATCH_VERSION], current[PATCH_VERSION]))
      return false;

    // Otherwise in case it is less or equal, the version is older or the same.
    return true;
  }

  /**
   * Compares the current version against the manifest.
   * @param {object} manifest
   *   the manifest with the version information
   * @param {string} currentVersion
   *   the apps current version.
   * @returns {boolean}
   *   false if the current version is the latest.
   *   true in case the manifest contains a newer version definition.
   */
  compare(manifest, currentVersion) {
    const items = manifest["addons"]["sieve@mozdev.org"]["updates"];

    // There are no updates if all entries are less or equal to the current version
    for (const item of items) {

      if (this.isOlder(item.version, currentVersion))
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

    const currentVersion = await (require('electron').ipcRenderer.invoke("get-version"));

    return this.compare(
      await (await fetch(SIEVE_GITHUB_UPDATE_URL)).json(),
      currentVersion);
  }
}

export { SieveUpdater };
