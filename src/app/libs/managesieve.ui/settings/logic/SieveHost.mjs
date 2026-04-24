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

const CONFIG_KEEP_ALIVE_INTERVAL = "keepalive";
// eslint-disable-next-line no-magic-numbers
const THIRTY_SECONDS = 30 * 1000;
// eslint-disable-next-line no-magic-numbers
const ONE_MINUTE = 60 * 1000;
// eslint-disable-next-line no-magic-numbers
const FIVE_MINUTES = 5 * ONE_MINUTE;

import { SieveCustomHost } from "./SieveAbstractHost.mjs";

/**
 * Extends the CustomHost implementation by a display name and fingerprint setting
 **/
class SieveElectronHost extends SieveCustomHost {

  /**
   * @inheritdoc
   **/
  async getHostname() {
    return await this.account.getConfig().getString("hostname", "");
  }

  /**
   * Sets the custom hostname which shall be used.
   *
   * @param {string} hostname
   *   the hostname or ip as string.
   *
   * @returns {SieveElectronHost}
   *   a self reference
   */
  async setHostname(hostname) {
    await this.account.getConfig().setString("hostname", hostname);
    return this;
  }

  /**
   * @inheritdoc
   **/
  async getDisplayName() {
    return await this.account.getConfig().getString("host.displayName", "Unnamed Account");
  }

  /**
   * Sets the account display name.
   * @param {string} value
   *   sets the account's display name
   * @returns {SieveCustomHostEx}
   *   a self reference
   */
  async setDisplayName(value) {
    await this.account.getConfig().setString("host.displayName", value);
    return this;
  }

  /**
   * Configures the maximum idle time after a message is sent.
   * After the time elapsed a keep alive message will be
   * sent to the server.
   *
   * @param {int} value
   *   the maximal time in seconds. zero disables keep alive messages
   *
   * @returns {SieveAbstractHost}
   *   a self reference
   */
  async setKeepAlive(value) {
    await this.account.getConfig().setInteger(CONFIG_KEEP_ALIVE_INTERVAL, value);
    return this;
  }

  /**
   * @inheritdoc
   */
  async getKeepAlive() {
    return await this.account.getConfig().getInteger(CONFIG_KEEP_ALIVE_INTERVAL, THIRTY_SECONDS);
  }

  /**
   * Each certificate has a unique fingerprint.
   *
   * Normally this fingerprint is not used directly.
   * But in case no chain of trust can be established,
   * the typical fallback is to verify the fingerprint.
   *
   * This is normal case for a self signed certificate.
   *
   * @returns {string}
   *   the accounts fingerprint or an empty string in case no fingerprint is stored.
   **/
  async getFingerprint() {
    return await this.account.getConfig().getString("host.fingerprint", "");
  }

  /**
   * Sets the account's fingerprint.
   *
   * @param {string} value
   *   the accounts fingerprint, or pass an empty string to disable.
   * @returns {SieveCustomHostEx}
   *   a self reference
   */
  async setFingerprint(value) {
    await this.account.getConfig().setString("host.fingerprint", value);
    return this;
  }

  /**
   * Gets the certificate errors to ignore.
   *
   * @returns {string}
   *   the node js error code to ignore as string or an empty string.
   */
  async getIgnoreCertErrors() {
    return await this.account.getConfig().getString("host.ignoreCertErrors", "");
  }

  /**
   * Defines which certificate error code should be ignored.
   *
   * In general it is not a good idea to ignore certificate errors.
   * But there are some exception: e.g. a self signed error
   * after you verified the certificates fingerprint.
   *
   * @param {string} errorCode
   *   the node js error code or an empty string to disable.
   * @returns {SieveCustomHostEx}
   *   a self reference
   */
  async setIgnoreCertErrors(errorCode) {
    await this.account.getConfig().setString("host.ignoreCertErrors", errorCode);
    return this;
  }
}

export { SieveElectronHost as SieveHost };
