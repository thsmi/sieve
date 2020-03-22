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

  const CONFIG_AUTHORIZATION_USERNAME = "sasl.authorization.username";
  const DEFAULT_AUTHORIZATION = "";

  /**
   * An base class common for all authorization mechanism
   **/
  class SieveAbstractAuthorization {

    /**
     * Create a new instance.
     *
     * @param {int} type
     *   the account's unique identifier.
     * @param {SieveAccount} account
     *   a reference to the parent sieve account.
     */
    constructor(type, account) {
      this.account = account;
      this.type = type;
    }

    /**
     * Each authorization type has an unique identifier.
     *
     * @returns {int}
     *   the identifier as int.
     */
    getType() {
      return this.type;
    }

    /**
     * Returns the authorization string.
     *
     * @abstract
     *
     * @returns {string}
     *   the authorization string
     */
    getAuthorization() {
      throw new Error("Implement SieveAbstractAuthorizationMechanism::getAuthorization");
    }
  }

  /**
   * The easiest authorization mechanism.
   * When an empty string is passed the server should choose the most suitable authorization.
   */
  class SieveNoAuthorization extends SieveAbstractAuthorization {

    /**
     * Returns always an empty string. This means the server should choose the most suitable authorization.
     *
     * @returns {string}
     *   an empty string.
     */
    getAuthorization() {
      return DEFAULT_AUTHORIZATION;
    }
  }

  /**
   * Uses for authorization the same username which was used for authentication.
   */
  class SieveDefaultAuthorization extends SieveAbstractAuthorization {

    /**
     * Returns the username which was used for authentication.
     *
     * @returns {string}
     *   the username as string.
     */
    async getAuthorization() {
      return await (await this.account.getAuthentication()).getUsername();
    }
  }

  /**
   * Uses a custom authorization.
   */
  class SieveCustomAuthorization extends SieveAbstractAuthorization {

    /**
     * @inheritdoc
     **/
    async getAuthorization() {
      return await this.account.getConfig().getString(CONFIG_AUTHORIZATION_USERNAME, null);
    }

    /**
     * Sets a custom authorization.
     *
     * @param {string} authorization
     *   the authorization as string.
     *
     */
    async setAuthorization(authorization) {
      if (typeof (authorization) === "undefined" || (authorization === null))
        throw new Error("Authorization can't be undefined");

      await this.account.getConfig().setString(CONFIG_AUTHORIZATION_USERNAME, authorization);
    }
  }

  // Require modules need to use export.module
  if (typeof (module) !== "undefined" && module && module.exports) {
    module.exports.SieveAbstractAuthorization = SieveAbstractAuthorization;

    module.exports.SieveNoAuthorization = SieveNoAuthorization;
    module.exports.SieveCustomAuthorization = SieveCustomAuthorization;
    module.exports.SieveDefaultAuthorization = SieveDefaultAuthorization;
  } else {
    exports.SieveAbstractAuthorization = SieveAbstractAuthorization;

    exports.SieveNoAuthorization = SieveNoAuthorization;
    exports.SieveCustomAuthorization = SieveCustomAuthorization;
    exports.SieveDefaultAuthorization = SieveDefaultAuthorization;
  }


})(this);
