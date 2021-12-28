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

/* global bootstrap */

import { SieveIpcClient } from "./../utils/SieveIpcClient.mjs";
import { SieveLogger } from "./../utils/SieveLogger.mjs";
import { SieveTemplate } from "./../utils/SieveTemplate.mjs";

import { SieveScriptUI } from "./SieveScriptUI.mjs";
import { SieveDebugSettingsUI } from "./../settings/ui/SieveDebugSettingsUI.mjs";
import { SieveCapabilities } from "./SieveCapabilities.mjs";

const IS_SMALLER = -1;
const IS_EQUAL = 0;
const IS_LARGER = 1;

/**
 * A UI renderer for a sieve account
 */
class SieveAbstractAccountUI {

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
   * Checks if the account is currently in the connecting phase.
   * @returns {boolean}
   *   true in case the connection handshake is performed.
   */
  async isConnecting() {
    return await this.send("account-is-connecting");
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
   */
  async connect() {

    this.onRenderConnecting();

    await this.send("account-connect");
    await this.render();
  }

  /**
   * Disconnects the account from the server.
   */
  async disconnect() {

    this.onRenderDisconnecting();
    await this.send("account-disconnect");
    await this.render();
  }

  /**
   * Renders the settings pane
   *
   */
  async renderSettings() {

    const elm = await (new SieveTemplate()).load("./accounts/account.settings.html");


    const account = await this.send("account-get-settings");


    elm.querySelector(".sieve-settings-hostname")
      .textContent = account.hostname;
    elm.querySelector(".sieve-settings-port")
      .textContent = account.port;

    if (!account.security)
      elm.querySelector(".sieve-settings-secure").style.display = 'none';

    elm.querySelector(".sieve-settings-username")
      .textContent = account.username;

    if (elm.querySelector(".sieve-settings-mechanism")) {
      elm.querySelector(".sieve-settings-mechanism")
        .textContent = account.mechanism;
    }

    if (elm.querySelector(".sieve-settings-fingerprint")) {
      elm.querySelector(".sieve-settings-fingerprint")
        .textContent = account.fingerprint;

      if (account.fingerprint !== "")
        elm.querySelector(".sieve-settings-fingerprint-item").classList.remove("d-none");
    }

    // Clear any existing left overs...
    const settings = document.querySelector(`#siv-account-${this.id} .sieve-settings-content`);
    while (settings.firstChild)
      settings.firstChild.remove();

    // ... and append the new element
    settings.append(elm);

    if (elm.querySelector(".sieve-account-edit-debug")) {
      elm.querySelector(".sieve-account-edit-debug")
        .addEventListener("click", () => { this.showAdvancedSettings(); });
    }
  }

  /**
   * Renders the accounts outer ui
   *
   */
  async renderAccount() {
    const elm = await (new SieveTemplate()).load("./accounts/account.html");

    elm.id = `siv-account-${this.id}`;

    elm.querySelector(".sieve-accounts-content").id = `sieve-accounts-content-${this.id}`;
    elm.querySelector(".sieve-accounts-tab").href = `#sieve-accounts-content-${this.id}`;

    elm.querySelector(".sieve-settings-content").id = `sieve-settings-content-${this.id}`;
    elm.querySelector(".sieve-settings-tab").href = `#sieve-settings-content-${this.id}`;
    elm
      .querySelector(".sieve-settings-tab")
      .addEventListener('shown.bs.tab', () => { this.renderSettings(); });

    elm.querySelector(".siv-account-name").textContent
      = await this.send("account-get-displayname");

    document.querySelector(".siv-accounts-items").append(elm);

    elm
      .querySelector(".siv-account-create")
      .addEventListener("click", () => { this.createScript(); });
    elm
      .querySelector(".sieve-account-edit-settings")
      .addEventListener("click", () => { this.showSettings(); });
    elm
      .querySelector(".sieve-account-capabilities")
      .addEventListener("click", () => { this.showCapabilities(); });
    elm
      .querySelector(".sieve-account-reconnect-server")
      .addEventListener("click", () => { this.connect(); });
    elm
      .querySelector(".sieve-account-disconnect-server")
      .addEventListener("click", () => { this.disconnect(); });
  }

  /**
   * Called when the account's connected view should be rendered.
   * It displays the a list with sieve scripts as well as the account settings.
   */
  async onRenderConnected() {
    const data = await this.send("account-list");

    const scripts = document.querySelector(`#siv-account-${this.id} .siv-tpl-scripts`);

    while (scripts.firstChild)
      scripts.firstChild.remove();

    if (!data.length) {
      const elm = await (new SieveTemplate()).load(`./accounts/account.empty.html`);
      scripts.append(elm);

      elm
        .querySelector(".sieve-script-empty-create")
        .addEventListener("click", () => { this.createScript(); });

      return;
    }

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

    for (const item of data) {
      this.getLogger().logWidget(`Rendering ${this.id}/${item.script}`);
      await ((new SieveScriptUI(this, item.script, item.active)).render());
    }
  }

  /**
   * Called when the account's connecting view should be rendered.
   */
  async onRenderConnecting() {
    const item = await (new SieveTemplate()).load(`./accounts/account.connecting.html`);

    const scripts = document.querySelector(`#siv-account-${this.id} .siv-tpl-scripts`);
    while (scripts.firstChild)
      scripts.firstChild.remove();

    scripts.append(item);
  }

  /**
   * Called when the account's disconnecting view should be rendered.
   */
  async onRenderDisconnecting() {
    const item = await (new SieveTemplate()).load(`./accounts/account.disconnecting.html`);

    const scripts = document.querySelector(`#siv-account-${this.id} .siv-tpl-scripts`);
    while (scripts.firstChild)
      scripts.firstChild.remove();

    scripts.append(item);
  }

  /**
   * Called when the account's disconnected view should be rendered.
   */
  async onRenderDisconnected() {

    const elm = await (new SieveTemplate()).load(`./accounts/account.disconnected.html`);

    const scripts = document.querySelector(`#siv-account-${this.id} .siv-tpl-scripts`);

    while (scripts.firstChild)
      scripts.firstChild.remove();

    scripts.append(elm);

    elm.querySelector(".sieve-script-connect")
      .addEventListener("click", () => { this.connect(); });
  }

  /**
   * Renders the UI for this component.
   */
  async render() {
    this.getLogger().logWidget(`Rendering Account ${this.id}`);

    if (!document.querySelector(`#siv-account-${this.id}`)) {
      await this.renderAccount();
      this.renderSettings();
    }

    if (await this.isConnecting()) {
      await this.onRenderConnecting();
      return;
    }

    if (await this.isConnected()) {
      await this.onRenderConnected();
      return;
    }

    await this.onRenderDisconnected("disconnected");
  }

  /**
   * Shows the settings dialog
   */
  showSettings() {
    (new bootstrap.Tab(`#siv-account-${this.id} .sieve-settings-tab`)).show();
  }

  /**
   * Show the advanced settings dialog
   */
  showAdvancedSettings() {
    (new SieveDebugSettingsUI(this)).show();
  }

  /**
   * Shows the account's capabilities
   *
   * @returns {SieveAccountUI}
   *   a self reference.
   */
  async showCapabilities() {

    if (await this.isConnected() === false)
      return this;

    const capabilities = await this.send("account-capabilities");
    await (new SieveCapabilities()).show(capabilities);

    return this;
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

export { SieveAbstractAccountUI };
