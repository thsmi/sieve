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

(async function() {

  "use strict";

  /* global browser */
  /* global SieveIpcClient */
  /* global SieveAccounts */

  const ERROR_UNTRUSTED = 1;
  const ERROR_MISMATCH = 2;
  const ERROR_TIME = 4;

  async function getTabs(account, name) {
    const url = new URL("./libs/managesieve.ui/editor.html", window.location);

    url.searchParams.append("account", account);
    url.searchParams.append("script", name);

    return await browser.tabs.query({ url: url.toString() });
  }

  async function showTab(tab) {

    await browser.tabs.update(
      tab.id,
      { active : true }
    );

    await browser.windows.update(
      tab.windowId,
      { focused : true }
    );

  }

  await browser.sieve.menu.onCommand.addListener(
    async () => {
      const url = new URL("./libs/managesieve.ui/accounts.html", window.location);

      const tabs = await browser.tabs.query({ url: url.toString() });

      if (tabs.length) {
        await showTab(tabs[0]);
        return;
      }

      await browser.tabs.create({
        active: true,
        url : "./libs/managesieve.ui/accounts.html"
      });
    });
  await browser.sieve.menu.load();



  let accounts = [];

  const actions = {
    // account endpoints...
    "accounts-list": async function () {
      console.log("List Accounts");

      accounts = (await (new SieveAccounts().load()));

      return accounts.getAccounts();
    },

    "account-get-displayname": async function (msg) {
      return await accounts.getAccountById(msg.payload.account).getHost().getDisplayName();
    },

    "account-connected": function (msg) {
      console.log("Is Connected");

      // FixMe should be the id from the message
      const id = msg.payload.account;

      return browser.sieve.session.isConnected(id);
    },

    "account-connect" : async function(msg) {

      // FixMe should be the id from the message
      const id = msg.payload.account;

      const account = accounts.getAccountById(id);

      const options = {
        "secure" : await account.getSecurity().isSecure(),
        "sasl" : await account.getSecurity().getMechanism(),
        "keepAlive" :  60 * 1000
        // Todo
        // keepAlive : account.getSettings().getKeepAliveInterval(),
        // logLevel : account.getSettings().getDebugFlags()
      };

      const onAuthenticate = async (hasPassword) => {

        const authentication = {};
        authentication.username = await account.getAuthentication().getUsername();

        if (hasPassword)
          authentication.password = await account.getAuthentication().getPassword();

        return authentication;
      };

      const onAuthorize = async() => {
        console.log("onAuthorize");
        return await account.getAuthorization().getAuthorization();
      };

      const onCertError = async (secInfo) => {
        console.log(`Certificate Error for ${secInfo.host}:${secInfo.port}`);

        const rv = await SieveIpcClient.sendMessage(
          "accounts", "script-show-certerror", secInfo);

        if (!rv)
          return;

        let overrideBits = 0;
        if (secInfo.isNotValidAtThisTime)
          overrideBits |= ERROR_TIME;

        if (secInfo.isUntrusted)
          overrideBits |= ERROR_UNTRUSTED;

        if (secInfo.isDomainMismatch)
          overrideBits |= ERROR_MISMATCH;

        await browser.sieve.session.addCertErrorOverride(
          secInfo.host, secInfo.port, secInfo.rawDER, overrideBits);
      };

      await browser.sieve.session.create(id, options);
      await browser.sieve.session.onAuthenticate.addListener(
        async (hasPassword) => { return await onAuthenticate(hasPassword); }, id);
      await browser.sieve.session.onAuthorize.addListener(
        async () => { return await onAuthorize(); }, id);

      await browser.sieve.session.onCertError.addListener(
        async (secInfo) => { return await onCertError(secInfo); }, id);

      const hostname = await account.getHost().getHostname();
      const port = await account.getHost().getPort();

      await browser.sieve.session.connect(id, hostname, "" + port);
    },

    "account-disconnect": async function (msg) {
      await browser.sieve.session.destroy(msg.payload.account);
    },

    "account-list": async function (msg) {
      console.log("List Scripts for account: " + msg.payload.account);
      return await browser.sieve.session.listScripts(msg.payload.account);
    },

    "account-capabilities": async function (msg) {
      console.log("Get Capabilities");
      return await browser.sieve.session.capabilities(msg.payload.account);
    },

    // Script endpoint...
    "script-create": async function (msg) {
      const account = msg.payload.account;

      console.log("Create Scripts for account: " + account);

      const name = await SieveIpcClient.sendMessage("accounts", "script-show-create", account);

      if (name.trim() !== "")
        await browser.sieve.session.putScript(account, name, "#test\r\n");

      return name;
    },

    "script-rename": async function (msg) {
      const account = msg.payload.account;
      const oldName = msg.payload.data;

      console.log(`Rename Scripts ${oldName} for account: ${account}`);

      if (await getTabs(account, oldName).length > 0) {
        await SieveIpcClient.sendMessage("accounts", "script-show-busy", oldName);
        return false;
      }

      const newName = await SieveIpcClient.sendMessage("accounts", "script-show-rename", oldName);

      if (newName === oldName)
        return false;

      await browser.sieve.session.renameScript(account, oldName, newName);
      return true;
    },

    "script-delete": async function (msg) {
      const account = msg.payload.account;
      const name = msg.payload.data;

      console.log(`Delete Scripts ${name} for account: ${account}`);

      if (await getTabs(account, name).length > 0) {
        await SieveIpcClient.sendMessage("accounts", "script-show-busy", name);
        return false;
      }

      const rv = await SieveIpcClient.sendMessage("accounts", "script-show-delete", name);

      if (rv === true)
        await browser.sieve.session.deleteScript(account, name);

      return rv;
    },

    "script-activate": async function (msg) {
      console.log("Activate..." + msg);

      await browser.sieve.session.activateScript(msg.payload.account, msg.payload.data);
    },

    "script-deactivate": async function (msg) {
      console.log("Deactivate...");

      await browser.sieve.session.activateScript(msg.payload.account);
    },

    "script-edit": async function (msg) {

      const name = msg.payload.data;
      const account = msg.payload.account;

      const url = new URL("./libs/managesieve.ui/editor.html", window.location);

      url.searchParams.append("account", account);
      url.searchParams.append("script", name);

      const tabs = await getTabs(account, name);
      if (tabs.length > 0) {
        await showTab(tabs[0]);
        return;
      }

      // create a new tab...
      console.log("Edit Script " + name);
      await browser.tabs.create({
        active: true,
        url : url.toString()
      });
    },

    "script-get": async function (msg) {
      console.log("Get Script...");
      return await browser.sieve.session.getScript(msg.payload.account, msg.payload.data);
    },

    "script-check": async function (msg) {
      console.log("Check Script " + msg.payload.account + "... ");

      return await browser.sieve.session.checkScript(msg.payload.account, msg.payload.data);
    },

    "script-changed": function (msg) {
      console.log("Script changed...");
      // TODO update tab title.
      // (new SieveTabUI()).setChanged(msg.payload.account, msg.payload.name, msg.payload.changed);
    },

    "script-save": async function (msg) {
      console.log("Save Script...");

      await await browser.sieve.session.putScript(msg.payload.account, msg.payload.name, msg.payload.script);
    },

    "account-get-settings": async function (msg) {
      // for the settings menu

      const account = accounts.getAccountById(msg.payload.account);
      const host = await account.getHost();

      return {
        displayName: await host.getDisplayName(),
        hostname: await host.getHostname(),
        port: await host.getPort(),

        secure: await account.getSecurity().isSecure(),

        mechanism: await account.getSecurity().getMechanism(),
        username: await account.getAuthentication().getUsername()
      };
    }
  };

  for (const [key, value] of Object.entries(actions)) {
    SieveIpcClient.setRequestHandler("core", key, value);
  }

})(this);
