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

const DEFAULT_AUTHORIZATION = 3;

const FIRST_ELEMENT = 0;

const { ipcRenderer } = require('electron');

// Import the node modules into our global namespace...
import { SieveLogger } from "./libs/managesieve.ui/utils/SieveLogger.js";
import { SieveIpcClient } from "./libs/managesieve.ui/utils/SieveIpcClient.js";

import {
  SieveCertValidationException
} from "./libs/libManageSieve/SieveExceptions.mjs";

import { SieveSessions } from "./libs/libManageSieve/SieveSessions.mjs";

import { SieveAccounts } from "./libs/managesieve.ui/settings/logic/SieveAccounts.js";

import { SieveUpdater } from "./libs/managesieve.ui/updater/SieveUpdater.js";
import { SieveTabUI } from "./libs/managesieve.ui/tabs/SieveTabsUI.js";

import { SieveThunderbirdImport } from "./libs/managesieve.ui/importer/SieveThunderbirdImport.js";
import { SieveAutoConfig } from "./libs/libManageSieve/SieveAutoConfig.mjs";

import { SieveI18n } from "./libs/managesieve.ui/utils/SieveI18n.js";

(async function () {

  const logger = SieveLogger.getInstance();

  // TODO remove me this file should not have any dependency to i18n
  await (SieveI18n.getInstance())
    .load("default", "./libs/managesieve.ui/i18n/");

  const accounts = await (new SieveAccounts().load());
  const sessions = new SieveSessions();

  const actions = {

    "update-check": async () => {
      return await (new SieveUpdater()).check();
    },

    "update-goto-url": () => {
      require("electron").shell.openExternal('https://github.com/thsmi/sieve/releases/latest');
    },

    "import-thunderbird": function () {
      logger.logAction("Import Thunderbird accounts");
      return (new SieveThunderbirdImport()).getAccounts();
    },

    // account endpoints...
    "accounts-list": function () {
      logger.logAction("List Accounts");
      return accounts.getAccountIds();
    },

    "account-probe": async function (request) {
      logger.logAction("probe Account");

      const response = request;
      response.payload["port"] = await (new SieveAutoConfig(request.payload["hostname"])).detect();

      return response.payload;
    },

    "account-create": async function (msg) {
      logger.logAction("create Account");
      await accounts.create(msg.payload);

      return msg.payload;
    },

    "account-delete": async function (msg) {

      const account = msg.payload.account;
      logger.logAction(`Remove Account ${account}`);

      const host = await accounts.getAccountById(account).getHost();

      const rv = await SieveIpcClient.sendMessage(
        "accounts", "account-show-delete", await host.getDisplayName());

      if (rv)
        await accounts.remove(account);

      return rv;
    },

    "account-get-displayname": async function (msg) {
      const account = msg.payload.account;
      logger.logAction(`Get display name for ${account}`);

      const host = await accounts.getAccountById(account).getHost();
      return await host.getDisplayName();
    },

    "account-get-server": async function (msg) {

      logger.logAction(`Get server for ${msg.payload.account}`);

      const host = await accounts.getAccountById(msg.payload.account).getHost();

      return {
        displayName: await host.getDisplayName(),
        hostname: await host.getHostname(),
        port: await host.getPort(),
        fingerprint: await host.getFingerprint(),
        keepAlive: await host.getKeepAlive()
      };
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
        fingerprint: await host.getFingerprint(),

        secure: await security.isSecure(),

        mechanism: await security.getMechanism(),
        username: await authentication.getUsername()
      };
    },

    "settings-get-loglevel": async function () {
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
        "account": await account.getSettings().getLogLevel(),
        "global": await accounts.getLogLevel()
      };
    },

    "account-setting-get-credentials": async function (msg) {

      logger.logAction(`Get credentials for ${msg.payload.account}`);

      const account = accounts.getAccountById(msg.payload.account);

      return {
        "general": {
          secure: await account.getSecurity().isSecure(),
          sasl: await account.getSecurity().getMechanism()
        },
        "authentication": {
          username: await (await account.getAuthentication()).getUsername(),
          stored: await (await account.getAuthentication()).hasStoredPassword()
        },

        "authorization": {
          type: await (await account.getAuthorization()).getType(),
          username: await (await account.getAuthorization(DEFAULT_AUTHORIZATION)).getAuthorization()
        }
      };
    },

    "account-settings-forget-credentials": async function (msg) {
      logger.logAction(`Forget credentials for ${msg.payload.account}`);

      const account = await accounts.getAccountById(msg.payload.account);
      await (await account.getAuthentication()).forget();
    },

    "account-settings-set-credentials": async function (msg) {

      logger.logAction(`Set credentials for ${msg.payload.account}`);

      const account = await accounts.getAccountById(msg.payload.account);

      await account.getSecurity().setSecure(msg.payload.general.secure);
      await account.getSecurity().setMechanism(msg.payload.general.sasl);

      await account.getAuthentication().setUsername(msg.payload.authentication.username);

      await account.setAuthorization(msg.payload.authorization.mechanism);
      await (await account.getAuthorization(DEFAULT_AUTHORIZATION)).setAuthorization(msg.payload.authorization.username);
    },

    "account-set-server": async function (msg) {

      logger.logAction(`Get display server for ${msg.payload.account}`);

      const host = await accounts.getAccountById(msg.payload.account).getHost();

      await host.setDisplayName(msg.payload.displayName);
      await host.setHostname(msg.payload.hostname);
      await host.setPort(msg.payload.port);

      await host.setFingerprint(msg.payload.fingerprint);

      await host.setKeepAlive(msg.payload.keepAlive);
    },

    "account-import": async function () {
      logger.logAction("Import account settings");

      const options = {
        title: "Import Sieve Settings",
        openFile: true,
        openDirectory: false,
        filters: [
          { name: 'Sieve Account Configuration', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }]
      };

      const filename = await ipcRenderer.invoke("open-dialog", options);

      if (filename.canceled)
        return;

      const fs = require('fs');

      if (!fs.existsSync(filename.filePaths[FIRST_ELEMENT]))
        return;

      const data = await fs.promises.readFile(filename.filePaths[FIRST_ELEMENT], "utf-8");

      await accounts.import(data);
    },

    "account-export": async function (msg) {
      logger.logAction("Export account settings");

      const host = await accounts.getAccountById(msg.payload.account).getHost();
      const name = await host.getDisplayName();

      const data = await accounts.export(msg.payload.account);


      const options = {
        title: "Export Account Settings",
        defaultPath: `${name}`,
        filters: [
          { name: 'Sieve Account Configuration', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }]
      };

      const filename = await ipcRenderer.invoke("save-dialog", options);

      // Check if the dialog was canceled...
      if (filename.canceled)
        return;

      await require('fs').promises.writeFile(filename.filePath, data, "utf-8");
    },

    "account-capabilities": async function (msg) {

      logger.logAction(`Get capabilities for ${msg.payload.account}`);

      return await (sessions.get(msg.payload.account).capabilities());
    },

    "account-connecting": async (request) => {

      logger.logAction(`Connecting ${request.payload.account}`);

      const account = request.payload.account;
      const response = request;

      try {
        const host = await accounts.getAccountById(account).getHost();

        await (sessions.get(account).connect(await host.getHostname(), await host.getPort()));

      } catch (e) {

        if (e instanceof SieveCertValidationException) {
          const secInfo = e.getSecurityInfo();

          const rv = await SieveIpcClient.sendMessage(
            "accounts", "account-show-certerror", secInfo);

          // save the fingerprint.
          if (rv !== true)
            return;

          const host = await accounts.getAccountById(account).getHost();

          // Prefer SHA256 if available
          if ((typeof (secInfo.fingerprint256) !== "undefined") && (secInfo.fingerprint256 !== null))
            await host.setFingerprint(secInfo.fingerprint256);
          else
            await host.setFingerprint(secInfo.fingerprint);
          await host.setIgnoreCertErrors(secInfo.code);

          await actions["account-disconnect"](response);
          await actions["account-connect"](response);
          return;
        }

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

    "script-import": async function () {
      logger.logAction("Import Script");

      const options = {
        title: "Import Script",
        openFile: true,
        openDirectory: false,
        filters: [
          { name: 'Sieve Scripts', extensions: ['siv', "sieve"] },
          { name: 'All Files', extensions: ['*'] }]
      };

      const filename = await ipcRenderer.invoke("open-dialog", options);

      if (filename.canceled)
        return undefined;

      const fs = require('fs');

      if (!fs.existsSync(filename.filePaths[FIRST_ELEMENT]))
        return undefined;

      return await fs.promises.readFile(filename.filePaths[FIRST_ELEMENT], "utf-8");
    },

    "script-export": async function (request) {
      logger.logAction("Export Script");

      const script = request.payload.script;

      const options = {
        title: "Export Script",
        defaultPath: request.payload.name,
        filters: [
          { name: 'Sieve Scripts', extensions: ['siv', "sieve"] },
          { name: 'All Files', extensions: ['*'] }]
      };

      const filename = await ipcRenderer.invoke("save-dialog", options);

      // Check if the dialog was canceled...
      if (filename.canceled)
        return;

      await require('fs').promises.writeFile(filename.filePath, script, "utf-8");
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

    "get-default-preference": async (msg) => {
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

    "set-default-preference": async (msg) => {
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
