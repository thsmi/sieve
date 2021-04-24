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

import { SieveAbstractAccountUI } from "./SieveAbstractAccountUI.mjs";

import { SieveCredentialsSettingsUI } from "./../settings/ui/SieveCredentialSettingsUI.mjs";
import { SieveServerSettingsUI } from "./../settings/ui/SieveServerSettingsUI.mjs";

/**
 * A UI renderer for a sieve account
 */
class SieveNodeAccountUI extends SieveAbstractAccountUI{

  /**
   * Renders the settings pane
   *
   */
  async renderSettings() {

    await super.renderSettings();

    const elm = document.querySelector(`#siv-account-${this.id} .sieve-settings-content`);

    // ... finally connect the listeners.
    if (elm.querySelector(".sieve-account-delete-server")) {
      elm.querySelector(".sieve-account-delete-server")
        .addEventListener("click", () => { this.remove(); });
    }

    if (elm.querySelector(".sieve-account-edit-server")) {
      elm.querySelector(".sieve-account-edit-server")
        .addEventListener("click", () => { this.showServerSettings(); });
    }

    if (elm.querySelector(".sieve-account-edit-credentials")) {
      elm.querySelector(".sieve-account-edit-credentials")
        .addEventListener("click", () => { this.showCredentialSettings(); });
    }

    if (elm.querySelector(".sieve-account-export")) {
      elm.querySelector(".sieve-account-export")
        .addEventListener("click", () => { this.exportSettings(); });
    }

  }



  /**
   * Asks the user if he is sure to delete the account.
   * If yes it triggers expunging the account settings.
   * This can not be undone.
   */
  async remove() {
    await this.accounts.remove(this);
  }

  /**
   * Shows the server settings dialog.
   */
  async showServerSettings() {

    await (new SieveServerSettingsUI(this)).show();

    this.renderSettings();

    // Update the account name it may have changed.
    document
      .querySelector(`#siv-account-${this.id} .siv-account-name`)
      .textContent = await this.send("account-get-displayname");
  }

  /**
   * Shows the credential settings dialog.
   **/
  showCredentialSettings() {
    (new SieveCredentialsSettingsUI(this)).show();
  }

  /**
   * Exports the account's settings to a file.
   */
  async exportSettings() {
    await this.send("account-export");
  }

}

export { SieveNodeAccountUI as SieveAccountUI };
