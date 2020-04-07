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

  /* global SieveIpcClient */

  /**
   * An editor controller is the logical endpoint for all editor
   * specific actions. It is triggered from the graphical editor
   * as well as the text editor and interacts with the outside world
   * like the sieve server or the operating system.
   */
  class SieveEditorController {

    /**
     * Creates a new instance
     *
     * @param {string} name
     *   the sieve scripts name
     * @param {string} account
     *   the account id
     */
    constructor(name, account) {
      this.name = name;
      this.account = account;
    }

    /**
     * Loads the script into the editor.
     *
     * @returns {string}
     *   the script to be loaded.
     */
    async loadScript() {
      return await this.send("script-get", this.name);
    }

    /**
     * Saves the current script.
     *
     * @param {string} script
     *   the script's content.
     */
    async saveScript(script) {
      await this.send("script-save", { "name": this.name, "script": script });
    }

    /**
     * Checks if the given script is free of syntax errors.
     * @param {string} script
     *   the script to be checked
     * @returns {undefined|string}
     *   either undefined in case the script is ok or an error string otherwise.
     */
    async checkScript(script) {
      return await this.send("script-check", script);
    }

    /**
     * Sets the current clipboard content.
     *
     * @param {string} data
     *  the data to copy to the clipboard.
     */
    async setClipboard(data) {
      await this.send("copy", data);
    }

    /**
     * Gets the current clipboard content.
     *
     * @returns {string}
     *   the current clipboard content
     */
    async getClipboard() {
      return await this.send("paste");
    }

    /**
     * Imports the given script from a file.
     *
     * @returns {string}
     *   the imported sieve script.
     */
    async importScript() {
      return await this.send("script-import");
    }

    /**
     * Exports the given script into a file.
     * @param {string} script
     *   the sieve content to be exported
     */
    async exportScript(script) {
      await this.send("script-export", { "name": this.name, "script": script });
    }

    /**
     * Reruns the server side capabilities for the given account
     * @returns {object}
     *   the server's capabilities.
     */
    async getCapabilities() {
      return await this.send("account-capabilities");
    }

    /**
     * Sets a preference value.
     *
     * @param {string} name
     *   the preferences unique name.
     * @param {object} value
     *   the value which should be set.
     */
    async setPreference(name, value) {
      await this.send("set-preference", { "key": name, "value": value });
    }

    /**
     * Sets a default value for a preference.
     *
     * @param {string} name
     *   the preferences unique name.
     * @param {object} value
     *   the value which should be set as default.
     */
    async setDefaultPreference(name, value) {
      await this.send("set-default-preference", { "key": name, "value": value });
    }

    /**
     * Gets a preference value.
     *
     * @param {string} name
     *   the preferences unique name
     * @returns {object}
     *   the requested value.
     */
    async getPreference(name) {
      return await this.send("get-preference", name);
    }

    /**
     * Gets the default value for a preference.
     *
     * @param {string} name
     *   the preferences unique name
     * @returns {object}
     *   the preference's default value.
     */
    async getDefaultPreference(name) {
      return await this.send("get-default-preference", name);
    }

    /**
     * Executes an action on the communication process.
     *
     * @param {string} action
     *   the actions unique name
     * @param {object} [payload]
     *   th payload which should be send
     * @returns {Promise<object>}
     *   the result received for this action.
     */
    async send(action, payload) {

      if (typeof (payload) === "undefined" || payload === null)
        payload = {};

      if (typeof (payload) !== "object")
        payload = { "data": payload };

      payload["account"] = this.account;

      return await SieveIpcClient.sendMessage("core", action, payload);
    }
  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveEditorController = SieveEditorController;
  else
    exports.SieveEditorController = SieveEditorController;

})(this);
