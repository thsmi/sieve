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
   * Gets the current security settings. In case it is set to true
   * a secure connection shall be used.
   *
   * @returns {boolean}
   *   true in  case a secure connection should be used.
   **/
  async isSecure() {
    return await true;
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

export { SieveAbstractSecurity };
