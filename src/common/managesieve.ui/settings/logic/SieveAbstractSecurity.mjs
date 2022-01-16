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

const SECURITY_NONE = 0;
const SECURITY_EXPLICIT = 1;
const SECURITY_IMPLICIT = 2;

/**
 * Defines the security related settings for an account.
 * It is a minimal, mozilla specific implementation.
 */
class SieveAbstractSecurity {

  /**
   * Creates a new instance.
   *
   * @param {SieveAccount} account
   *   the account with is associated with this account.
   */
  constructor(account) {
    this.account = account;
  }

  /**
   * Gets the connection security.
   *
   * @returns {int}
   *   the current connection security.
   *
   *   0 for no connection security
   *   1 for implicit tls
   *   2 for explicit tls
   */
  async getTLS() {
    return await SECURITY_EXPLICIT;
  }

  /**
   * Gets the currently configured sasl mechanism.
   *
   * @returns {string}
   *   the sasl mechanism
   **/
  async getMechanism() {
    return await "default";
  }
}

export {
  SieveAbstractSecurity,
  SECURITY_NONE,
  SECURITY_EXPLICIT,
  SECURITY_IMPLICIT
};
