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
   *
   */
  class SieveAbstractMechanism {

    /**
     * Creates a new instance.
     *
     * @param {SieveAccount} account
     *   a reference to the parent sieve account.
     */
    constructor(account) {
      this.account = account;
    }

    /**
     *
     * @returns {string}
     *   the pref key which is used to store the information about the mechanism
     **/
    getKey() {
      throw new Error("Implement getKey()");
    }

    /**
     * Returns the default mechanism which is used unless it is
     * overwritten by an other mechanism.
     *
     * @returns {int}
     *   the default mechanism
     */
    getDefault() {
      throw new Error("Implement getDefault()");
    }

    /**
   * Checks it the given mechanism is supported.
   *
   * @param {int} mechanism
   *   the authentication mechanisms unqiue id.
   * @returns {boolean}
   *   true in case the given type is supported otherwise false.
   */
    hasMechanism(mechanism) {
      throw new Error("Implement hasMechanism(" + mechanism + ")");
    }

    /**
     * Returns the authentication mechanism for the given type.
     *
     * @param {int} mechanism
     *   the authentication mechanism
     * @returns {SieveAbstractAuthentication}
     *   the authentication mechanism instance.
     */
    getMechanismById(mechanism) {
      throw new Error("Implement getMechanism(" + mechanism + ")");
    }

    /**
     * Sets the current mechanism.
     * @param {int} type
     *   the mechanism type's unique id.
     *
     */
    setMechanism(type) {
      if (typeof (type) === "undefined" || type === null)
        type = this.getDefault();

      if (typeof (type) === "string")
        type = Number.parseInt(type, 10);

      if (!this.hasMechanism(type))
        throw new Error("Invalid mechanism " + type);

      this.account.prefs.setInteger(this.getKey(), type);
    }

    /**
     * Gets the current mechanism.
     * @returns {int}
     *   the mechanisms unique id.
     */
    getMechanism() {
      return this.account.prefs.getInteger(this.getKey(), this.getDefault());
    }

    /**
     * Returns the settings for the given authentication mechanism
     *
     * @param {int} [mechanism]
     *   the optional authentication mechanism's unique id.
     *   If omitted the currently active authentication is returned.
     * @returns {SieveAbstractAuthentication}
     *   the selected authentication mechanism.
     */
    get(mechanism) {
      if (typeof (mechanism) === "undefined" || mechanism === null)
        mechanism = this.getMechanism();

      if (!this.hasMechanism(mechanism))
        mechanism = this.getDefault();

      return this.getMechanismById(mechanism);
    }
  }


  exports.SieveAbstractMechanism = SieveAbstractMechanism;

})(module.exports);
