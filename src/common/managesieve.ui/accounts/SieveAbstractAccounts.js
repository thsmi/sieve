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

import { SieveAccountUI } from "./SieveAccountUI.js";
import { SieveIpcClient } from "./../utils/SieveIpcClient.js";
import { SieveLogger } from "./../utils/SieveLogger.js";

/**
 * A UI renderer for a list of sieve accounts
 **/
class SieveAbstractAccounts {

  /**
   * Gets an instance to the logger.
   *
   * @returns {SieveLogger}
   *   an reference to the logger instance.
   **/
  getLogger() {
    return SieveLogger.getInstance();
  }

  /**
   * Renders the UI for this component.
   */
  async render() {

    this.getLogger().logWidget("Rendering Accounts...");

    const items = document.querySelector(".siv-accounts-items");
    while (items.firstChild)
      items.removeChild(items.firstChild);

    const accounts = await SieveIpcClient.sendMessage("core", "accounts-list");

    for (const account of accounts) {
      this.getLogger().logWidget(` + Accounts ${account}`);
      await ((new SieveAccountUI(this, account)).render());
    }
  }
}

export {SieveAbstractAccounts};
