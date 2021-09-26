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

import { SieveIpcClient } from "./../../utils/SieveIpcClient.mjs";

const KEY_USERNAME = "authentication.username";
const KEY_PASSWORD = "authentication.password";

/**
 * Prompts for a password.
 */
class SieveElectronAuthentication extends SieveAbstractAuthentication {

  /**
   * @inheritdoc
   */
  constructor(account) {
    super(account);
    this.canStore = null;
  }
  /**
   * Sets the username.
   *
   * @param {string} username
   *   the username as string, can not be null.
   *
   */
  async setUsername(username) {
    await this.account.getConfig().setString(KEY_USERNAME, username);
  }

  /**
   * @inheritdoc
   */
  async getUsername() {
    return await this.account.getConfig().getString(KEY_USERNAME);
  }

  /**
   * @inheritdoc
   */
  hasPassword() {
    return true;
  }

  /**
   * Checks electron can encrypt and decrypt passwords.
   *
   * It could be unavailable due to missing libraries or because
   * it has been disabled by the IT administrator.
   *
   * @returns {boolean}
   *   true in case a password can be stored otherwise false.
   */
  async canStorePassword() {
    return await SieveIpcClient.sendMessage("core", "has-encryption", "", window);
  }

  /**
   * Forgets any passwords remembered for this username.
   * It will fail silently.
   */
  async forget() {
    await (this.account.getConfig().removeKey(KEY_PASSWORD));
  }

  /**
   * Stores a password in the account settings.
   * It will fail silently in case storing the password failed.
   *
   * @param {string} password
   *   the password to be stored.
   */
  async setStoredPassword(password) {

    if (! await this.canStorePassword())
      return;

    password = await SieveIpcClient.sendMessage(
      "core", "encrypt-string", password, window);

    await (this.account.getConfig().setValue(KEY_PASSWORD, password));
  }

  /**
   * Gets and decrypts the stored password from the account settings
   *
   * @returns {string}
   *  the password or null in case it does not exist.
   */
  async getStoredPassword() {
    if (!await this.canStorePassword())
      return null;

    const password = await (this.account.getConfig().getValue(KEY_PASSWORD));
    if (password === undefined || password === null)
      return null;

    return await SieveIpcClient.sendMessage(
      "core", "decrypt-string", password, window);
  }

  /**
   * Checks if a password is stored in the account settings.
   *
   * @returns {boolean}
   *   true in case a password is stored.
   */
  async hasStoredPassword() {
    if (!await this.canStorePassword())
      return false;

    const password = await (this.account.getConfig().getValue(KEY_PASSWORD));
    if (password === undefined || password === null)
      return false;

    return true;
  }

  /**
   * @inheritdoc
   */
  async getPassword() {

    if (await this.hasStoredPassword())
      return await this.getStoredPassword();

    const request = {
      "username": await this.getUsername(),
      "displayname": await (await this.account.getHost()).getDisplayName(),
      "remember": await this.canStorePassword()
    };

    const credentials = await SieveIpcClient.sendMessage(
      "accounts", "account-show-authentication", request);

    if (credentials.remember)
      await this.setStoredPassword(credentials.password);

    return credentials.password;
  }
}

export { SieveElectronAuthentication as SieveAuthentication };
