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

  const SievePrefManager = require('./utils/SievePrefManager.js');
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
    }

    /**
     * Provides access to all host related settings
     * @returns {object}
     *   the host object
     */
    getHost() {

      return {

        getDisplayName: () => {
          return this.prefs.getString("host.displayName", "Unnamed Account");
        },

        setDisplayName: (value) => {
          this.prefs.setString("host.displayName", value);
          return this;
        },

        isSecure: () => {
          return this.prefs.getBoolean("host.tls", true);
        },

        setSecure: (secure) => {
          return this.prefs.setBoolean("host.tls", secure);
        },

        getHostname: () => {
          return this.prefs.getString("host.hostname", "localhost");
        },

        setHostname: (value) => {
          this.prefs.setString("host.hostname", value);
        },

        getPort: () => {
          return this.prefs.getInteger("host.port", 4190);
        },

        setPort: (value) => {
          this.prefs.setInteger("host.port", value);
        }
      };
    }

    /**
     * Provides access to all login related settings
     * @returns {object}
     *   the login object
     */
    getLogin() {

      return {
        getSaslMechanism: () => {
          return this.prefs.getString("authentication.mechanism", "default");
        },

        setSaslMechanism: (value) => {
          this.prefs.setString("authentication.mechanism", value);
        },
        /**
         * Gets the username for the given account
         *
         * It is async because it may be blocking in
         * case it requires user input.
         *
         * @returns {Promise<string>}
         *  the username
         */
        getUsername: () => {
          return this.prefs.getString("authentication.username", "");
        },

        setUsername: (value) => {
          this.prefs.setString("authentication.username", value);
        },

        /**
         * Gets the password for the given account.
         *
         * It is async because it may be blocking in
         * case it requires user input.
         *
         * @returns {Promise<string>}
         *   the password as string
         */
        getPassword: async () => {
          return await this.callback(this);
        }
      };
    }

    getAuthorization() {
      return {
        getAuthorization: function () {
          return "";
        }
      };
    };

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

        hasForcedAuthMechanism: function () {
          return false;
        },

        setKeepAlive: (value) => {
          this.prefs.setBoolean("keepalive.enabled", value);
          return this;
        },

        isKeepAlive: () => {
          return this.prefs.getBoolean("keepalive.enabled");
        },

        setKeepAliveInterval: (value) => {
          this.prefs.setInteger("keepalive.interval", value)
        },

        getKeepAliveInterval: () => {
          return this.prefs.getInteger("keepalive.interval", 5 * 60 * 1000);
        }
      };
    }
  }

  if (module.exports)
    module.exports.SieveAccount = SieveAccount;
  else
    exports.SieveAccount = SieveAccount;

})(this);
