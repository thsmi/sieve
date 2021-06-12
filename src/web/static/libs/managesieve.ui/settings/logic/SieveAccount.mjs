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

import { SieveAbstractAccount } from "./SieveAbstractAccount.mjs";

/**
 * Manages the account specific settings
 */
class SieveWebAccount extends SieveAbstractAccount {

  /**
   * Creates a new instance.
   *
   * @param {string} id
   *   the account's unique id.
   * @param {object} serverConfig
   *   the server's configuration as json object.
   */
  constructor(id, serverConfig) {
    super(id);
    this.serverConfig = serverConfig;
  }

  /**
   * Returns the configuration retrieved from the server.
   * @returns {object}
   *   the current configuration.
   */
  getServerConfig() {
    return this.serverConfig;
  }


}


export { SieveWebAccount as SieveAccount};
