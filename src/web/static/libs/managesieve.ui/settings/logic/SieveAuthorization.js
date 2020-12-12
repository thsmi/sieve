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


const AUTHORIZATION_TYPE_USERNAME = 1;
const CONFIG_AUTHORIZATION_TYPE = "authorization.type";

import { SieveAbstractMechanism } from "./SieveAbstractMechanism.js";
import { SieveDefaultAuthorization } from "./SieveAbstractAuthorization.js";

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

  async getMechanism() {
    return new SieveDefaultAuthorization(AUTHORIZATION_TYPE_USERNAME, this.account);
  }

  /**
   * @inheritdoc
   **/
  getMechanismById() {
    return new SieveDefaultAuthorization(AUTHORIZATION_TYPE_USERNAME, this.account);
  }
}

export { SieveAuthorization };
