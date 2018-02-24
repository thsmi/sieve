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
   *
   */
  class SieveSecurity {

    constructor(account) {
      this.account = account;
    }

    getMechanism() {
      return this.account.prefs.getString(PREF_MECHANISM, "default");
    }

    setMechanism(mechanism) {
      this.account.prefs.setString(PREF_MECHANISM, mechanism);
    }

    isSecure() {
      return this.account.prefs.getBoolean(PREF_TLS, true);
    }

    setSecure(value) {
      this.account.prefs.setBoolean(PREF_TLS, value);
    }

  }

  exports.SieveSecurity = SieveSecurity;

})(module.exports);
