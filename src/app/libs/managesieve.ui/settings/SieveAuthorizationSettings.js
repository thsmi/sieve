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

  const CONFIG_AUTHORIZATION_TYPE_NONE = 0;
  const CONFIG_AUTHORIZATION_TYPE_SIEVE = 1;
  const CONFIG_AUTHORIZATION_TYPE_PROMPT = 2;
  const CONFIG_AUTHORIZATION_TYPE_CUSTOM = 3;

  const DEFAULT_AUTHORIZATION_TYPE = CONFIG_AUTHORIZATION_TYPE_SIEVE;

  const CONFIG_AUTHORIZATION_TYPE = "authorization.type";

  const {
    SieveNoAuthorization,
    SieveCustomAuthorization,
    SieveDefaultAuthorization,
    SieveAbstractAuthorization
  } = require("./SieveAbstractAuthorization.js");

  const { SieveAbstractMechanism } = require("./SieveAbstractMechanism.js");

  const { SieveAuthorizationDialog } = require("./../dialogs/SieveDialogUI.js");

  /**
   * Shows a dialog and prompts for the authorization.
   */
  class SievePromptAuthorization extends SieveAbstractAuthorization {

    /**
     * @inheritdoc
     */
    getType() {
      return CONFIG_AUTHORIZATION_TYPE_PROMPT;
    }

    /**
     * Shows a dialog asking for the authorization.
     * @returns {string}
     *   the authorization string or null in case the dialog was canceled.
     */
    async getAuthorization() {
      const displayname = this.account.getHost().getDisplayName();

      return await (new SieveAuthorizationDialog(displayname)).show();
    }
  }

  /**
   * Manages the authorization settings.
   */
  class SieveAuthorization extends SieveAbstractMechanism {

    /**
     * @inheritdoc
     **/
    getDefault() {
      return DEFAULT_AUTHORIZATION_TYPE;
    }

    /**
     * @inheritdoc
     **/
    getKey() {
      return CONFIG_AUTHORIZATION_TYPE;
    }

    /**
     * @inheritdoc
     **/
    hasMechanism(type) {
      switch (type) {
        case CONFIG_AUTHORIZATION_TYPE_NONE:
        case CONFIG_AUTHORIZATION_TYPE_SIEVE:
        case CONFIG_AUTHORIZATION_TYPE_PROMPT:
        case CONFIG_AUTHORIZATION_TYPE_CUSTOM:
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
        case CONFIG_AUTHORIZATION_TYPE_NONE:
          return new SieveNoAuthorization(CONFIG_AUTHORIZATION_TYPE_NONE, this.account);
        case CONFIG_AUTHORIZATION_TYPE_SIEVE:
          return new SieveDefaultAuthorization(CONFIG_AUTHORIZATION_TYPE_SIEVE, this.account);
        case CONFIG_AUTHORIZATION_TYPE_PROMPT:
          return new SievePromptAuthorization(CONFIG_AUTHORIZATION_TYPE_PROMPT, this.account);
        case CONFIG_AUTHORIZATION_TYPE_CUSTOM:
          return new SieveCustomAuthorization(CONFIG_AUTHORIZATION_TYPE_CUSTOM, this.account);

        default:
          throw new Error("Unknown authorization mechanism");
      }
    }

    /**
     * Returns the current settings as json object.
     *
     * @returns {string}
     *   the current settings as json.
     */
    stringify() {
      return {
        type: this.getType(),
        username: this.getUsername()
      };
    }

    /**
     * Expects either a json string or object. Then it parses
     * the setting and applies them to the current object.
     *
     * @param {JSON|string} json
     *   the configuration data which should be set.
     *
     */
    parse(json) {
      if (typeof (json) === "string")
        json = JSON.parse(json);

      this.setType(json.type);
      this.setUsername(json.username);
    }
  }

  exports.SieveAuthorization = SieveAuthorization;

})(module.exports);
