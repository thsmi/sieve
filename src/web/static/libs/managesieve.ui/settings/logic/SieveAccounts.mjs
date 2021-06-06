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

import { SieveAccount } from "./SieveAccount.mjs";
import { SieveAbstractAccounts } from "./SieveAbstractAccounts.mjs";

/**
 * Manages the configuration for sieve accounts.
 * It queries thunderbird's account and extracts all needed information.
 *
 * Global settings are stored in the addons persistence.
 */
class SieveAccounts extends SieveAbstractAccounts {

  /**
   * @inheritdoc
   */
  async load() {

    const items = await (await fetch("./config.json")).json();

    const accounts = {};

    for (const key of Object.keys(items)) {
      accounts[key] = new SieveAccount(key, items[key]);
    }

    this.accounts = accounts;
    return this;
  }

}

export { SieveAccounts };
