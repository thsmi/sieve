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

  const PREF_MECHANISM = "security.mechanism";
  const PREF_TLS = "security.tls";

  /**
   * Manages the account's security related settings
   */
  class SieveSecurity {

    /**
     * Creates a new instance
     * @param {SieveAccount} account
     *   the account with is associated with this account.
     */
    constructor(account) {
      this.account = account;
    }

    /**
     * Gets the currently configured sasl mechanism.
     *
     * @returns {string}
     *   the sasl mechanism
     **/
    getMechanism() {
      return this.account.prefs.getString(PREF_MECHANISM, "default");
    }

    /**
     * Sets the sasl mechanism
     *
     * @param {string} mechanism
     *   the sasl mechanism which should be used.
     *
     */
    setMechanism(mechanism) {
      this.account.prefs.setString(PREF_MECHANISM, mechanism);
    }

    /**
     * Gets the current security settings. In case it is set to true
     * a secure connection shall be used.
     *
     * @returns {boolean}
     *   true in  case a secure connection should be used.
     **/
    isSecure() {
      return this.account.prefs.getBoolean(PREF_TLS, true);
    }

    /**
     * Defines if a secure connections shall be used.
     * @param {boolean} value
     *   set to true for a secure connection.
     *
     */
    setSecure(value) {
      this.account.prefs.setBoolean(PREF_TLS, value);
    }

  }

  exports.SieveSecurity = SieveSecurity;

})(module.exports);
