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

/* global browser */

/**
 * Uses the IMAP accounts credentials.
 */
class SieveMozAuthentication extends SieveAbstractAuthentication {

  /**
   * @inheritdoc
   */
  async getPassword() {
    return await browser.sieve.accounts.getPassword(this.account.getId());
  }

  /**
   * @inheritdoc
   */
  async getUsername() {
    return await browser.sieve.accounts.getUsername(this.account.getId());
  }
}

export { SieveMozAuthentication as SieveAuthentication };

