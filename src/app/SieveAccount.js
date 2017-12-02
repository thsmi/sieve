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
  //const SievePasswordManager = require('./utils/SievePasswordManager.js');

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
      let that = this;
      return {

        getDisplayName : function() {
          return that.prefs.getString("host.displayName", "Unnamed Account");
        },

        setDisplayName : function(value) {
          that.prefs.setString("host.displayName", value);
          return this;
        },

        isSecure: function () {
          return that.prefs.getBoolean("host.tls", true);
        },

        setSecure: function(secure) {
          return that.prefs.setBoolean("host.tls", secure);
        },

        getHostname: function () {
          return that.prefs.getString("host.hostname", "localhost");
        },

        setHostname: function (value) {
          that.prefs.setString("host.hostname", value);
        },

        getPort: function () {
          return that.prefs.getInteger("host.port", 4190);
        },

        setPort:function (value) {
          that.prefs.setInteger("host.port", value);
        }
      };
    }

    /**
     * Provides access to all login related settings
     * @returns {object}
     *   the login object
     */
    getLogin() {
      let that = this;
      return {
        getSaslMechanism: function () {
          return that.prefs.getString("authentication.mechanism", "default");
        },

        setSaslMechanism: function (value) {
          that.prefs.setString("authentication.mechanism", value);
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
        getUsername: function () {
          return that.prefs.getString("authentication.username", "");
        },

        setUsername: function(value) {
          that.prefs.setString("authentication.username", value);
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
        getPassword: async function () {
          return await that.callback(that);
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

        isKeepAlive: function () {
          return true;
        },

        getKeepAliveInterval: function () {
          return 20 * 60 * 1000;
        }
      };
    }
  }

  if (module.exports)
    module.exports.SieveAccount = SieveAccount;
  else
    exports.SieveAccount = SieveAccount;

})(this);