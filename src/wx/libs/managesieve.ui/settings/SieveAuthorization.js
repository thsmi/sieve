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

  const AUTHORIZATION_TYPE_USERNAME = 1;
  const CONFIG_AUTHORIZATION_TYPE = "authorization.type";

  const { SieveAbstractMechanism } = require("libs/managesieve.ui/settings/SieveAbstractMechanism.js");
  const { SieveDefaultAuthorization } = require("libs/managesieve.ui/settings/SieveAbstractAuthorization.js");

  /**
   * Manages the authorization settings.
   */
  class SieveAuthorization extends SieveAbstractMechanism {

    /**
     * @inheritdoc
     **/
    getDefault() {
      return AUTHORIZATION_TYPE_USERNAME;
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
        case AUTHORIZATION_TYPE_USERNAME:
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
        case AUTHORIZATION_TYPE_USERNAME:
          return new SieveDefaultAuthorization(AUTHORIZATION_TYPE_USERNAME, this.account);

        default:
          throw new Error("Unknown authorization mechanism");
      }
    }
  }


  // Require modules need to use export.module
  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAuthorization = SieveAuthorization;
  else
    exports.SieveAuthorization = SieveAuthorization;

})(this);
