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
   * Checks if the system key store can be accessed from this app.
   * It could be unavailable due to missing libraries or because
   * it has been disabled by the IT administrator.
   *
   * @returns {boolean}
   *   true in case a password can be stored otherwise false.
   */
  async canStorePassword() {
    if (typeof (this.canStore) === "undefined" || this.canStore === null) {
      this.canStore = await SieveIpcClient.sendMessage("core", "keystore-ready", "", window);
    }

    return (this.canStore === true);
  }

  /**
   * Forgets any passwords remembered for this username.
   * It will fail silently.
   */
  async forget() {
    try {
      if (!await this.canStorePassword())
        return;

      const username = await this.getUsername();

      await SieveIpcClient.sendMessage(
        "core", "keystore-forget", { "username": username }, window);

    } catch (ex) {
      this.account.getLogger().logAction("Forgetting password failed " + ex);
    }
  }

  /**
   * Stores a password in the system wide key store.
   * It will fail silently in case storing the password failed.
   *
   * @param {string} password
   *   the password to be stored.
   */
  async setStoredPassword(password) {
    try {
      if (! await this.canStorePassword())
        return;

      const username = await this.getUsername();

      await SieveIpcClient.sendMessage(
        "core", "keystore-store", { "username": username, "password": password }, window);

    } catch (ex) {
      this.account.getLogger().logAction("Storing password failed " + ex);
    }
  }

  /**
   * Gets the stored password
   *
   * @returns {string}
   *  the password or null in case it does not exist.
   */
  async getStoredPassword() {
    try {
      if (!await this.canStorePassword())
        return null;

      const username = await this.getUsername();

      return await SieveIpcClient.sendMessage(
        "core", "keystore-get", { "username": username }, window);

    } catch (ex) {
      this.account.getLogger().logAction("Getting password failed " + ex);
    }

    return null;
  }

  /**
   * Checks if the password is stored in the cert store.
   *
   * @returns {boolean}
   *   true in case a password is stored.
   */
  async hasStoredPassword() {
    try {
      if (!await this.canStorePassword())
        return false;

      if (await this.getStoredPassword() === null)
        return false;

      return true;
    } catch (ex) {
      this.account.getLogger().logAction("Checking for stored password failed " + ex);
    }

    return false;
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
