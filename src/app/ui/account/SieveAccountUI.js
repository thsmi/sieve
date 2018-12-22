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

  /* global $ */
  /* global SieveTemplateLoader */
  /* global SieveScriptUI */
  /* global SieveIpcClient */
  /* global SieveServerSettingsUI */
  /* global SieveCredentialsSettingsUI */
  /* global SieveAdvancedSettingsUI */

  /**
   * A UI renderer for a sieve account
   */
  class SieveAccountUI {

    /**
     * Creates a new rendere for a sieve account.
     *
     * @param {SieveAccountsUI} accounts
     *   the parent sieve accounts renderer
     * @param {string} id
     *   the account unique id.
     */
    constructor(accounts, id) {
      this.accounts = accounts;
      this.id = id;
    }

    /**
     * Executes an action on the communication process.
     *
     * @param {string} action
     *   the aktions unique name
     * @param {Object} [payload]
     *   th payload which should be send
     * @returns {Promise<Object>}
     *   the result received for this action.
     */
    async send(action, payload) {

      if (typeof (payload) === "undefined" || payload === null)
        payload = {};

      if (typeof (payload) !== "object")
        payload = { "data": payload };

      payload["account"] = this.id;

      return await SieveIpcClient.sendMessage(action, payload);
    }

    /**
     * Checks if the current account has an active connection to the server
     *
     * @returns {boolean} true in case tha account is connected otherwise false
     */
    async isConnected() {
      return await this.send("account-connected");
    }

    /**
     * Establishes a connection to the server
     *
     *
     */
    async connect() {
      await this.send("account-connect");
      await this.render();
    }

    /**
     * Disconnects the account from the server.
     *
     *
     */
    async disconnect() {
      await this.send("account-disconnect");
      await this.render();
    }

    /**
     * Renders the settings pane
     *
     */
    async renderSettings() {

      let settings = $("#siv-account-" + this.id).find(".sieve-settings-content");

      let item = await (new SieveTemplateLoader()).load("./ui/account/account.settings.tpl");

      let account = await this.send("account-get-settings");

      item.find(".sieve-settings-hostname").text(account.hostname);
      item.find(".sieve-settings-port").text(account.port);

      if (!account.secure)
        item.find(".sieve-settings-secure").hide();

      item.find(".sieve-settings-username").text(account.username);
      item.find(".sieve-settings-mechanism").text(account.mechanism);
      item.find(".sieve-settings-fingerprint").text(account.fingerprint);

      if (account.fingerprint === "")
        item.find(".sieve-settings-fingerprint-item").hide();

      item.find(".sieve-account-delete-server").click(() => { this.remove(); });
      item.find(".sieve-account-edit-server").click(() => { this.showServerSettings(); });
      item.find(".sieve-account-edit-credentials").click(() => { this.showCredentialSettings(); });
      item.find(".sieve-account-edit-advanced").click(() => { this.showAdvancedSettings(); });

      settings.empty().append(item);
    }

    /**
     * Renders the accounts outer ui
     *
     */
    async renderAccount() {
      let item = await (new SieveTemplateLoader()).load("./ui/account/account.tpl");

      item.find(".sieve-accounts-content").attr("id", "sieve-accounts-content-" + this.id);
      item.find(".sieve-accounts-tab").attr("href", "#sieve-accounts-content-" + this.id);

      item.find(".sieve-settings-content").attr("id", "sieve-settings-content-" + this.id);
      item.find(".sieve-settings-tab").attr("href", "#sieve-settings-content-" + this.id);
      item.find(".sieve-settings-tab").on('shown.bs.tab', () => { this.renderSettings(); });

      item.find(".siv-account-name").text(await this.send("account-get-displayname"));

      item.attr("id", "siv-account-" + this.id);
      item.find(".siv-account-create").click(() => { this.createScript(); });

      item.find(".sieve-account-edit-settings").click(() => { this.showSettings(); });
      item.find(".sieve-account-capabilities").click(() => { this.showCapabilities(); });
      item.find(".sieve-account-reconnect-server").click(() => { this.connect(); });
      item.find(".sieve-account-disconnect-server").click(() => { this.disconnect(); });
      $(".siv-accounts").append(item);
    }

    /**
     * Renders the account ui's script pane
     *
     */
    async renderScripts() {
      let data = await this.send("account-list");

      console.log("Data received " + JSON.stringify(data));

      $("#siv-account-" + this.id + " .siv-tpl-scripts").empty();

      // Sort the script names by their name...
      data.sort((a, b) => {
        let scriptA = a.script.toUpperCase();
        let scriptB = b.script.toUpperCase();

        if (scriptA < scriptB)
          return -1;

        if (scriptA > scriptB)
          return 1;

        return 0;
      });

      data.forEach(async (item) => {

        console.log("Rendering " + this.id + "/" + item.script + " ");
        await (new SieveScriptUI(this, item.script, item.active)).render();
      });

    }

    /**
    * Renders the UI for this component.
    *
    */
    async render() {
      console.log("Rendering Account " + this.id);

      // Check if the element exists...
      if ($("#siv-account-" + this.id).length === 0) {
        await this.renderAccount();
        this.renderSettings();
      }

      let status = await this.isConnected();

      if (status === false) {
        let item2 = await (new SieveTemplateLoader()).load("./ui/account/account.disconnected.tpl");
        $("#siv-account-" + this.id + " .siv-tpl-scripts")
          .empty()
          .append(item2);

        item2.find(".sieve-script-connect").click(() => { this.connect(); });

        return;

        // await this.send("account-connect");

        // in case of an error switc hto not connected
        // return;
        // otherwise continue;
      }

      this.renderScripts();
    }

    /**
     * Asks the user if he is sure to delete the account.
     * If yes it triggers expurging the account settings.
     * This can not be undone.
     *
     *
     */
    async remove() {
      await this.accounts.remove(this);
    }

    /**
     * Shows the settings dialog
     *
     */
    showSettings() {
      $("#siv-account-" + this.id + " .sieve-settings-tab").tab('show');
    }

    /**
     * Shows the server settings dialog.
     * @returns {Promise<Boolean>}
     *   false in case the dialog was dismissed, otherwise true.
     */
    async showServerSettings() {

      let rv = await (new SieveServerSettingsUI(this)).show();

      // rerender settings in case they got changed.
      if (rv === true)
        this.renderSettings();

      return rv;
    }

    /**
     * Shows the credential settings dialog.
     * @returns {Promise<Boolean>}
     *   false in case the dialog was dismissed otherwise true.
     **/
    async showCredentialSettings() {

      let rv = await (new SieveCredentialsSettingsUI(this)).show();

      if ( rv === true )
        this.renderSettings();

      return rv;
    }

    showAdvancedSettings() {
      (new SieveAdvancedSettingsUI(this)).show();
      this.renderSettings();
    }



    /**
     * Shows the account's capabilities
     *
     *
     */
    showCapabilities() {
      $("#sieve-capabilities-server").empty();
      $("#sieve-capabilities-version").empty();
      $("#sieve-capabilities-sasl").empty();
      $("#sieve-capabilities-extensions").empty();
      $("#sieve-capabilities-language").empty();

      $('#sieve-dialog-capabilities').modal('show');

      // TODO show wait indicator...
      (async () => {
        let capabilities = await this.send("account-capabilities");

        $("#sieve-capabilities-server").text(capabilities.implementation);
        $("#sieve-capabilities-version").text(capabilities.version);
        $("#sieve-capabilities-sasl").text(
          Object.values(capabilities.sasl).join(" "));
        $("#sieve-capabilities-extensions").text(
          Object.keys(capabilities.extensions).join(" "));
        $("#sieve-capabilities-language").text(capabilities.language);
      })();
    }

    /**
     * Prompts for the new script name an creates the script
     *
     *
     */
    async createScript() {
      let name = await this.send("script-create");

      if (name !== "")
        await this.render();
    }
  }

  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveAccountUI;
  else
    exports.SieveAccountUI = SieveAccountUI;

})(this);
