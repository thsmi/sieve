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

  const AUTH_TYPE_PROMPT = 0;
  const DEFAULT_AUTH_TYPE = AUTH_TYPE_PROMPT;

  const CONFIG_AUTHENTICATION_TYPE = "activeLogin";

  const { SieveAbstractAuthentication } = require("./SieveAbstractAuthentication.js");
  const { SieveAbstractMechanism } = require("./SieveAbstractMechanism.js");

  const { SievePasswordDialog } = require("./../../../ui/dialogs/SieveDialogUI.js");

  /**
   * Prompts for a password.
   */
  class SievePromptAuthentication extends SieveAbstractAuthentication {

    /**
     * @inheritdoc
     */
    hasUsername() {
      return true;
    }

    /**
     * Sets the username.
     *
     * @param {string} username
     *   the username as string, can not be null.
     *
     */
    setUsername(username) {
      this.account.prefs.setString("authentication.username", username);
    }

    /**
     * @inheritdoc
     */
    getUsername() {
      return this.account.prefs.getString("authentication.username");
    }

    /**
     * @inheritdoc
     */
    hasPassword() {
      return true;
    }

    /**
     * @inheritdoc
     */
    async getPassword() {

      let username = this.getUsername();
      let displayname = this.account.getHost().getDisplayName();

      return await (new SievePasswordDialog(username, displayname)).show();
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
        case AUTH_TYPE_PROMPT:
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
        case AUTH_TYPE_PROMPT:
          // fall through we just implement prompt authentication
        default:
          return new SievePromptAuthentication(AUTH_TYPE_PROMPT, this.account);
      }
    }
  }



  exports.SieveAuthentication = SieveAuthentication;

})(module.exports);
