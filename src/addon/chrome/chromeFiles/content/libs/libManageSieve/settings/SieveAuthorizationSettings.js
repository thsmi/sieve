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

  const AUTHORIZATION_TYPE_NONE = 0;
  const AUTHORIZATION_TYPE_SIEVE = 1;
  const AUTHORIZATION_TYPE_PROMPT = 2;
  const AUTHORIZATION_TYPE_CUSTOM = 3;

  const DEFAULT_AUTHORIZATION_TYPE = AUTHORIZATION_TYPE_SIEVE;

  const CONFIG_AUTHORIZATION_TYPE = "authorization.type";

  /* global Services */

  const {
    SieveNoAuthorization,
    SieveDefaultAuthorization,
    SieveCustomAuthorization,

    SieveAbstractAuthorization
  } = require("./settings/SieveAbstractAuthorization.js");

  const { SieveAbstractMechanism } = require("./settings/SieveAbstractMechanism.js");

  /**
   * Shows a dialog and prompts for the authorization.
   */
  class SievePromptAuthorization extends SieveAbstractAuthorization {

    /**
     * Shows a dialog asking for the authorization.
     * @returns {string}
     *   the authorization string or null in case the dialog was canceled.
     */
    getAuthorization() {
      let check = { value: false };
      let input = { value: "" };

      let strings = Services.strings
        .createBundle("chrome://sieve/locale/locale.properties");

      let result =
        Services.prompt.prompt(
          null,
          strings.GetStringFromName("account.authorization.title"),
          strings.GetStringFromName("account.authorization.description"),
          input,
          null,
          check);

      if (result === false)
        return null;

      return input.value;
    }
  }

  /**
   *
   */
  class SieveAuthorization extends SieveAbstractMechanism {

    /**
     * @inheritdoc
     */
    getDefault() {
      return DEFAULT_AUTHORIZATION_TYPE;
    }

    /**
     * @inheritdoc
     */
    getKey() {
      return CONFIG_AUTHORIZATION_TYPE;
    }

    /**
     * @inheritdoc
     **/
    hasMechanism(type) {
      switch (type) {
        case AUTHORIZATION_TYPE_NONE:
        case AUTHORIZATION_TYPE_SIEVE:
        case AUTHORIZATION_TYPE_PROMPT:
        case AUTHORIZATION_TYPE_CUSTOM:
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
        case AUTHORIZATION_TYPE_NONE:
          return new SieveNoAuthorization(AUTHORIZATION_TYPE_NONE, this.account);
        case AUTHORIZATION_TYPE_SIEVE:
          return new SieveDefaultAuthorization(AUTHORIZATION_TYPE_SIEVE, this.account);
        case AUTHORIZATION_TYPE_PROMPT:
          return new SievePromptAuthorization(AUTHORIZATION_TYPE_PROMPT, this.account);
        case AUTHORIZATION_TYPE_CUSTOM:
          return new SieveCustomAuthorization(AUTHORIZATION_TYPE_CUSTOM, this.account);

        default:
          throw new Error("Unknown authorization mechanism");
      }
    }
  }

  exports.SieveAuthorization = SieveAuthorization;

})(module.exports);
