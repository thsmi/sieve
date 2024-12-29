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

// This is an ugly hack for an Electron shortcoming. Technically we want to use
// ESM style imports. But this is not possible because the rendering process only
// allows to load modules from the chrome context not from the node module context.
// Thus we need to use a classic ols school import.
// But to make things more complicated if running a mjs module in node. Which is
// done for unit testing. Then we don't have a require, because ESMs don't need
// it normally.
// This means we need polyfill for the following three cases:
// If we have a global.require we are running a commonjs in a node context.
// In case we have a window.require then we are running inside an electron rendering
// process. In case neither nor is true we are most likely in a node esm context.

const require = (global || window).require || (await import("node:module")).createRequire(import.meta.url);

const path = require('path');
const fs = require('fs');

import { SieveLogger } from "./../../utils/SieveLogger.mjs";

const PREF_KEY_ACCOUNTS = '^.*user_pref\\(.*"mail.accountmanager.accounts".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER = '^.*user_pref\\(.*"mail.account.%account%.server".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER_TYPE = '^.*user_pref\\(.*"mail.server.%server%.type".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER_USERNAME = '^.*user_pref\\(.*"mail.server.%server%.userName".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER_HOSTNAME = '^.*user_pref\\(.*"mail.server.%server%.hostname".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER_REALUSERNAME = '^.*user_pref\\(.*"mail.server.%server%.realuserName".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER_REALHOSTNAME = '^.*user_pref\\(.*"mail.server.%server%.realhostname".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER_NAME = '^.*user_pref\\(.*"mail.server.%server%.name".*,.*"(.*)"\\);.*$';

const FIRST_MATCH = 1;

const logger = SieveLogger.getInstance();

/**
 * Parses the server from a pref.js file.
 */
class SieveThunderbirdServer {

  /**
   * Initializes a new instance.
   *
   * @param {string} prefs
   *   the content of the prefs.js file.
   * @param {string} serverId
   *   the server's unique name
   */
  constructor(prefs, serverId) {
    this.prefs = prefs;
    this.serverId = serverId;
  }

  /**
   * Extracts the given value for the given key from the server settings.
   *
   * @param {string} key
   *   the preference key to be retrieved
   *
   * @returns {string}
   *   the key's value or null in case it does not exist.
   */
  getValue(key) {

    key = key.replace("%server%", this.serverId);

    const value = (new RegExp(key, "gm")).exec(this.prefs);

    if (!value)
      return null;

    return value[FIRST_MATCH];
  }

  /**
   * Gets the username for the given server.
   * It will throw in case the key does not exist.
   *
   * @returns {string}
   *   the username associated to the server.
   */
  getUserName() {
    let username = this.getValue(PREF_KEY_SERVER_REALUSERNAME);

    if (username === null)
      username = this.getValue(PREF_KEY_SERVER_USERNAME);

    if (username === null)
      throw new Error(`Could not find a username for server ${this.serverId}`);

    return username;
  }

  /**
   * Gets the hostname for the given server.
   * It will throw in case the key does not exist.
   *
   * @returns {string}
   *   the hostname associated to the server.
   */
  getHostName() {
    let hostname = this.getValue(PREF_KEY_SERVER_REALHOSTNAME);

    if (hostname === null)
      hostname = this.getValue(PREF_KEY_SERVER_HOSTNAME);

    if (hostname === null)
      throw new Error(`Could not find a hostname for server ${this.serverId}`);

    return hostname;
  }

  /**
   * Gets name which is associated with the server's id.
   *
   * @returns {string}
   *   the server's name in case it does not exist a exception ill be thrown.
   */
  getName() {
    const name = this.getValue(PREF_KEY_SERVER_NAME);

    if (name === null)
      throw new Error(`Could not find a name for the server ${this.serverId}`);

    return name;
  }

  /**
   * Gets the server's account type.
   *
   * @returns {string}
   *   the account type e.g. imap.
   */
  getType() {
    return this.getValue(PREF_KEY_SERVER_TYPE);
  }
}

/**
 * Parses the prefs.js file for accounts.
 */
class SieveThunderbirdAccounts {

  /**
   * Initializes a new instance.
   *
   * @param {string} prefs
   *   the content of the prefs.js file.
   */
  constructor(prefs) {
    this.prefs = prefs;
  }

  /**
   * Gets the preference value for the given key.
   *
   * @param {string} key
   *   the pref key to be returned.
   * @returns {string}
   *   the key or null in case it does not exist.
   */
  getValue(key) {
    return (new RegExp(key, "gm")).exec(this.prefs);
  }

  /**
   * Gets a list with the ids for all known accounts from the preferences file.
   *
   * @returns {string[]}
   *   a list of all account ids
   */
  getAccountIds() {
    const accounts = this.getValue(PREF_KEY_ACCOUNTS);

    if (!accounts)
      return [];

    return accounts[FIRST_MATCH].split(",");
  }

  /**
   * Gets the serverId which is associated to the account id.
   *
   * @param {string} accountId
   *   the server which is associated to the given account id.
   *
   * @returns {string}
   *   the server's unique id.
   */
  getServer(accountId) {
    const id = this.getValue(PREF_KEY_SERVER.replace("%account%", accountId));

    if (!id)
      throw new Error(`No server configured for account >>${accountId}<<`);

    return new SieveThunderbirdServer(this.prefs, id[FIRST_MATCH]);
  }


  /**
   * Returns the settings from the preference file for all imap accounts.
   *
   * @returns {object[]}
   *   a list with all accounts known by the the profile.
   */
  getAccounts() {

    const results = [];

    for (const id of this.getAccountIds()) {

      try {
        const server = this.getServer(id);

        if (server.getType() !== "imap")
          continue;

        results.push({
          "username": server.getUserName(),
          "hostname": server.getHostName(),
          "name": server.getName()
        });

      } catch (ex) {
        SieveLogger.getInstance().logAction(`Can't import account ${id} because of exception ${ex}`);
      }
    }

    return results.sort((a, b) => { return a.name.localeCompare(b.name); });
  }
}

/**
 * Parses a thunder bird profile for imap accounts.
 */
class SieveThunderbirdProfile {

  /**
   * Creates a new instance.
   *
   * @param {string} root
   *   the root directory which contains the profile.ini
   */
  constructor(root) {
    this.root = root;

    this.name = "Unnamed";
    this.path = "";
    this.relative = false;
    this.defaultProfile = false;
  }

  /**
   * Parses a section of the profile ini.
   *
   * @param {string} section
   *   the section to be parsed.
   * @returns {SieveThunderbirdProfile}
   *   the profile configured in the section.
   */
  init(section) {

    const lines = section.split(/\r?\n/g);

    for (let line of lines) {
      line = line.trim();

      if (line.toLocaleLowerCase() === "default=1")
        this.defaultProfile = true;

      if (line.toLocaleLowerCase().startsWith("path="))
        this.path = line.split("=")[FIRST_MATCH];

      if (line.toLocaleLowerCase() === "isrelative=1")
        this.relative = true;

      if (line.toLocaleLowerCase().startsWith("name="))
        this.name = line.split("=")[FIRST_MATCH];
    }

    return this;
  }


  /**
   * Checks if the profile is relative.
   *
   * @returns {boolean}
   *   true in case the profile is relative
   */
  isRelative() {
    return this.relative;
  }

  /**
   * Checks if this is the default profile.
   *
   * @returns {boolean}
   *   true in case it is the default profile otherwise false.
   */
  isDefault() {
    return this.defaultProfile;
  }

  /**
   * Gets the profiles name
   *
   * @returns {string}
   *   the name as string.
   */
  getName() {
    return this.name;
  }

  /**
   * Returns the directory containing the prefs.js and other profile related files.
   *
   * @returns {string}
   *  in case it is relative it will be automatically converted into absolute.
   */
  getProfileDirectory() {

    if (this.isRelative())
      return path.join(this.root, this.path);

    return this.path;
  }

  /**
   * Reads the preferences located inside the profile directory.
   * In case the file does not exist an empty string is returned.
   *
   * @returns {string}
   *   the preference as string. In case the file does not exist and empty
   *   string is returned.
   */
  getPreferences() {
    const file = path.join(this.getProfileDirectory(), "prefs.js");

    if (!fs.existsSync(file))
      return "";

    return fs.readFileSync(file, "utf-8");
  }

  /**
   * Creates a new accounts object from the given prefs.
   *
   * @param {string} prefs
   *   the prefs which should be parsed for accounts.
   *
   * @returns {SieveThunderbirdAccounts}
   *   the accounts object which contains the account preferences.
   */
  createAccount(prefs) {
    return new SieveThunderbirdAccounts(prefs);
  }

  /**
   * Returns the settings from the preference file for all imap accounts.
   *
   * @returns {SieveThunderbirdAccount[]}
   *   a list with all accounts known by the the profile.
   */
  getAccounts() {
    return this.createAccount(this.getPreferences()).getAccounts();
  }

  /**
   * Converts the project in to a json representation
   *
   * @returns {object}
   *   the data converted into a json object.
   */
  toJson() {
    return {
      "name": this.getName(),
      "path": this.getProfileDirectory(),
      "isDefault": this.isDefault(),
      "accounts": this.getAccounts()
    };
  }

}

/**
 * Discovers and parses the current users's thunderbird profile.
 */
class SieveThunderbirdProfiles {

  /**
   * Returns electron's process info.
   * Used primarily for testing to mock the global non overridable process object.
   *
   * @returns {ProcessInfo}
   *   the process info.
   */
  getProcessInfo() {
    return process;
  }

  /**
   * Tries to get thunderbird's profile directory.
   *
   * @returns {string}
   *   the profile directory
   */
  getProfileDirectory() {
    const process = this.getProcessInfo();

    if (process.platform === "linux")
      return path.join(process.env.HOME, ".thunderbird");

    if (process.platform === "win32")
      return path.join(process.env.APPDATA, "Thunderbird");

    throw new Error("Unsupported Platform");
  }

  /**
   * Create a new profile for the given profile.ini section
   *
   * @param {string} root
   *   the directory which owns the profile.ini.
   *
   * @param {string} section
   *   the profile section to be parsed.
   *
   * @returns {SieveThunderbirdProfile}
   *   the profile which contains the data from the section.
   */
  createProfile(root, section) {
    return (new SieveThunderbirdProfile(root)).init(section);
  }

  /**
   * Returns all profiles defined in the profile.ini.
   * Each section within the profile.ini is equivalent to profile.
   *
   * @param {string} filename
   *   the full path to the profile ini which should be analyzed.
   *
   * @returns {SieveThunderbirdProfile[]}
   *   a list containing all the known profiles.
   */
  getProfiles(filename) {

    if (!fs.existsSync(filename))
      throw new Error(`Could not find a profiles.ini at >>${filename}<<`);

    logger.logAction(`Loading profile at ${filename}`);

    const file = fs.readFileSync(filename, "utf-8");
    const sections = file.split(/\[\w*]/gm);

    const profiles = [];

    for (const section of sections) {
      const profile = this.createProfile(path.dirname(filename), section);

      if (!profile.getAccounts().length)
        continue;

      profiles.push(profile);
    }

    return profiles;
  }

  /**
   * A shorthand which returns the accounts for all profiles exposed to the
   * current used.
   *
   * @returns {object}
   *   a json structure containing the account and profile information.
   */
  getAccounts() {

    const file = path.join(this.getProfileDirectory(), "profiles.ini");

    logger.logAction(`Getting accounts for profiles in ${file}`);

    const result = [];

    for (const profile of this.getProfiles(file))
      result.push(profile.toJson());

    return result;
  }

}

export {
  SieveThunderbirdProfiles,
  SieveThunderbirdProfile,
  SieveThunderbirdAccounts,
  SieveThunderbirdServer
};
