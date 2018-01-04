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

(function (exports) {

  "use strict";

  const PREF_KEY_ACCOUNTS = '^.*user_pref\\(.*"mail.accountmanager.accounts".*,.*"(.*)"\\);.*$';
  const PREF_KEY_SERVER = '^.*user_pref\\(.*"mail.account.%account%.server".*,.*"(.*)"\\);.*$';
  const PREF_KEY_SERVER_TYPE = '^.*user_pref\\(.*"mail.server.%server%.type".*,.*"(.*)"\\);.*$';
  const PREF_KEY_SERVER_USERNAME = '^.*user_pref\\(.*"mail.server.%server%.userName".*,.*"(.*)"\\);.*$';
  const PREF_KEY_SERVER_HOSTNAME = '^.*user_pref\\(.*"mail.server.%server%.hostname".*,.*"(.*)"\\);.*$';

  /**
   * Imports Account settings from thunderbird's profile directory.
   */
  class SieveThunderbirdImport {

    /**
     * Initializes the template loader
     */
    constructor() {
    }

    /**
     * Parses a section from thunderbird's profile.ini
     * @param {String} section
     *   the section which should be parsed.
     * @returns {Struct}
     *   an object containing the path as well as the information
     *   if the profile is default and the path is relative.
     */
    parseProfileSection(section) {
      let lines = section.split(/\r?\n/g);

      let path = "";
      let isRelative = false;
      let isDefault = false;

      for (let line of lines) {
        line = line.trim();

        if (line === "Default=1")
          isDefault = true;

        if (line.startsWith("Path="))
          path = line.split("=")[1];

        if (line.startsWith("isRelative=")) {
          isRelative = line.split("=")[1];

          isRelative = (isRelative === 1) ? true : false;
        }
      }

      return {
        "path": path,
        "isRelative": isRelative,
        "isDefault": isDefault
      };
    }

    /**
     * Parses thunderbird's profile.ini and retruns the path to the profile.
     * @param {String} [directory]
     *   the directory to thunderbirds app data  directory.
     *   if omited the directory will be guessed.
     * @returns {String}
     *   the path to the default user Profile.
     */
    getDefaultUserProfile(directory) {
      const path = require('path');
      const fs = require('fs');

      if (typeof (directory) === "undefined" || directory === null)
        directory = this.getProfileDirectory();

      let file = fs.readFileSync(
        path.join(directory, "profiles.ini"), "utf-8");

      let sections = file.split(/\\[[a-zA-Z0-9]*\\]/g);

      for (let section of sections) {

        section = this.parseProfileSection(section);

        if (!section.isDefault)
          continue;

        if (section.isRelative)
          return path.join(directory, "Thunderbird", section.path);

        return section.path;
      }

      throw new Error("Failed to parse profile.ini");

    }

    /**
     * Tries to get thunderbird's profile directory.
     *
     * @returns {String}
     *   the profile directory
     */
    getProfileDirectory() {
      const path = require('path');
      const fs = require('fs');

      let directory;

      if (process.platform === "linux")
        directory = "~/.thunderbird";
      else if (process.platform === "win32")
        directory = path.join(process.env.APPDATA, "Thunderbird");
      else
        throw new Error("Unsupported Platform");

      if (!fs.existsSync(directory))
        throw new Error("No file path");

      return directory;
    }

    /**
     * Tries to read thunderbird's preference file.
     *
     * @returns {String}
     *   the current user's preference.js
     */
    getProfile() {
      const path = require('path');
      const fs = require('fs');

      let profile = this.getProfileDirectory();

      this.getDefaultUserProfile(profile);

      return fs.readFileSync(
        path.join(this.getDefaultUserProfile(profile), "prefs.js"), "utf-8");
    }

    /**
     * Reads the accounts from thunderbirds preferences file.
     *
     * @returns {Object}
     *   username and the host for each imap account.
     */
    getAccounts() {

      let results = [];
      let profile = this.getProfile();

      let accounts = (new RegExp(PREF_KEY_ACCOUNTS, "gm")).exec(profile)[1].split(",");

      for (let account of accounts) {

        let server = (new RegExp(PREF_KEY_SERVER.replace("%account%", account), "gm")).exec(profile)[1];
        let type = (new RegExp(PREF_KEY_SERVER_TYPE.replace("%server%", server), "gm")).exec(profile)[1];

        if (type !== "imap")
          continue;

        let result = {};
        result["username"] = (new RegExp(PREF_KEY_SERVER_USERNAME.replace("%server%", server), "gm")).exec(profile)[1];
        result["hostname"] = (new RegExp(PREF_KEY_SERVER_HOSTNAME.replace("%server%", server), "gm")).exec(profile)[1];

        results.push(result);
      }

      return results;
    }

  }


  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveThunderbirdImport = SieveThunderbirdImport;
  else
    exports.SieveThunderbirdImport = SieveThunderbirdImport;

})(this);
