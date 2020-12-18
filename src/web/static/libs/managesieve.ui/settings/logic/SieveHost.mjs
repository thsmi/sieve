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

import { SieveAbstractHost } from "./SieveAbstractHost.mjs";

// eslint-disable-next-line no-magic-numbers
const ONE_MINUTE = 60 * 1000;
// eslint-disable-next-line no-magic-numbers
const FIVE_MINUTES = 5 * ONE_MINUTE;

/**
 * This class loads the hostname from an IMAP account. The hostname is not
 * cached it. This ensures that always the most recent settings are used.
 */
class SieveWebSocketHost extends SieveAbstractHost {

  /**
   * @inheritdoc
   */
  async getDisplayName() {
    return "Some thing";
    // return await browser.sieve.accounts.getPrettyName(this.account.getId());
  }

  /**
   * @inheritdoc
   */
  async getHostname() {
    return window.location.hostname;
    // return await browser.sieve.accounts.getHostname(this.account.getId());
  }

  /**
   * @inheritdoc
   */
  async getPort() {
    return window.location.port;
  }

  /**
   * @inheritdoc
   */
  async getKeepAlive() {
    return FIVE_MINUTES;
  }
}

export { SieveWebSocketHost as SieveHost };
