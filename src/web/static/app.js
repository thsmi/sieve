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

import { SieveSessions } from "./libs/libManageSieve/SieveSessions.js";
import { SieveLogger } from "./libs/managesieve.ui/utils/SieveLogger.js";
import { SieveI18n } from "./libs/managesieve.ui/utils/SieveI18n.js";
import { SieveIpcClient } from "./libs/managesieve.ui/utils/SieveIpcClient.js";

import { SieveAccounts } from "./libs/managesieve.ui/settings/logic/SieveAccounts.js";
import { SieveTabUI } from "./libs/managesieve.ui/tabs/SieveTabsUI.js";

(async function () {

  const DEFAULT_AUTHENTICATION = 0;
  const DEFAULT_AUTHORIZATION = 3;

  const FIRST_ELEMENT = 0;



  const logger = SieveLogger.getInstance();

  // TODO remove me this file should not have any dependency to i18n
  await (SieveI18n.getInstance())
    .load("default", "./libs/managesieve.ui/i18n/");

  const accounts = await (new SieveAccounts().load());
  const sessions = new SieveSessions();

  const actions = {

    // "update-check"
    // "update-goto-url"
    // "import-thunderbird"
    // "account-probe"
    // "account-create"
    // "account-delete"

    // account endpoints...
    "accounts-list": function () {
      logger.logAction("List Accounts");
      // Always return only one
      return accounts.getAccountIds();
    },

    "account-get-displayname": async function (msg) {
      const account = msg.payload.account;
      logger.logAction(`Get display name for ${account}`);

      const host = await accounts.getAccountById(account).getHost();
      return await host.getDisplayName();
    },

    "account-get-settings": async function (msg) {

      logger.logAction(`Get settings for ${msg.payload.account}`);

      // for the settings menu
      const account = accounts.getAccountById(msg.payload.account);
      const host = await account.getHost();
      const authentication = await account.getAuthentication();
      const security = await account.getSecurity();

      return {
        displayName: await host.getDisplayName(),
        hostname: await host.getHostname(),
        port: await host.getPort(),

        secure: await security.isSecure(),
        mechanism: await security.getMechanism(),

        username: await authentication.getUsername()
      };
    },

    "settings-get-loglevel": async function() {
      return await accounts.getLogLevel();
    },

    "account-settings-set-debug": async function (msg) {

      logger.logAction(`Set Debug Level for ${msg.payload.account}`);

      const account = accounts.getAccountById(msg.payload.account);

      await account.getSettings().setLogLevel(msg.payload.levels.account);
      await accounts.setLogLevel(msg.payload.levels.global);
    },

    "account-settings-get-debug": async function (msg) {

      logger.logAction(`Get Debug Level for ${msg.payload.account}`);

      const account = accounts.getAccountById(msg.payload.account);

      return {
        "account" : await account.getSettings().getLogLevel(),
        "global" : await accounts.getLogLevel()
      };
    },

    "account-capabilities": async function (msg) {

      logger.logAction(`Get capabilities for ${msg.payload.account}`);

      return await (sessions.get(msg.payload.account).capabilities());
    },

    "account-connecting": async (request) => {

      logger.logAction(`Connecting ${request.payload.account}`);

      const account = request.payload.account;

      try {
        const host = await accounts.getAccountById(account).getHost();

        await (sessions.get(account).connect(await host.getHostname(), await host.getPort()));

      } catch (e) {
        // connecting failed for some reason, which means we
        // need to handle the error.
        console.error(e);

        await SieveIpcClient.sendMessage(
          "accounts", "account-show-error", e.message);

        throw e;
      }

    },

    "account-connect": async (msg) => {

      logger.logAction(`Connect ${msg.payload.account}`);

      const accountId = msg.payload.account;

      const account = await accounts.getAccountById(accountId);
      await sessions.create(accountId, account);

      await actions["account-connecting"](msg);
    },


    "account-connected": function (msg) {
      logger.logAction(`Is connected ${msg.payload.account}`);

      if (!sessions.has(msg.payload.account))
        return false;

      return sessions.get(msg.payload.account).isConnected();
    },


    "account-disconnect": async function (msg) {
      logger.logAction(`Disconnect ${msg.payload.account}`);

      await sessions.destroy(msg.payload.account);
    },

    "account-list": async function (msg) {
      logger.logAction(`List scripts for ${msg.payload.account}`);

      return await sessions.get(msg.payload.account).listScripts();
    },

    // Script endpoint...
    "script-create": async function (msg) {
      const account = msg.payload.account;

      logger.logAction(`Create script for ${account}`);

      const name = await SieveIpcClient.sendMessage("accounts", "script-show-create", account);

      if (name.trim() !== "")
        await sessions.get(account).putScript(name, "#test\r\n");

      return name;
    },

    "script-rename": async function (msg) {
      const account = msg.payload.account;
      const oldName = msg.payload.data;

      logger.logAction(`Rename Script ${oldName} for account: ${account}`);

      if ((new SieveTabUI()).has(account, oldName)) {
        await SieveIpcClient.sendMessage("accounts", "script-show-busy", oldName);
        return false;
      }

      const newName = await SieveIpcClient.sendMessage("accounts", "script-show-rename", oldName);

      if (newName === oldName)
        return false;

      await sessions.get(account).renameScript(oldName, newName);
      return true;
    },

    "script-delete": async function (msg) {
      const account = msg.payload.account;
      const name = msg.payload.data;

      logger.logAction(`Delete Script ${name} for account: ${account}`);

      if ((new SieveTabUI()).has(account, name)) {
        await SieveIpcClient.sendMessage("accounts", "script-show-busy", name);
        return false;
      }

      const rv = await SieveIpcClient.sendMessage("accounts", "script-show-delete", name, window.frames);

      if (rv === true)
        await sessions.get(account).deleteScript(name);

      return rv;
    },

    "script-activate": async function (msg) {
      const account = msg.payload.account;
      const name = msg.payload.data;

      logger.logAction(`Activate ${name} for ${account}`);

      await sessions.get(account).activateScript(name);
    },

    "script-deactivate": async function (msg) {
      const account = msg.payload.account;

      logger.logAction(`Deactivate script for ${account}`);

      await sessions.get(account).activateScript();
    },

    "script-edit": async function (msg) {

      const name = msg.payload.data;
      const account = msg.payload.account;

      logger.logAction(`Edit ${name} on ${account}`);

      await (new SieveTabUI()).open(account, name);
    },

    "script-get": async function (msg) {

      const name = msg.payload.data;
      const account = msg.payload.account;

      logger.logAction(`Get ${name} for ${account}`);

      return await sessions.get(account).getScript(name);
    },

    "script-check": async function (msg) {
      const account = msg.payload.account;
      const script = msg.payload.data;

      logger.logAction(`Check Script for ${account}`);

      try {
        return await sessions.get(account).checkScript(script);
      }
      catch (ex) {
        // TODO throw an exception in case is it not an instance of a server side exception...
        return ex.getResponse().getMessage();
      }
    },

    "script-save": async function (msg) {
      const account = msg.payload.account;
      const name = msg.payload.name;
      const script = msg.payload.script;

      logger.logAction(`Save ${name} for ${account}`);

      await sessions.get(account).putScript(name, script);
    },

    "copy": function (msg) {
      require("electron").clipboard.writeText(msg.payload.data);
    },

    "paste": function () {
      return require("electron").clipboard.readText();
    },

    "get-preference": async (msg) => {

      const name = msg.payload.data;
      const account = msg.payload.account;

      logger.logAction(`Set value ${name} on ${account}`);

      const value = await accounts.getAccountById(account).getEditor().getValue(name);

      if (value === null)
        return await actions["get-default-preference"](msg);

      return value;
    },

    "get-default-preference": async(msg) => {
      const name = msg.payload.data;

      logger.logAction(`Get default value for ${name}`);

      return await accounts.getEditor().getValue(name);
    },

    "set-preference": async (msg) => {
      const name = msg.payload.key;
      const value = msg.payload.value;
      const account = msg.payload.account;

      logger.logAction(`Set value ${name} on ${account}`);

      await accounts.getAccountById(account).getEditor().setValue(name, value);
    },

    "set-default-preference": async(msg) => {
      const name = msg.payload.key;
      const value = msg.payload.value;

      logger.logAction(`Set default value for ${name}`);

      await accounts.getEditor().setValue(name, value);
    }
  };

  for (const [key, value] of Object.entries(actions)) {
    SieveIpcClient.setRequestHandler("core", key, value);
  }


  /**
   * The main entry point
   * Called as soon as the DOM is ready.
   */
  function main() {
    (new SieveTabUI()).init();
  }

  if (document.readyState !== 'loading')
    main();
  else
    document.addEventListener('DOMContentLoaded', () => { main(); }, { once: true });

})();
