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

import { SievePrefManager } from "./SievePrefManager.mjs";

import { SieveAuthorization } from "./SieveAuthorization.mjs";
import { SieveAuthentication } from "./SieveAuthentication.mjs";
import { SieveSecurity } from "./SieveSecurity.mjs";
import { SieveHost } from "./SieveHost.mjs";
import { SieveAccountSettings } from "./SieveAccountSettings.mjs";
import { SieveEditorSettings } from "./SieveEditorSettings.mjs";

import { SieveLogger } from "./../../utils/SieveLogger.mjs";
/**
 * Abstract implementation for managing an account's preferences.
 */
class SieveAbstractAccount {

  /**
   * Creates a new instance.
   *
   * @param {string} id
   *   the account's unique id.
   */
  constructor(id) {
    this.id = id;

    this.preferences = new SievePrefManager(`@${id}`);

    this.host = new SieveHost(this);
    this.authentication = new SieveAuthentication(this);
    this.authorization = new SieveAuthorization(this);
    this.security = new SieveSecurity(this);
    this.common = new SieveAccountSettings(this);
  }

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
   * Returns the account's unique id.
   * @returns {string}
   *   the account unique id.
   */
  getId() {
    return this.id;
  }

  /**
   * Returns a reference to the preference manager for this account.
   *
   * @returns {SievePrefManager}
   *   the reference to the preference manager
   */
  getConfig() {
    return this.preferences;
  }

  /**
   * Contains information about the server settings like
   * the hostname, port etc.
   *
   * @returns {SieveHost}
   *   the current host settings
   **/
  getHost() {
    return this.host;
  }

  /**
   * Host alls security related setting like the SASL
   * mechanisms or the tls configuration.
   *
   *  @returns {SieveSecurity}
   *   the current security settings
   */
  getSecurity() {
    return this.security;
  }

  /**
   * Gets the authentication configuration
   *
   * @returns {SieveAbstractAuthentication}
   *   the object managing the authentication for the type.
   */
  getAuthentication() {
    return this.authentication;
  }

  /**
   * Defines which authorization configuration is active.
   *
   * @param {int} type
   *   the authorization type which should be activated.
   * @returns {SieveAbstractAccount}
   *   a self reference
   */
  async setAuthorization(type) {
    await this.authorization.setMechanism(type);
    return this;
  }

  /**
   * Gets the authorization configuration.
   *
   * @param {SieveAbstractAuthorization} [type]
   *   optional authorization type. In case it is omitted
   *   default settings are returned.
   * @returns {SieveAbstractAuthorization}
   *   the object managing the authorization for the type
   */
  async getAuthorization(type) {
    return await this.authorization.get(type);
  }

  /**
   * Gets miscellaneous account specific settings like the log levels etc.
   *
   * @returns {SieveAccountSettings}
   *   the object managing the miscellaneous account settings
   */
  getSettings() {
    return this.common;
  }

  /**
   * Gets the object managing the accounts editor's settings.
   *
   * @returns {SieveEditorSettings}
   *   the settings object
   */
  getEditor() {
    return new SieveEditorSettings(
      new SievePrefManager(this.getConfig().getNamespace()));
  }
}

export { SieveAbstractAccount };
