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

import { SieveIpcClient } from "./../../utils/SieveIpcClient.js";

let keytar = null;

const KEY_USERNAME = "authentication.username";

/**
 * Prompts for a password.
 */
class SieveElectronAuthentication extends SieveAbstractAuthentication {

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
  canStorePassword() {
    const keystore = this.getKeyStore();

    if (typeof (keystore) === "undefined" || keystore === null)
      return false;

    return true;
  }

  /**
   * Returns the system wide keystore.
   * There is no guarantee that it exists.
   * It may fail due to missing external dependencies or because it was
   * just disabled by the administrator.
   *
   * @returns {Keytar}
   *   the keytar object.
   */
  getKeyStore() {
    if (typeof (keytar) !== "undefined" && keytar !== null)
      return keytar;

    try {
      keytar = require("./../../../keytar");
    } catch (ex) {
      this.account.getLogger().logAction("Could not initialize keystore: " + ex);
    }

    return keytar;
  }

  /**
   * Forgets any passwords remembered for this username.
   * It will fail silently.
   */
  async forget() {
    try {
      if (!this.canStorePassword())
        return;

      const username = await this.getUsername();
      await this.getKeyStore().deletePassword("Sieve Editor", username);
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
      if (!this.canStorePassword())
        return;

      const username = await this.getUsername();
      await this.getKeyStore().setPassword("Sieve Editor", username, password);
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
      if (!this.canStorePassword())
        return null;

      const username = await this.getUsername();
      return await this.getKeyStore().getPassword("Sieve Editor", username);
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
      if (!this.canStorePassword())
        return false;

      const username = await this.getUsername();

      if (await this.getKeyStore().getPassword("Sieve Editor", username) === null)
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
      "remember": this.canStorePassword()
    };

    const credentials = await SieveIpcClient.sendMessage(
      "accounts", "account-show-authentication", request);

    if (credentials.remember)
      await this.setStoredPassword(credentials.password);

    return credentials.password;
  }
}

export { SieveElectronAuthentication as SieveAuthentication };
