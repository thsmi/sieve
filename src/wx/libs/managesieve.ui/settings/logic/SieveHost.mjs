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

/* global browser */

import { SieveCustomHost } from "./SieveAbstractHost.mjs";

const CONFIG_KEEP_ALIVE_INTERVAL = "keepalive";
// eslint-disable-next-line no-magic-numbers
const THIRTY_SECONDS = 30 * 1000;
// eslint-disable-next-line no-magic-numbers
const ONE_MINUTE = 60 * 1000;
// eslint-disable-next-line no-magic-numbers
const FIVE_MINUTES = 5 * ONE_MINUTE;

/**
 * This class loads the hostname from an IMAP account. The hostname is not
 * cached it. This ensures that always the most recent settings are used.
 */
class SieveMozHost extends SieveCustomHost {

  /**
   * @inheritdoc
   */
  async getDisplayName() {
    return await browser.sieve.accounts.getPrettyName(this.account.getId());
  }

  /**
   * @inheritdoc
   */
  async getHostname() {
    return await browser.sieve.accounts.getHostname(this.account.getId());
  }

  /**
   * @inheritdoc
   */
  async getKeepAlive() {
    return await this.account.getConfig().getInteger(CONFIG_KEEP_ALIVE_INTERVAL, THIRTY_SECONDS);
  }
}

export { SieveMozHost as SieveHost };
