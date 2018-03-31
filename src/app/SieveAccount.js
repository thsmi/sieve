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

  const { SievePrefManager } = require('./utils/SievePrefManager.js');
  const { SieveAuthorization } = require("./libs/libManageSieve/settings/SieveAuthorizationSettings.js");
  const { SieveAuthentication } = require("./libs/libManageSieve/settings/SieveAuthenticationSettings.js");
  const { SieveSecurity } = require("./libs/libManageSieve/settings/SieveSecuritySettings.js");
  const { SieveHost } = require("./libs/libManageSieve/settings/SieveHostSettings.js");

  // const SievePasswordManager = require('./utils/SievePasswordManager.js');


  /**
   * Manages the account specific settings
   */
  class SieveAccount {

    /**
     * Creates a new instance.
     *
     * @param {string} id
     *   the account's unique id.
     * @param {function} callback
     *   the callback which is invoked to retrieve the password.
     */
    constructor(id, callback) {
      this.callback = callback;
      this.prefs = new SievePrefManager(id);

      this.authorization = new SieveAuthorization(this);
      this.authentication = new SieveAuthentication(this);
      this.security = new SieveSecurity(this);
      this.host = new SieveHost(this);
    }

    /**
     * @returns {SieveHost}
     *   the current host settings
     **/
    getHost() {
      return this.host.get();
    }

    /**
     *  @returns {SieveSecurity}
     *   the current security settings
     */
    getSecurity() {
      return this.security;
    }

    setAuthentication(type) {
      this.authentication.setMechanism(type);
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

    getProxy() {
      return {
        getProxyInfo: function () {
          return null;
        }
      };
    }

    getSettings() {
      return {
        getDebugFlags: function () {
          return 255;
        },

        setKeepAlive: (value) => {
          this.prefs.setBoolean("keepalive.enabled", value);
          return this;
        },

        isKeepAlive: () => {
          return this.prefs.getBoolean("keepalive.enabled");
        },

        setKeepAliveInterval: (value) => {
          this.prefs.setInteger("keepalive.interval", value);
        },

        getKeepAliveInterval: () => {
          return this.prefs.getInteger("keepalive.interval", 5 * 60 * 1000);
        }
      };
    }
  }

  // Require modules need to use export.module
  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAccount = SieveAccount;
  else
    exports.SieveAccount = SieveAccount;

})(this);
