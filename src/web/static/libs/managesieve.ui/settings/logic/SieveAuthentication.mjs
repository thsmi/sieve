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

import { SieveAbstractAuthentication } from "./SieveAbstractAuthentication.mjs";

import { SieveIpcClient } from "./../../utils/SieveIpcClient.js";

/**
 * Uses the IMAP accounts credentials.
 */
class SieveWebSocketAuthentication extends SieveAbstractAuthentication {

  /**
   * @inheritdoc
   */
  async getPassword() {
    const request = {
      "username": await this.getUsername(),
      "displayname": await (await this.account.getHost()).getDisplayName(),
      "remember": false
    };

    const credentials = await SieveIpcClient.sendMessage(
      "accounts", "account-show-authentication", request);

    return credentials.password;
  }

  /**
   * @inheritdoc
   */
  async getUsername() {
    // TODO read username from server defaults...
    return "gmx@tschmid.net";
  }
}

export { SieveWebSocketAuthentication as SieveAuthentication };
