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

  class SieveNodeEditorController {

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
     * Sets the current clipboard conent.
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
     *   the current clipboard conent
     */
    async getClipboard() {
      return await this.send("paste");
    }

    async onChanged(changed) {
      await this.send("script-changed", { "name": this.name, "changed": changed });
    }

    async importScript() {
      return await this.send("script-import");
    }

    async exportScript(script) {
      await this.send("script-export", { "name": this.name, "script": script });
    }

    /**
     * Opens the sieve reference in the web browser.
     */
    async openReference() {
      await this.send("reference-open");
    }

    async getCapabilities() {
      return await this.send("account-capabilities");
    }

    /**
     * An internal short cut to sets a preference value.
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
     * An internal shortcut to gets a preference value.
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
     * Executes an action on the communication process.
     *
     * @param {string} action
     *   the aktions unique name
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

      return await SieveIpcClient.sendMessage(action, payload);
    }
  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveEditorController = SieveNodeEditorController;
  else
    exports.SieveEditorController = SieveNodeEditorController;

})(this);
