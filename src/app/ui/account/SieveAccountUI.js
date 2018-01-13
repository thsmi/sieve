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
  /* global SieveSettingsUI */

  /**
   * A UI renderer for a sieve account
   */
  class SieveAccountUI {

    /**
     * Creates a new rendere for a sieve account.
     *
     * @param {SieveAccountsUI} accounts
     *   the parent sieve accounts renderer
     * @param {String} id
     *   the account unique id.
     */
    constructor(accounts, id) {
      this.accounts = accounts;
      this.id = id;
    }

    /**
     * Executes an action on the communication process.
     *
     * @param {String} action
     *   the aktions unique name
     * @param {Object} [payload]
     *   th payload which should be send
     * @returns {Promise<Object>}
     *   the result received for this action.
     */
    async send(action, payload) {

      if (typeof(payload) === "undefined" || payload === null)
        payload = {};

      if (typeof (payload) !== "object")
        payload = {"data": payload};

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
     * @return {void}
     */
    async connect() {
      await this.send("account-connect");
      await this.render();
    }

    /**
     * Disconnects the account from the server.
     *
     * @return {void}
     */
    async disconnect() {
      await this.send("account-disconnect");
      await this.render();
    }

    /**
    * Renders the UI for this component.
    * @returns {void}
    */
    async render() {
      console.log("Rendering Account " + this.id);

      let item = $("#siv-account-" + this.id);
      // Check if the element exists...
      if (item.length === 0) {
        item = await (new SieveTemplateLoader()).load("./ui/account/account.tpl");

        item.find(".siv-account-name").text(await this.send("account-get-displayname"));

        item.attr("id", "siv-account-" + this.id);
        item.find(".siv-account-create").click(() => { this.createScript(); });

        item.find(".sieve-account-edit-server").click(() => { this.showSettings(); });
        item.find(".sieve-account-delete-server").click(() => { this.remove(); });
        item.find(".sieve-account-capabilities").click(() => { this.showCapabilities(); });
        item.find(".sieve-account-reconnect-server").click(() => { this.connect(); });
        item.find(".sieve-account-disconnect-server").click(() => { this.disconnect(); });
        $(".siv-accounts").append(item);
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
     * Asks the user if he is sure to delete the account.
     * If yes it triggers expurging the account settings.
     * This can not be undone.
     *
     * @returns {void}
     */
    async remove() {
      await this.accounts.remove(this);
    }

    /**
     * Shows the settings dialog
     * @returns {void}
     */
    showSettings() {
      (new SieveSettingsUI(this)).show();
    }


    /**
     * Shows the account's capabilities
     *
     * @returns {void}
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
     * @returns {void}
     */
    createScript() {
      $("#sieve-create-dialog").modal('show');

      $('#sieve-create-dialog-btn').off().one("click", async () => {
        let name = $('#sieve-create-dialog-name').val();

        await this.send("script-create", name);

        await this.render();
        $('#sieve-create-dialog').modal('hide');
      });
    }
  }

  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveAccountUI;
  else
    exports.SieveAccountUI = SieveAccountUI;

})(this);
