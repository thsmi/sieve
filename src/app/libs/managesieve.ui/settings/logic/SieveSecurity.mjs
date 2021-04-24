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

const PREF_MECHANISM = "security.mechanism";
const PREF_TLS = "security.tls";

import { SieveAbstractSecurity } from "./SieveAbstractSecurity.mjs";

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
  async isSecure() {
    return await this.account.getConfig().getBoolean(PREF_TLS, true);
  }

  /**
   * Defines if a secure connections shall be used.
   *
   * @param {boolean} value
   *   set to true for a secure connection.
   *
   * @returns {SieveSecurity}
   *   a self reference
   */
  async setSecure(value) {
    await this.account.getConfig().setBoolean(PREF_TLS, value);
    return this;
  }

}

export { SieveSecurity };
