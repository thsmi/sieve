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
     * @param {function} callback
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
     * @returns {void}
     */
    lock() {
      this.master = null;
    }

    /**
     * Unlocks the password manager.
     * In case it the password manager is locked the callback is invoked
     * in order to retieve the master password.
     *
     * @return {void}
     */
    async unlock() {
      if (this.isLocked())
        this.master = await this.callback();
    }

    /**
     * Checks if the password manager is locked.
     * @return {void}
     */
    isLocked() {
      return this.master === null;
    }

    /**
     * Encrypts the given text
     * @param {String} text
     *   the plain text
     * @returns {String}
     *   the encrypted text as hex string
     */
    encrypt(text) {
      let cipher = crypto.createCipher(this.algorithm, this.master);
      let crypted = cipher.update(text, 'utf8', 'hex');
      crypted += cipher.final('hex');

      return crypted;
    }

    /**
     * Decrypts the given text
     * @param {String} text
     *   the encrypted text as hex string
     * @returns {String}
     *   the plain text
     */
    decrypt(text) {
      let decipher = crypto.createDecipher(this.algorithm, this.master);
      let dec = decipher.update(text, 'hex', 'utf8');
      dec += decipher.final('utf8');

      return dec;
    }

    /**
     * Adds or updates a password entry
     * @param {String} id
     *   the unique id, which is used to identify the password.
     *   Typically the account id.
     * @param {String} password
     *   the password which should be stored.
     * @returns {void}
     */
    set(id, password) {
      this.unlock();
      this.data[id] = this.encrypt(password);
    }

    /**
     * Gets and decrypts a password from the the password store
     * @param {String} id
     *   the unique id, which is used to identify the password.
     *   Typically the account id.
     * @returns {Promise<String>}
     *   the decrypted string.
     */
    get(id) {
      this.unlock();
      return this.decrypt(this.data[id]);
    }

    /**
     * Removes the password
     * @param {String} id
     *   the unique id, which is used to identify the password.
     *   Typically the account id.
     * @returns {void}
     */
    forget(id) {
      delete this.data[id];
    }
  }

  // Require modules need to use export.module
  if (module.exports)
    module.exports.SievePasswordManager = SievePasswordManager;
  else
    exports.SievePasswordManager = SievePasswordManager;

})(this);

