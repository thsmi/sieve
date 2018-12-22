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
     * An human readable description, which describes the authentication procedure.
     * @returns {string} String containing the description.
     */
    getDescription() {
      throw new Error("Impement getDescription");
    }

    /**
     * Retruns the password for the choosen mechanism.
     *
     * Not all mechanisms require a password.
     * Others e.g. when prompting do not always return a password.
     *
     * @returns {string | null}
     *   the password or null e.g. when the password prompt was dismissed.
    */
    getPassword() {
      throw new Error("Impement getPassword");
    }

    /**
     * Returns the username for the account.
     *
     * @returns {string}
     *   the username as string.
     **/
    getUsername() {
      throw new Error("Implement getUsername");
    }

    /**
     * Checks if the username is associated with a password.
     *
     * @returns {boolean}
     *   true in case the username has a password otherwise false.
     */
    hasUsername() {
      throw new Error("Implement hasUsername");
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

  exports.SieveAbstractAuthentication = SieveAbstractAuthentication;

})(module.exports);
