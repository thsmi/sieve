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

import { SieveIpcClient } from "../../utils/SieveIpcClient.mjs";
import {
  SieveAbstractSecurity,
  SECURITY_NONE,
  SECURITY_EXPLICIT,
  SECURITY_IMPLICIT
} from "./SieveAbstractSecurity.mjs";

const PREF_MECHANISM = "security.mechanism";
const PREF_TLS = "security.tls";
const PREF_TLSFILES_CA = "security.tlsfiles.ca";
const PREF_TLSFILES_CERT = "security.tlsfiles.cert";
const PREF_TLSFILES_KEY = "security.tlsfiles.key";
const PREF_TLSFILES_PASSPHRASE = "security.tlsfiles.passphrase";

/**
 * Manages the account's security related settings
 */
class SieveSecurity extends SieveAbstractSecurity {

  /**
   * @inheritdoc
   */
  async getMechanism() {
    return await this.account.getConfig().getString(PREF_MECHANISM, "default");
  }

  /**
   * Sets the sasl mechanism.
   *
   * @param {string} mechanism
   *   the sasl mechanism which should be used.
   *
   * @returns {SieveSecurity}
   *   a self reference
   */
  async setMechanism(mechanism) {
    await this.account.getConfig().setString(PREF_MECHANISM, mechanism);
    return this;
  }

  /**
   * @inheritdoc
   */
  async getTLS() {
    return await this.account.getConfig().getInteger(PREF_TLS, SECURITY_EXPLICIT);
  }

  /**
   * Sets the connection security.
   * Throws in case an invalid connection security was passed.
   *
   * @param {int} value
   *   0 for no connection security
   *   1 for implicit tls
   *   2 for explicit tls
   * @returns {SieveSecurity}
   *   a self reference
   */
  async setTLS(value) {
    if ((value !== SECURITY_NONE) && (value !== SECURITY_IMPLICIT) && (value !== SECURITY_EXPLICIT))
      throw new Error("Invalid security setting");

    await this.account.getConfig().setInteger(PREF_TLS, value);
    return this;
  }

  /**
   * Gets the TLS files map object.
   *
   * @returns {object}
   *  the TLS files map object
   */
  async getTLSFiles () {
    const cfg = this.account.getConfig();

    return await {
      cachain: await cfg.getString(PREF_TLSFILES_CA, ""),
      cert: await cfg.getString(PREF_TLSFILES_CERT, ""),
      key: await cfg.getString(PREF_TLSFILES_KEY, "")
    };
  }

  /**
   * Sets the TLS files map object.
   *
   * @param {object} map
   *  the map object
   * @returns {SieveSecurity}
   *  a self reference
   */
  async setTLSFiles (map) {
    const cfg = this.account.getConfig();

    await cfg.setString(PREF_TLSFILES_CA, map.cachain);
    await cfg.setString(PREF_TLSFILES_CERT, map.cert);
    await cfg.setString(PREF_TLSFILES_KEY, map.key);

    return this;
  }

  /**
   * @inheritdoc
   */
  async getStoredTLSPassphrase() {
    const cfg = this.account.getConfig();
    const enp = await cfg.getValue(PREF_TLSFILES_PASSPHRASE);

    if (!enp) {
      return null;
    }

    return await SieveIpcClient.sendMessage(
      "core", "decrypt-string", enp, window);
  }

  /**
   * Encrypts and stores the passphrase for the private key.
   *
   * @param {string} passphrase the passphrase string
   * @returns {SieveSecurity} a self reference
   */
  async setStoredTLSPassphrase(passphrase) {
    const cfg = this.account.getConfig();
    const enp = await SieveIpcClient.sendMessage(
      "core", "encrypt-string", passphrase, window);

    await cfg.setValue(PREF_TLSFILES_PASSPHRASE, enp);

    return this;
  }

  /**
   * Clears the stored TLS passphrase
   *
   * @returns {SieveSecurity} a self reference
   */
  async clearStoredTLSPassphrase() {
    await this.account.getConfig().removeKey(PREF_TLSFILES_PASSPHRASE);
    return this;
  }

  /**
   * Prompt a new passphrase for the private key.
   *
   * @param {string} filepath the path to the private key
   * @param {string} error the message describing the error, usually from openssl
   * @returns {{
   *  passphrase: {string},
   *  remember: {boolean}
   * }} the object containing prompt result
   */
  async promptPassphrase(filepath, error) {
    return await SieveIpcClient.sendMessage(
      "accounts",
      "tls-show-passphrase",
      {
        filepath: filepath,
        options: { remember: true, error: error }
      });
  }
}

export { SieveSecurity };
