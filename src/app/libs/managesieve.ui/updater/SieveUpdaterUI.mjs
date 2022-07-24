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

import { SieveTemplate } from "./../utils/SieveTemplate.mjs";
import { SieveIpcClient } from "./../utils/SieveIpcClient.mjs";

/**
 * Checks for new updates and display a new message if a newer version is available
 **/
class SieveUpdaterUI {

  /**
   * Checks for new updates and display a new message if a newer version is available
   */
  async check() {
    const status = await SieveIpcClient.sendMessage("core", "update-check");

    if (status !== true)
      return;

    const url = (new SieveTemplate()).getI18n().getString("updater.url.latest");
    const template = await (new SieveTemplate()).load("./updater/update.html");

    template.querySelector(".sieve-update-msg").addEventListener("click", () => {
      SieveIpcClient.sendMessage("core", "open-url", url);
    });

    const parent = document.querySelector("#ctx");
    parent.insertBefore(template, parent.firstChild);
  }
}

export { SieveUpdaterUI };
