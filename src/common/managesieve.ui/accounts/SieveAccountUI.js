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
  /* global SieveLogger */
  /* global SieveTemplateLoader */
  /* global SieveScriptUI */
  /* global SieveIpcClient */
  /* global SieveServerSettingsUI */
  /* global SieveCredentialsSettingsUI */
  /* global SieveDebugSettingsUI */

  const IS_SMALLER = -1;
  const IS_EQUAL = 0;
  const IS_LARGER = 1;

  /**
   * A UI renderer for a sieve account
   */
  class SieveAccountUI {

    /**
     * Creates a new renderer for a sieve account.
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
     * Gets an instance to the logger.
     *
     * @returns {SieveLogger}
     *   an reference to the logger instance.
     **/
    getLogger() {
      return SieveLogger.getInstance();
    }

    /**
     * Executes an action on the communication process.
     *
     * @param {string} action
     *   the actions unique name
     * @param {object} [payload]
     *   the payload which should be send
     *
     * @returns {Promise<object>}
     *   the result received for this action.
     */
    async send(action, payload) {

      if (typeof (payload) === "undefined" || payload === null)
        payload = {};

      if (typeof (payload) !== "object")
        payload = { "data": payload };

      payload["account"] = this.id;

      return await SieveIpcClient.sendMessage("core", action, payload);
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

      try {
        const item2 = await (new SieveTemplateLoader()).load(`./accounts/account.connecting.tpl`);
        $(`#siv-account-${this.id} .siv-tpl-scripts`)
          .empty()
          .append(item2);

        await this.send("account-connect");
      }
      catch (ex) {
        await this.disconnect();
      }

      await this.render();
    }

    /**
     * Disconnects the account from the server.
     */
    async disconnect() {
      const item2 = await (new SieveTemplateLoader()).load(`./accounts/account.disconnecting.tpl`);
      $(`#siv-account-${this.id} .siv-tpl-scripts`)
        .empty()
        .append(item2);

      await this.send("account-disconnect");
      await this.render();
    }

    /**
     * Renders the settings pane
     *
     */
    async renderSettings() {

      const settings = $(`#siv-account-${this.id}`).find(".sieve-settings-content");

      const item = await (new SieveTemplateLoader()).load("./accounts/account.settings.tpl");

      const account = await this.send("account-get-settings");

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
      item.find(".sieve-account-edit-debug").click(() => { this.showAdvancedSettings(); });

      settings.empty().append(item);
    }

    /**
     * Renders the accounts outer ui
     *
     */
    async renderAccount() {
      const item = await (new SieveTemplateLoader()).load("./accounts/account.tpl");

      item.find(".sieve-accounts-content").attr("id", `sieve-accounts-content-${this.id}`);
      item.find(".sieve-accounts-tab").attr("href", `#sieve-accounts-content-${this.id}`);

      item.find(".sieve-settings-content").attr("id", `sieve-settings-content-${this.id}`);
      item.find(".sieve-settings-tab").attr("href", `#sieve-settings-content-${this.id}`);
      item.find(".sieve-settings-tab").on('shown.bs.tab', () => { this.renderSettings(); });

      item.find(".siv-account-name").text(await this.send("account-get-displayname"));

      item.attr("id", `siv-account-${this.id}`);
      item.find(".siv-account-create").click(() => { this.createScript(); });

      item.find(".sieve-account-edit-settings").click(() => { this.showSettings(); });
      item.find(".sieve-account-capabilities").click(() => { this.showCapabilities(); });
      item.find(".sieve-account-reconnect-server").click(() => { this.connect(); });
      item.find(".sieve-account-disconnect-server").click(() => { this.disconnect(); });

      $(".siv-accounts").append(item);
    }

    /**
     * Renders the account ui's script pane
     */
    async onRenderConnected() {
      const data = await this.send("account-list");

      $(`#siv-account-${this.id} .siv-tpl-scripts`).empty();

      // Sort the script names by their name...
      data.sort((a, b) => {
        const scriptA = a.script.toUpperCase();
        const scriptB = b.script.toUpperCase();

        if (scriptA < scriptB)
          return IS_SMALLER;

        if (scriptA > scriptB)
          return IS_LARGER;

        return IS_EQUAL;
      });

      data.forEach(async (item) => {

        this.getLogger().logWidget(`Rendering ${this.id}/${item.script}`);
        await (new SieveScriptUI(this, item.script, item.active)).render();
      });

    }

    /**
     * Called when the account should be rendered because of a disconnect.
     */
    async onRenderDisconnected() {
      const item2 = await (new SieveTemplateLoader()).load(`./accounts/account.disconnected.tpl`);
      $(`#siv-account-${this.id} .siv-tpl-scripts`)
        .empty()
        .append(item2);

      item2.find(".sieve-script-connect").click(() => { this.connect(); });
    }

    /**
     * Renders the UI for this component.
     */
    async render() {
      this.getLogger().logWidget(`Rendering Account ${this.id}`);

      // Check if the element exists...
      if ($(`#siv-account-${this.id}`).length === 0) {
        await this.renderAccount();
        this.renderSettings();
      }

      const status = await this.isConnected();

      if (status === false) {
        await this.onRenderDisconnected("disconnected");
        return;
      }

      this.onRenderConnected();
    }

    /**
     * Asks the user if he is sure to delete the account.
     * If yes it triggers expunging the account settings.
     * This can not be undone.
     */
    async remove() {
      await this.accounts.remove(this);
    }

    /**
     * Shows the settings dialog
     *
     */
    showSettings() {
      $(`#siv-account-${this.id} .sieve-settings-tab`).tab('show');
    }

    /**
     * Shows the server settings dialog.
     * @returns {Promise<boolean>}
     *   false in case the dialog was dismissed, otherwise true.
     */
    async showServerSettings() {

      const rv = await (new SieveServerSettingsUI(this)).show();

      // render settings in case they got changed.
      if (rv === true)
        this.renderSettings();

      return rv;
    }

    /**
     * Shows the credential settings dialog.
     * @returns {Promise<boolean>}
     *   false in case the dialog was dismissed otherwise true.
     **/
    async showCredentialSettings() {

      const rv = await (new SieveCredentialsSettingsUI(this)).show();

      if ( rv === true )
        this.renderSettings();

      return rv;
    }

    /**
     * Show the advanced settings dialog
     */
    showAdvancedSettings() {
      (new SieveDebugSettingsUI(this)).show();
      this.renderSettings();
    }



    /**
     * Shows the account's capabilities
     */
    async showCapabilities() {

      if (await this.isConnected() === false)
        return;

      $("#sieve-capabilities-server").empty();
      $("#sieve-capabilities-version").empty();
      $("#sieve-capabilities-sasl").empty();
      $("#sieve-capabilities-extensions").empty();
      $("#sieve-capabilities-language").empty();

      $('#sieve-dialog-capabilities').modal('show');

      // TODO show wait indicator...
      (async () => {
        const capabilities = await this.send("account-capabilities");

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
     */
    async createScript() {

      if (await this.isConnected() === false)
        return;

      const name = await this.send("script-create");

      if (name !== "")
        await this.render();
    }

  }

  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveAccountUI;
  else
    exports.SieveAccountUI = SieveAccountUI;

})(this);
