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

const HOST_TYPE_IMAP = 0;
const CONFIG_HOST_TYPE = "activeHost";

import { SieveAbstractMechanism } from "./SieveAbstractMechanism.js";
import { SieveAbstractHost } from "./SieveAbstractHost.js";

/**
 * This class loads the hostname from an IMAP account. The hostname is not
 * cached it. This ensures that always the most recent settings are used.
 */
class SieveImapHost extends SieveAbstractHost {

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
}

/**
 * A transparent wrapper needed to deal with the different
 * host mechanism which are provided by electron and thunderbird.
 **/
class SieveHost extends SieveAbstractMechanism {

  /**
   * @inheritdoc
   **/
  getKey() {
    return CONFIG_HOST_TYPE;
  }

  /**
   * @inheritdoc
   **/
  getDefault() {
    return HOST_TYPE_IMAP;
  }

  /**
   * @inheritdoc
   */
  hasMechanism(type) {
    switch (type) {
      case HOST_TYPE_IMAP:
        return true;

      default:
        return false;
    }
  }

  /**
   * @inheritdoc
   */
  getMechanismById(type) {

    switch (type) {

      case HOST_TYPE_IMAP:
      // fall through
      default:
        return new SieveImapHost(HOST_TYPE_IMAP, this.account);
    }
  }

}

export { SieveHost };
