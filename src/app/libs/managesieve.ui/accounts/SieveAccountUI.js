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


import { SieveAbstractAccountUI } from "./SieveAbstractAccountUI.js";
import { SieveServerSettingsUI } from "./../settings/ui/SieveServerSettingsUI.js";
import { SieveCredentialsSettingsUI } from "./../settings/ui/SieveCredentialSettingsUI.js";

/**
 * A UI renderer for a sieve account
 */
class SieveNodeAccountUI extends SieveAbstractAccountUI{


  /**
   * Shows the server settings dialog.
   * @returns {Promise<boolean>}
   *   false in case the dialog was dismissed, otherwise true.
   */
  async showServerSettings() {

    const rv = await (new SieveServerSettingsUI(this)).show();

    // render settings in case they got changed.
    if (rv === false)
      return rv;

    this.renderSettings();

    // Update the account name it may have changed.
    document
      .querySelector(`#siv-account-${this.id} .siv-account-name`)
      .textContent = await this.send("account-get-displayname");

    return rv;
  }

  /**
   * Shows the credential settings dialog.
   * @returns {Promise<boolean>}
   *   false in case the dialog was dismissed otherwise true.
   **/
  async showCredentialSettings() {

    const rv = await (new SieveCredentialsSettingsUI(this)).show();

    if (rv === true)
      this.renderSettings();

    return rv;
  }


  /**
   * Exports the account's settings to a file.
   */
  async exportSettings() {
    await this.send("account-export");
  }
}

export { SieveNodeAccountUI as SieveAccountUI };
