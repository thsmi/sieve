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

(function () {

  "use strict";

  const DEFAULT_TAB_POLICY = true;
  const DEFAULT_TAB_WIDTH = 2;
  const DEFAULT_INDENTATION_POLICY = false;
  const DEFAULT_INDENTATION_WIDTH = 2;

  const FIRST_ELEMENT = 0;

  // Import the node modules into our global namespace...
  const { SieveIpcClient} = require("./libs/managesieve.ui/utils/SieveIpcClient.js");

  const {
    SieveCertValidationException
  } = require("./libs/libManageSieve/SieveExceptions.js");

  const { SieveSessions } = require("./libs/libManageSieve/SieveSessions.js");
  const { SieveAccounts } = require("./libs/libManageSieve/settings/SieveAccounts.js");

  const { SievePrefManager } = require('./libs/libManageSieve/settings/SievePrefManager.js');

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
  } = require("./ui/dialogs/SieveDialogUI.js");

  const { SieveThunderbirdImport } = require("./libs/managesieve.ui/importer/SieveThunderbirdImport.js");
  const { SieveAutoConfig } = require("./libs/libManageSieve/SieveAutoConfig.js");

  const accounts = new SieveAccounts().load();
  const sessions = new SieveSessions();

  const actions = {

    "update-check": async () => {
      return await (new SieveUpdater()).check();
    },

    "update-goto-url": () => {
      require("electron").shell.openExternal('https://github.com/thsmi/sieve/releases/latest');
    },

    "import-thunderbird": function () {
      console.log("Import Thunderbird accounts");
      return (new SieveThunderbirdImport()).getAccounts();
    },

    // account endpoints...
    "accounts-list": function () {
      console.log("List Accounts");
      return accounts.getAccounts();
    },

    "account-probe": async function (request) {
      console.log("probe Account");

      const response = request;
      response.payload["port"] = await (new SieveAutoConfig(request.payload["hostname"])).detect();

      return response.payload;
    },

    "account-create": function (msg) {
      console.log("create Account");
      accounts.create(msg.payload);

      return msg.payload;
    },

    "account-delete": async function (msg) {

      console.log("Remove Account");

      const account = msg.payload.account;
      const displayName = accounts.getAccountById(account).getHost().getDisplayName();

      const rv = await (new SieveDeleteAccountDialog(displayName)).show();

      if (rv)
        accounts.remove(account);

      return rv;
    },

    "account-get-displayname": function (msg) {
      return accounts.getAccountById(msg.payload.account).getHost().getDisplayName();
    },

    "account-get-server": function (msg) {
      const account = accounts.getAccountById(msg.payload.account);
      const host = account.getHost();

      return {
        displayName: host.getDisplayName(),
        hostname: host.getHostname(),
        port: host.getPort(),
        fingerprint: host.getFingerprint()
      };
    },

    "account-get-settings": function (msg) {
      // for the settings menu
      const account = accounts.getAccountById(msg.payload.account);
      const host = account.getHost();

      return {
        displayName: host.getDisplayName(),
        hostname: host.getHostname(),
        port: host.getPort(),
        fingerprint: host.getFingerprint(),

        secure: account.getSecurity().isSecure(),

        mechanism: account.getSecurity().getMechanism(),
        username: account.getAuthentication().getUsername()
      };
    },

    "account-setting-get-credentials": function (msg) {
      const account = accounts.getAccountById(msg.payload.account);

      return {
        "general": {
          secure: account.getSecurity().isSecure(),
          sasl: account.getSecurity().getMechanism()
        },
        "authentication": {
          type: account.getAuthentication().getType(),
          username: account.getAuthentication(0).getUsername()
        },

        "authorization": {
          type: account.getAuthorization().getType(),
          username: account.getAuthorization(3).getAuthorization()
        }
      };
    },

    "account-settings-set-credentials": function (msg) {

      const account = accounts.getAccountById(msg.payload.account);

      account.getSecurity().setSecure(msg.payload.general.secure);
      account.getSecurity().setMechanism(msg.payload.general.sasl);

      account.setAuthentication(msg.payload.authentication.mechanism);
      account.getAuthentication(0).setUsername(msg.payload.authentication.username);

      account.setAuthorization(msg.payload.authorization.mechanism);
      account.getAuthorization(3).setAuthorization(msg.payload.authorization.username);
    },

    "account-get-general": function (msg) {
      const account = accounts.getAccountById(msg.payload.account);

      return {
        keepAliveEnabled: account.getSettings().isKeepAlive(),
        keepAliveInterval: account.getSettings().getKeepAliveInterval()
      };
    },

    "account-set-server": function (msg) {
      const account = accounts.getAccountById(msg.payload.account);

      account.getHost().setDisplayName(msg.payload.displayName);
      account.getHost().setHostname(msg.payload.hostname);
      account.getHost().setPort(msg.payload.port);
      account.getHost().setFingerprint(msg.payload.fingerprint);
    },


    "account-set-general": function (msg) {
      const account = accounts.getAccountById(msg.payload.account);

      account.getSettings().setKeepAlive(msg.payload.keepAliveEnabled);
      account.getSettings().setKeepAliveInterval(msg.payload.keepAliveInterval);
    },

    "account-capabilities": async function (msg) {
      console.log("Get Capabilities");
      return await (sessions.get(msg.payload.account).capabilities());
    },

    "account-cert-error": async (msg) => {
      const rv = await (new SieveFingerprintDialog(msg.payload.fingerprint, msg.payload.message)).show();

      // save the fingerprint.
      if (rv !== true)
        return;

      accounts.getAccountById(msg.payload.account).getHost().setFingerprint(msg.payload.fingerprint);
      accounts.getAccountById(msg.payload.account).getHost().setIgnoreCertErrors(msg.payload.code);

      await actions["account-connecting"](msg);
    },

    "account-connecting": async (request) => {

      const response = request;
      try {
        await (sessions.get(request.payload.account).connect());
      } catch (e) {

        if ( e instanceof SieveCertValidationException) {
          response.payload.fingerprint = e.cert.fingerprint;
          response.payload.code = e.error.code;
          response.payload.message = e.error.message;
          await actions["account-cert-error"](response);
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

      console.log("Connect");

      const accountId = msg.payload.account;

      const account = accounts.getAccountById(accountId);
      await sessions.create(accountId, account);

      await actions["account-connecting"](msg);
    },


    "account-connected": function (msg) {
      console.log("Is Connected");

      if (!sessions.has(msg.payload.account))
        return false;

      return sessions.get(msg.payload.account).isConnected();
    },


    "account-disconnect": async function (msg) {
      await sessions.destroy(msg.payload.account);
    },

    "account-list": async function (msg) {
      console.log("List Scripts for account: " + msg.payload.account);

      return await sessions.get(msg.payload.account).listScripts();
    },

    // Script endpoint...
    "script-create": async function (msg) {
      console.log("Create Scripts for account: " + msg.payload.account);

      const name = await (new SieveCreateScriptDialog()).show();

      if (name.trim() !== "")
        await sessions.get(msg.payload.account).putScript(name, "#test\r\n");

      return name;
    },

    "script-rename": async function (msg) {
      const account = msg.payload.account;
      const oldName = msg.payload.data;

      console.log(`Rename Scripts ${oldName} for account: ${account}`);

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

      console.log(`Delete Scripts ${name} for account: ${account}`);

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
      console.log("Activate..." + msg);

      await sessions.get(msg.payload.account).setActiveScript(msg.payload.data);
    },

    "script-deactivate": async function (msg) {
      console.log("Deactivate...");

      await sessions.get(msg.payload.account).setActiveScript();
    },

    "script-edit": async function (msg) {

      const name = msg.payload.data;
      const account = msg.payload.account;

      // create a new tab...
      console.log("Edit Script " + name);
      await (new SieveTabUI()).open(account, name);
    },

    "script-get": async function (msg) {
      console.log("Get Script...");
      return await sessions.get(msg.payload.account).getScript(msg.payload.data);
    },

    "script-check": async function (msg) {
      console.log("Check Script " + msg.payload.account + "... ");

      try {
        return await sessions[msg.payload.account].checkScript(msg.payload.data);
      }
      catch (ex) {

        // Rethrow in case it is no serverside exception...
        if (!ex.isServerSide || !ex.isServerSide())
          throw ex;

        return ex.getResponse().getMessage();
      }
    },

    "script-save": async function (msg) {
      console.log("Save Script...");

      await sessions.get(msg.payload.account).putScript(msg.payload.name, msg.payload.script);
    },

    "script-import": async function () {
      console.log("Import Script...");

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
      console.log("Export Script...");

      const options = {
        title: "Export Script",
        filters: [
          { name: 'Sieve Scripts', extensions: ['siv', "sieve"] },
          { name: 'All Files', extensions: ['*'] }]
      };

      const filename = await require("electron").remote.dialog.showSaveDialog(options);

      // Check if the dialog was chanceled...
      if (filename.canceled)
        return;

      await require('fs').promises.writeFile(filename.filePath, request.payload.script, "utf-8");
    },

    "script-changed": function (msg) {
      console.log("Script changed...");
      (new SieveTabUI()).setChanged(msg.payload.account, msg.payload.name, msg.payload.changed);
    },

    "reference-open": function () {
      require("electron").shell.openExternal('https://thsmi.github.io/sieve-reference/en/index.html');
    },

    "copy": function (msg) {
      require("electron").clipboard.writeText(msg.payload.data);
    },

    "paste": function () {
      return require("electron").clipboard.readText();
    },

    "get-preference": (msg) => {

      const pref = new SievePrefManager("editor");

      if (msg.payload.data === "tabulator-policy")
        return pref.getBoolean("tabulator-policy", DEFAULT_TAB_POLICY);

      if (msg.payload.data === "tabulator-width")
        return pref.getInteger("tabulator-width", DEFAULT_TAB_WIDTH);

      if (msg.payload.data === "indentation-policy")
        return pref.getBoolean("indentation-policy", DEFAULT_INDENTATION_POLICY);

      if (msg.payload.data === "indentation-width")
        return pref.getInteger("indentation-width", DEFAULT_INDENTATION_WIDTH);

      if (msg.payload.data === "syntax-check")
        return pref.getBoolean("syntax-check", true);

      throw new Error("Unknown settings");
    },

    "set-preference": (msg) => {
      const pref = new SievePrefManager("editor");
      pref.setValue(msg.payload.key, msg.payload.value);
    }

  };


  for (const [key, value] of Object.entries(actions)) {
    SieveIpcClient.setRequestHandler(key, value);
  }


  /**
   * The main entry point
   * Called as soon as the DOM is ready.
   */
  function main() {

    document
      .getElementById("donate")
      .addEventListener("click", () => {
        require("electron").shell.openExternal("https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=EAS576XCWHKTC");
      });

    (new SieveTabUI()).init();
  }

  if (document.readyState !== 'loading')
    main();
  else
    document.addEventListener('DOMContentLoaded', () => { main(); }, { once: true });

})();
