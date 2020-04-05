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

  /**
   * An base class common for all authentication mechanisms
   **/
  class SieveAbstractAuthentication {

    /**
     * Create a new instance.
     *
     * @param {int} type
     *   the accounts unique identifier.
     * @param {SieveAccount} account
     *   a reference to the parent sieve account.
     */
    constructor(type, account) {
      this.type = type;
      this.account = account;
    }

    /**
     * Returns the password for the chosen mechanism.
     *
     * Not all mechanisms require a password.
     * Others e.g. when prompting do not always return a password.
     *
     * @abstract
     *
     * @returns {string | null}
     *   the password or null e.g. when the password prompt was dismissed.
     **/
    // eslint-disable-next-line require-await
    async getPassword() {
      throw new Error("Implement getPassword");
    }

    /**
     * Returns the username for the account.
     *
     * @abstract
     *
     * @returns {string}
     *   the username as string.
     **/
    // eslint-disable-next-line require-await
    async getUsername() {
      throw new Error("Implement getUsername");
    }

    /**
     * Each authentication type has an unique identifier.
     *
     * @returns {int}
     *   the identifier as int.
     */
    getType() {
      return this.type;
    }
  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAbstractAuthentication = SieveAbstractAuthentication;
  else
    exports.SieveAbstractAuthentication = SieveAbstractAuthentication;

})(this);
