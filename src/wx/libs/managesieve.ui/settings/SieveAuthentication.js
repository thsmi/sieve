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

  const AUTH_TYPE_IMAP = 1;
  const DEFAULT_AUTH_TYPE = AUTH_TYPE_IMAP;

  const CONFIG_AUTHENTICATION_TYPE = "activeLogin";

  const { SieveAbstractAuthentication } = require("libs/managesieve.ui/settings/SieveAbstractAuthentication.js");
  const { SieveAbstractMechanism } = require("libs/managesieve.ui/settings/SieveAbstractMechanism.js");

  /* global browser */

  /**
   * Uses the IMAP accounts credentials.
   */
  class SieveImapAuthentication extends SieveAbstractAuthentication {

    /**
     * @inheritdoc
     */
    async getPassword() {
      return await browser.sieve.accounts.getPassword(this.account.getId());
    }

    /**
     * @inheritdoc
     */
    async getUsername() {
      return await browser.sieve.accounts.getUsername(this.account.getId());
    }
  }

  /**
   * Manages the authorization settings.
   */
  class SieveAuthentication extends SieveAbstractMechanism {

    /**
     * @inheritdoc
     **/
    getDefault() {
      return DEFAULT_AUTH_TYPE;
    }

    /**
     * @inheritdoc
     **/
    getKey() {
      return CONFIG_AUTHENTICATION_TYPE;
    }

    /**
     * @inheritdoc
     **/
    hasMechanism(type) {
      switch (type) {
        case AUTH_TYPE_IMAP:
          return true;

        default:
          return false;
      }
    }

    /**
     * @inheritdoc
     **/
    getMechanismById(type) {
      switch (type) {
        case AUTH_TYPE_IMAP:
          // fall through we just implement prompt authentication
        default:
          return new SieveImapAuthentication(AUTH_TYPE_IMAP, this.account);
      }
    }
  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAuthentication = SieveAuthentication;
  else
    exports.SieveAuthentication = SieveAuthentication;

})(this);
