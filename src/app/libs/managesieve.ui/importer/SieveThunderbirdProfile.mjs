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

const PREF_KEY_ACCOUNTS = '^.*user_pref\\(.*"mail.accountmanager.accounts".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER = '^.*user_pref\\(.*"mail.account.%account%.server".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER_TYPE = '^.*user_pref\\(.*"mail.server.%server%.type".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER_USERNAME = '^.*user_pref\\(.*"mail.server.%server%.userName".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER_HOSTNAME = '^.*user_pref\\(.*"mail.server.%server%.hostname".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER_REALUSERNAME = '^.*user_pref\\(.*"mail.server.%server%.realuserName".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER_REALHOSTNAME = '^.*user_pref\\(.*"mail.server.%server%.realhostname".*,.*"(.*)"\\);.*$';
const PREF_KEY_SERVER_NAME = '^.*user_pref\\(.*"mail.server.%server%.name".*,.*"(.*)"\\);.*$';

const FIRST_MATCH = 1;

const path = require('path');
const fs = require('fs');

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
   *   the profile configured in the section
   */
  parse(section) {

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
   * Extracts the given key from the server settings.
   *
   * @param {string} profile
   *   the profile data
   * @param {string} server
   *   the server's unique name
   * @param {string} key
   *   the preference key to be retrieved
   *
   * @returns {string}
   *   the key's value or null in case it does not exist.
   */
  getServerKey(profile, server, key) {
    const value = (new RegExp(key.replace("%server%", server), "gm")).exec(profile);

    if (!value)
      return null;

    return value[FIRST_MATCH];
  }

  /**
   * Returns the settings from the preference file for all imap accounts.
   *
   * @returns {SieveThunderbirdAccount[]}
   *   a list with all accounts knonw by the the profile.
   */
  getAccounts() {

    const result = [];

    const file = path.join(this.getProfileDirectory(), "prefs.js");

    if (!fs.existsSync(file))
      return result;

    const profile = fs.readFileSync(file, "utf-8");

    const accounts = (new RegExp(PREF_KEY_ACCOUNTS, "gm")).exec(profile)[FIRST_MATCH].split(",");

    for (const account of accounts) {
      const server = (new RegExp(PREF_KEY_SERVER.replace("%account%", account), "gm")).exec(profile)[FIRST_MATCH];
      const type = this.getServerKey(profile, server, PREF_KEY_SERVER_TYPE);

      if (type !== "imap")
        continue;

      let username = this.getServerKey(profile, server, PREF_KEY_SERVER_REALUSERNAME);

      if (!username)
        username = this.getServerKey(profile, server, PREF_KEY_SERVER_USERNAME);

      let hostname = this.getServerKey(profile, server, PREF_KEY_SERVER_REALHOSTNAME);
      if (!hostname)
        hostname = this.getServerKey(profile, server, PREF_KEY_SERVER_HOSTNAME);

      const name = this.getServerKey(profile, server, PREF_KEY_SERVER_NAME);

      result.push({
        "username" : username,
        "hostname" : hostname,
        "name" : name
      });
    }

    return result;
  }

  /**
   * Converts the project in to a json representation
   *
   * @returns {object}
   *   the data converted into a json object.
   */
  toJson() {
    return {
      "name" : this.getName(),
      "path" : this.getProfileDirectory(),
      "isDefault" : this.isDefault(),
      "accounts" : this.getAccounts()
    };
  }

}

/**
 * Discovers and parses the current users's thunderbird profile.
 */
class SieveThunderbirdProfiles {

  /**
   * Tries to get thunderbird's profile directory.
   *
   * @returns {string}
   *   the profile directory
   */
  getProfileDirectory() {

    let directory;

    if (process.platform === "linux")
      directory = path.join(process.env.HOME, ".thunderbird");
    else if (process.platform === "win32")
      directory = path.join(process.env.APPDATA, "Thunderbird");
    else
      throw new Error("Unsupported Platform");

    if (!fs.existsSync(directory))
      throw new Error("No file path");

    return directory;
  }

  /**
   * Returns all profiles defined in the profile.ini.
   * Each section within the profile.ini is equivalent to profile.
   *
   * @returns {SieveThunderbirdProfile[]}
   *   a list containing all the known profiles.
   */
  getProfiles() {

    const directory = this.getProfileDirectory();

    const file = fs.readFileSync(
      path.join(directory, "profiles.ini"), "utf-8");

    const sections = file.split(/\[\w*]/gm);

    const profiles = [];

    for (const section of sections) {
      const profile = new SieveThunderbirdProfile(directory);
      profile.parse(section);

      profiles.push(profile);
    }

    return profiles;
  }

  /**
   * Returns the profile marked as default profile.
   * In case no default profile is configured and exception will be thrown.
   *
   * @returns {SieveThunderbirdProfile}
   *   the default profile
   */
  getDefaultProfile() {
    for (const profile of this.getProfiles()) {
      if (profile.isDefault())
        return profile;
    }

    throw new Error("No default profile found");
  }

  /**
   * A shorthand which returns the accounts for all profiles exposed to the
   * current used.
   *
   * @returns {object}
   *   a json structure containing the account and profile information.
   */
  getAccounts() {
    const result = [];

    for (const profile of this.getProfiles())
      result.push(profile.toJson());

    return result;
  }

}

export { SieveThunderbirdProfiles };
