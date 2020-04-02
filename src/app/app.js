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

(async function () {

  "use strict";

  const DEFAULT_TAB_POLICY = true;
  const DEFAULT_TAB_WIDTH = 2;
  const DEFAULT_INDENTATION_POLICY = false;
  const DEFAULT_INDENTATION_WIDTH = 2;

  const DEFAULT_AUTHENTICATION = 0;
  const DEFAULT_AUTHORIZATION = 3;

  const FIRST_ELEMENT = 0;

  // Import the node modules into our global namespace...
  const { SieveLogger } = require("./libs/managesieve.ui/utils/SieveLogger.js");
  const { SieveIpcClient} = require("./libs/managesieve.ui/utils/SieveIpcClient.js");

  const {
    SieveCertValidationException
  } = require("./libs/libManageSieve/SieveExceptions.js");

  const { SieveSessions } = require("./libs/libManageSieve/SieveSessions.js");

  const { SieveAccounts } = require("./libs/managesieve.ui/settings/SieveAccounts.js");
  const { SievePrefManager } = require('./libs/managesieve.ui/settings/SievePrefManager.js');

  const { SieveUpdater } = require("./libs/managesieve.ui/updater/SieveUpdater.js");
  const { SieveTabUI } = require("./libs/managesieve.ui/tabs/SieveTabsUI.js");

  const {
    SieveRenameScriptDialog,
    SieveCreateScriptDialog,
    SieveDeleteScriptDialog,
    SieveFingerprintDialog,
    SieveDeleteAccountDialog,
    SieveScriptBusyDialog,
    SieveErrorDialog
  } = require("./libs/managesieve.ui/dialogs/SieveDialogUI.js");

  const { SieveThunderbirdImport } = require("./libs/managesieve.ui/importer/SieveThunderbirdImport.js");
  const { SieveAutoConfig } = require("./libs/libManageSieve/SieveAutoConfig.js");

  const logger = SieveLogger.getInstance();

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
      return accounts.getAccounts();
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

      const rv = await (new SieveDeleteAccountDialog(await host.getDisplayName())).show();

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

    "account-setting-get-credentials": async function (msg) {

      logger.logAction(`Get credentials for ${msg.payload.account}`);

      const account = accounts.getAccountById(msg.payload.account);

      return {
        "general": {
          secure: await account.getSecurity().isSecure(),
          sasl: await account.getSecurity().getMechanism()
        },
        "authentication": {
          type: await (await account.getAuthentication()).getType(),
          username: await (await account.getAuthentication(DEFAULT_AUTHENTICATION)).getUsername()
        },

        "authorization": {
          type: await (await account.getAuthorization()).getType(),
          username: await (await account.getAuthorization(DEFAULT_AUTHORIZATION)).getAuthorization()
        }
      };
    },

    "account-settings-set-credentials": async function (msg) {

      logger.logAction(`Set credentials for ${msg.payload.account}`);

      const account = await accounts.getAccountById(msg.payload.account);

      await account.getSecurity().setSecure(msg.payload.general.secure);
      await account.getSecurity().setMechanism(msg.payload.general.sasl);

      await account.setAuthentication(msg.payload.authentication.mechanism);
      await (await account.getAuthentication(DEFAULT_AUTHENTICATION)).setUsername(msg.payload.authentication.username);

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

          const rv = await (new SieveFingerprintDialog(secInfo)).show();

          // save the fingerprint.
          if (rv !== true)
            return;

          const host = await accounts.getAccountById(account).getHost();

          await host.setFingerprint(secInfo.fingerprint);
          await host.setIgnoreCertErrors(secInfo.code);

          await actions["account-connecting"](response);
          return;
        }

        // connecting failed for some reason, which means we
        // need to handle the error.
        console.error(e);
        await (new SieveErrorDialog(e.message)).show();
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

      const name = await (new SieveCreateScriptDialog()).show();

      if (name.trim() !== "")
        await sessions.get(account).putScript(name, "#test\r\n");

      return name;
    },

    "script-rename": async function (msg) {
      const account = msg.payload.account;
      const oldName = msg.payload.data;

      logger.logAction(`Rename Script ${oldName} for account: ${account}`);

      if ((new SieveTabUI()).has(account, oldName)) {
        await (new SieveScriptBusyDialog(oldName)).show();
        return false;
      }

      const newName = await (new SieveRenameScriptDialog(oldName)).show();

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
        await (new SieveScriptBusyDialog(name)).show();
        return false;
      }

      const rv = await (new SieveDeleteScriptDialog(name)).show();

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

      const filename = await require("electron").remote.dialog.showOpenDialog(options);

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
        filters: [
          { name: 'Sieve Scripts', extensions: ['siv', "sieve"] },
          { name: 'All Files', extensions: ['*'] }]
      };

      const filename = await require("electron").remote.dialog.showSaveDialog(options);

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

      logger.logAction(`Get preference for ${name}`);

      const pref = new SievePrefManager("editor");

      if (name === "tabulator-policy")
        return await pref.getBoolean("tabulator-policy", DEFAULT_TAB_POLICY);

      if (name === "tabulator-width")
        return await pref.getInteger("tabulator-width", DEFAULT_TAB_WIDTH);

      if (name === "indentation-policy")
        return await pref.getBoolean("indentation-policy", DEFAULT_INDENTATION_POLICY);

      if (name === "indentation-width")
        return await pref.getInteger("indentation-width", DEFAULT_INDENTATION_WIDTH);

      if (name === "syntax-check")
        return await pref.getBoolean("syntax-check", true);

      throw new Error(`Unknown settings ${name}`);
    },

    "set-preference": async (msg) => {
      const name = msg.payload.key;
      const value = msg.payload.value;

      logger.logAction(`Set preference for ${name}`);

      await (new SievePrefManager("editor"))
        .setValue(name, value);
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
