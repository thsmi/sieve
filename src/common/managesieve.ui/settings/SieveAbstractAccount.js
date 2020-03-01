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

  const { SievePrefManager } = require('./SievePrefManager.js');

  const { SieveAuthorization } = require("./SieveAuthorizationSettings.js");
  const { SieveAuthentication } = require("./SieveAuthenticationSettings.js");
  const { SieveSecurity } = require("./SieveSecuritySettings.js");
  const { SieveHost } = require("./SieveHostSettings.js");
  const { SieveCommonSettings } = require("./SieveCommonSettings.js");


  /**
   * Abstract implementation for managing an account's preferences.
   */
  class SieveAbstractAccount {

    /**
     * Creates a new instance.
     *
     * @param {string} id
     *   the account's unique id.
     */
    constructor(id) {
      this.id = id;

      this.prefs = new SievePrefManager(id);

      this.host = new SieveHost(this);
      this.authentication = new SieveAuthentication(this);
      this.authorization = new SieveAuthorization(this);
      this.security = new SieveSecurity(this);
      this.common = new SieveCommonSettings(this);
    }

    /**
     * Returns the account's unique id.
     * @returns {string}
     *   the account unique id.
     */
    getId() {
      return this.id;
    }

    /**
     * Returns a reference to the preference manager for this account.
     *
     * @returns {SievePrefManager}
     *   the reference to the preference manager
     */
    getConfig() {
      return this.prefs;
    }

    /**
     * Contains information about the server settings like
     * the hostname, port etc.
     *
     * @returns {SieveHost}
     *   the current host settings
     **/
    getHost() {
      return this.host.get();
    }

    /**
     * Host alls security related setting like the SASL
     * mechanisms or the tls configuration.
     *
     *  @returns {SieveSecurity}
     *   the current security settings
     */
    getSecurity() {
      return this.security;
    }

    /**
     * Defines which authentification configuration is active.
     *
     * An account may support multiple concurrent configurations
     * from which only one can be active.
     *
     * E.g using Thunderbird's account settings
     * on user specified settings.
     *
     * @param {int} type
     *   the authentication type which should be activated.
     *
     * @returns {SieveAbstractAccount}
     *   a self reference
     */
    setAuthentication(type) {
      this.authentication.setMechanism(type);
      return this;
    }

    getAuthentication(type) {
      return this.authentication.get(type);
    }

    setAuthorization(type) {
      this.authorization.setMechanism(type);
    }

    getAuthorization(type) {
      return this.authorization.get(type);
    }

    getSettings() {
      return this.common;
    }

  }

  // Require modules need to use export.module
  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAbstractAccount = SieveAbstractAccount;
  else
    exports.SieveAbstractAccount = SieveAbstractAccount;

})(this);
