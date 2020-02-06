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

  const crypto = require('crypto');

  /**
   * Implements a very simplictic password manager.
   * Which uses AES encryption to protect the saved passwords
   */
  class SievePasswordManager {

    /**
     * Initializes the password manager.
     *
     * @param {Function} callback
     *   a callback function which implements a password prompt
     */
    constructor(callback) {
      this.algorithm = 'aes-256-ctr';
      this.master = null;
      this.callback = callback;
      this.data = {};
    }

    /**
     * Locks the password manager.
     * This means it drops the cached master password.
     *
     *
     */
    lock() {
      this.master = null;
    }

    /**
     * Unlocks the password manager.
     * In case it the password manager is locked the callback is invoked
     * in order to retieve the master password.
     *
     *
     */
    async unlock() {
      if (this.isLocked())
        this.master = await this.callback();
    }

    /**
     * Checks if the password manager is locked.
     * Locked means the user has not provided the master password.
     *
     * @returns {boolean}
     *   true in case the passwor managerd is locked otherwise false
     */
    isLocked() {
      return this.master === null;
    }

    /**
     * Encrypts the given text
     * @param {string} text
     *   the plain text
     * @returns {string}
     *   the encrypted text as hex string
     */
    encrypt(text) {
      const cipher = crypto.createCipher(this.algorithm, this.master);
      let crypted = cipher.update(text, 'utf8', 'hex');
      crypted += cipher.final('hex');

      return crypted;
    }

    /**
     * Decrypts the given text
     * @param {string} text
     *   the encrypted text as hex string
     * @returns {string}
     *   the plain text
     */
    decrypt(text) {
      const decipher = crypto.createDecipher(this.algorithm, this.master);
      let dec = decipher.update(text, 'hex', 'utf8');
      dec += decipher.final('utf8');

      return dec;
    }

    /**
     * Adds or updates a password entry
     * @param {string} id
     *   the unique id, which is used to identify the password.
     *   Typically the account id.
     * @param {string} password
     *   the password which should be stored.
     *
     */
    set(id, password) {
      this.unlock();
      this.data[id] = this.encrypt(password);
    }

    /**
     * Gets and decrypts a password from the the password store
     * @param {string} id
     *   the unique id, which is used to identify the password.
     *   Typically the account id.
     * @returns {Promise<string>}
     *   the decrypted string.
     */
    get(id) {
      this.unlock();
      return this.decrypt(this.data[id]);
    }

    /**
     * Removes the password
     * @param {string} id
     *   the unique id, which is used to identify the password.
     *   Typically the account id.
     *
     */
    forget(id) {
      delete this.data[id];
    }
  }

  // Require modules need to use export.module
  if (typeof(module) !== "undefined" && module && module.exports)
    module.exports.SievePasswordManager = SievePasswordManager;
  else
    exports.SievePasswordManager = SievePasswordManager;

})(this);
