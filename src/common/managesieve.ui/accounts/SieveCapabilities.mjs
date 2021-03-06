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

/* global bootstrap */
import { SieveTemplate } from "./../utils/SieveTemplate.mjs";

/**
 * Implements a dialog which displays the accounts capabilities.
 */
class SieveCapabilities {

  /**
   * Shows the capability dialog.
   *
   * @param {object} capabilities
   *   the server's capabilities.
   */
  async show(capabilities) {

    document.querySelector("#ctx").append(
      await (new SieveTemplate()).load("./accounts/account.capabilities.html"));

    document.querySelector("#sieve-capabilities-server").textContent
      = capabilities.implementation;
    document.querySelector("#sieve-capabilities-version").textContent
      = capabilities.version;
    document.querySelector("#sieve-capabilities-sasl").textContent
      = Object.values(capabilities.sasl).join(" ");
    document.querySelector("#sieve-capabilities-extensions").textContent
      = Object.keys(capabilities.extensions).join(" ");
    document.querySelector("#sieve-capabilities-language").textContent
      = capabilities.language;

    await new Promise((resolve) => {

      const dialog = document.querySelector('#sieve-dialog-capabilities');

      const modal = new bootstrap.Modal(dialog);
      modal.show();

      dialog.addEventListener("hidden.bs.modal", () => {
        resolve();

        const elm = document.querySelector('#sieve-dialog-capabilities');
        elm.remove();

        modal.dispose();
      });
    });

  }
}

export { SieveCapabilities };
