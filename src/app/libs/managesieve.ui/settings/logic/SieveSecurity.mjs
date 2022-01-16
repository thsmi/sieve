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

import {
  SieveAbstractSecurity,
  SECURITY_NONE,
  SECURITY_EXPLICIT,
  SECURITY_IMPLICIT
} from "./SieveAbstractSecurity.mjs";

const PREF_MECHANISM = "security.mechanism";
const PREF_TLS = "security.tls";

/**
 * Manages the account's security related settings
 */
class SieveSecurity extends SieveAbstractSecurity {

  /**
   * @inheritdoc
   */
  async getMechanism() {
    return await this.account.getConfig().getString(PREF_MECHANISM, "default");
  }

  /**
   * Sets the sasl mechanism.
   *
   * @param {string} mechanism
   *   the sasl mechanism which should be used.
   *
   * @returns {SieveSecurity}
   *   a self reference
   */
  async setMechanism(mechanism) {
    await this.account.getConfig().setString(PREF_MECHANISM, mechanism);
    return this;
  }

  /**
   * @inheritdoc
   */
  async getTLS() {
    return await this.account.getConfig().getInteger(PREF_TLS, SECURITY_EXPLICIT);
  }

  /**
   * Sets the connection security.
   * Throws in case an invalid connection security was passed.
   *
   * @param {int} value
   *   0 for no connection security
   *   1 for implicit tls
   *   2 for explicit tls
   * @returns {SieveSecurity}
   *   a self reference
   */
  async setTLS(value) {
    if ((value !== SECURITY_NONE) && (value !== SECURITY_IMPLICIT) && (value !== SECURITY_EXPLICIT))
      throw new Error("Invalid security setting");

    await this.account.getConfig().setInteger(PREF_TLS, value);
    return this;
  }

}

export { SieveSecurity };
