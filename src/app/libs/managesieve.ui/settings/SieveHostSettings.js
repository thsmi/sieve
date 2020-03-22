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

  const HOST_TYPE_CUSTOM = 1;

  const CONFIG_HOST_TYPE = "activeHost";

  const { SieveAbstractMechanism } = require("./SieveAbstractMechanism.js");
  const { SieveCustomHost } = require("./SieveAbstractHost.js");

  /**
   * Extends the CustomHost implementation by a display name and fingerprint setting
   **/
  class SieveCustomHostEx extends SieveCustomHost {

    /**
     * The human readable display name for this account.
     * It can be any valid javascript string.
     *
     * @returns {string}
     *   the display name
     **/
    async getDisplayName() {
      return await this.account.getConfig().getString("host.displayName", "Unnamed Account");
    }

    /**
     * Sets the account display name.
     * @param {string} value
     *   sets the account's display name
     * @returns {SieveCustomHostEx}
     *   a self reference
     */
    async setDisplayName(value) {
      await this.account.getConfig().setString("host.displayName", value);
      return this;
    }

    /**
     * Each certificate has a unique fingerprint.
     *
     * Normally this fingerprint is not used directly.
     * But in case no chain of trust can be established,
     * the typical fallback is to verify the fingerprint.
     *
     * This is normal case for a self signed certificate.
     *
     * @returns {string}
     *   the accounts fingerprint or an empty string in case no fingerprint is stored.
     **/
    async getFingerprint() {
      return await this.account.getConfig().getString("host.fingerprint", "");
    }

    /**
     * Sets the account's fingerprint.
     *
     * @param {string} value
     *   the accounts fingerprint, or pass an empty string to disable.
     * @returns {SieveCustomHostEx}
     *   a self reference
     */
    async setFingerprint(value) {
      await this.account.getConfig().setString("host.fingerprint", value);
      return this;
    }

    /**
     * Gets the certificate errors to ignore.
     *
     * @returns {string}
     *   the node js error code to ignore as string or an empty string.
     */
    async getIgnoreCertErrors() {
      return await this.account.getConfig().getString("host.ignoreCertErrors", "");
    }

    /**
     * Defines which certificate error code should be ignored.
     *
     * In general it is not a good idea to ignore certificate errors.
     * But there are some exception: e.g. a self signed error
     * after you verified the certificates fingerprint.
     *
     * @param {string} errorCode
     *   the node js error code or an empty string to disable.
     * @returns {SieveCustomHostEx}
     *   a self reference
     */
    async setIgnoreCertErrors(errorCode) {
      await this.account.getConfig().setString("host.ignoreCertErrors", errorCode);
      return this;
    }
  }

  /**
   * A transparent wrapper needed to deal with the different
   * host mechanism which are provided by electron and thunderbird.
   **/
  class SieveHost extends SieveAbstractMechanism {

    /**
     * @inheritdoc
     **/
    getKey() {
      return CONFIG_HOST_TYPE;
    }

    /**
     * @inheritdoc
     **/
    getDefault() {
      return HOST_TYPE_CUSTOM;
    }

    /**
     * @inheritdoc
     */
    hasMechanism(type) {
      switch (type) {
        case HOST_TYPE_CUSTOM:
          return true;

        default:
          return false;
      }
    }

    /**
     * @inheritdoc
     */
    getMechanismById(type) {

      switch (type) {
        default:
          return new SieveCustomHostEx(HOST_TYPE_CUSTOM, this.account);
      }
    }
  }

  exports.SieveHost = SieveHost;

})(module.exports);
