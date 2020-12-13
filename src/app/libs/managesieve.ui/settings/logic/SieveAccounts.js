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


const JSON_INDENTATION = 2;

const CONFIG_ID_GLOBAL = "global";
const CONFIG_KEY_ACCOUNTS = "accounts";


const SETTINGS_VERSION_I = 1;

import { SieveLogger } from "./../../utils/SieveLogger.js";

import { SievePrefManager } from './SievePrefManager.js';

import { SieveAccount } from "./SieveAccount.js";
import { SieveAbstractAccounts } from "./SieveAbstractAccounts.js";

/**
 * Manages the configuration for sieve accounts.
 * It behaves like a directory. Ist just lists the accounts.
 * The individual settings are managed by the SieveAccount object
 *
 * It uses the DOM's local store to persist the configuration data.
 */
class SieveAccounts extends SieveAbstractAccounts {

  /**
   * @inheritdoc
   */
  async load() {

    const items = await (new SievePrefManager(CONFIG_ID_GLOBAL)).getComplexValue(CONFIG_KEY_ACCOUNTS, []);

    const accounts = {};

    SieveLogger.getInstance().level(await this.getLogLevel());

    if (!items)
      return this;

    for (const item of items) {
      // Recreate the accounts only when needed...
      if (this.accounts[item])
        accounts[item] = this.accounts[item];
      else
        accounts[item] = new SieveAccount(item);
    }

    this.accounts = accounts;
    return this;
  }

  /**
   * Saves the list of account configurations.
   *
   * @returns {SieveAccounts}
   *   a self reference.
   */
  async save() {
    await (new SievePrefManager(CONFIG_ID_GLOBAL)).setComplexValue(CONFIG_KEY_ACCOUNTS, [...Object.keys(this.accounts)]);
    return this;
  }

  /**
   * Creates a new account.
   * The new account will be initialized with default and then added to the list of accounts
   *
   * @param {object} [details]
   *   the accounts details like the name, hostname, port and username as key value pairs.
   *
   * @returns {SieveAccounts}
   *   a self reference.
   */
  async create(details) {

    // create a unique id;

    const id = this.generateId();

    this.accounts[id] = new SieveAccount(id);

    await this.save();

    if (typeof (details) === "undefined" || details === null)
      return this;

    if ((details.hostname !== null) && (details.hostname !== undefined))
      await (await this.accounts[id].getHost()).setHostname(details.hostname);

    if ((details.port !== null) && (details.port !== undefined))
      await (await this.accounts[id].getHost()).setPort(details.port);

    if ((details.username !== null) && (details.username !== undefined))
      await (await this.accounts[id].getAuthentication()).setUsername(details.username);

    if ((details.name !== null) && (details.name !== undefined))
      await (await this.accounts[id].getHost()).setDisplayName(details.name);

    return this;
  }

  /**
   * Removes the account including all settings.
   *
   * @param {AccountId} id
   *   the unique id which identifies the account.
   * @returns {SieveAccounts}
   *   a self reference
   */
  async remove(id) {
    // remove the accounts...
    delete this.accounts[id];
    // ... an persist it.
    await this.save();

    // remove the account's settings.
    (new SievePrefManager(`@${id}`)).clear();

    return this;
  }

  /**
   * Imports previously exported account settings.
   *
   * @param {string} data
   *   the settings to be imported.
   */
  async import(data) {
    data = JSON.parse(data);

    if (data.version !== SETTINGS_VERSION_I)
      throw new Error(`Unknown version ${data.version}`);

    const details = {
      name: data.settings["host.displayName"],
      hostname: data.settings["hostname"],
      port: data.settings["port"],
      username: data.settings["authentication.username"]
    };

    await this.create(details);
  }

  /**
   * Exports the account's settings.
   *
   * @param {string} id
   *   the unique account id.
   *
   * @returns {string}
   *   the account settings as json string.
   */
  async export(id) {
    const config = new SievePrefManager(`@${id}`);

    let data = {};
    for (const key of config.getKeys())
      data[key] = await (config.getValue(key));

    data = {
      "version": SETTINGS_VERSION_I,
      "settings": data
    };

    return JSON.stringify(
      data, null, JSON_INDENTATION);
  }
}

export { SieveAccounts };
