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

  /* global browser */
  /* global SieveIpcClient */
  /* global SieveAccounts */
  /* global SieveLogger */

  const ERROR_UNTRUSTED = 1;
  const ERROR_MISMATCH = 2;
  const ERROR_TIME = 4;

  const logger = SieveLogger.getInstance();

  const accounts = await (new SieveAccounts().load());

  // TODO Extract into separate class..
  async function getTabs(account, name) {
    const url = new URL("./libs/managesieve.ui/editor.html", window.location);

    url.searchParams.append("account", account);
    url.searchParams.append("script", name);

    return await browser.tabs.query({ url: url.toString() });
  }

  async function showTab(tab) {

    await browser.tabs.update(
      tab.id,
      { active: true }
    );

    await browser.windows.update(
      tab.windowId,
      { focused: true }
    );
  }

  browser.tabs.onRemoved.addListener(async () => {

    const url = new URL("./libs/managesieve.ui/*", window.location);
    const tabs = await browser.tabs.query({ url: url.toString() });

    if (tabs.length)
      return;

    for (const id of accounts.getAccountIds())
      browser.sieve.session.destroy(id);
  });

  // ------------------------------------------------------------------------ //

  /**
   * Populates thunderbird's menus.
   *
   * @param {window} window
   *   the window to which the menu items should be added.
   */
  function populateMenus(window) {

    // We can skip in case it is not a normal window.
    if (`${window.type}` !== "normal")
      return;

    const id = `${window.id}`;

    // populate the main menu
    browser.sieve.menu.add(id, {
      "id": "mnuSieveListDialog",
      "type": "menu-label",
      "reference": "filtersCmd",
      "position": "before",
      "label": "Sieve Message Filters",
      "accesskey": "S"
    });

    browser.sieve.menu.add(id, {
      "id": "mnuSieveSeparator",
      "type": "menu-separator",
      "reference": "filtersCmd",
      "position": "before"
    });

    // We need some magic here. They moved the filers menu item
    // in Thunderbird 68
    let ref;

    if (browser.sieve.menu.has(id, "appmenu_filtersCmd"))
      ref = "appmenu_filtersCmd";
    else if (browser.sieve.menu.has(id, "appmenu_FilterMenu"))
      ref = "appmenu_FilterMenu";
    else
      throw new Error("No app menu found");

    browser.sieve.menu.add(id, {
      "id": "appMenuSieveListDialog",
      "type": "appmenu-label",
      "reference": ref,
      "label": "Sieve Message Filters",
      "accesskey": "S",
      "position": "before"
    });

    browser.sieve.menu.add(id, {
      "id": "appMenuSieveSeparator",
      "type": "appmenu-separator",
      "reference": ref,
      "position": "before"
    });
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
        url: "./libs/managesieve.ui/accounts.html"
      });
    });


  for (const window of await browser.windows.getAll()) {
    populateMenus(window);
  }

  browser.windows.onCreated.addListener((window) => {
    populateMenus(window);
  });


  // ------------------------------------------------------------------------ //

  const actions = {
    // account endpoints...
    "accounts-list": async function () {
      logger.logAction("List Accounts");
      return await accounts.getAccountIds();
    },

    "account-get-displayname": async function (msg) {
      const host = await accounts.getAccountById(msg.payload.account).getHost();
      return await host.getDisplayName();
    },

    "account-connected": function (msg) {
      logger.logAction(`Is connected ${msg.payload.account}`);

      const id = msg.payload.account;
      return browser.sieve.session.isConnected(id);
    },

    "account-connect": async function (msg) {

      const id = msg.payload.account;
      const account = await accounts.getAccountById(id);

      logger.logAction(`Connect ${id}`);

      const host = await account.getHost();
      const security = await account.getSecurity();
      const settings = await account.getSettings();

      const options = {
        "secure": await security.isSecure(),
        "sasl": await security.getMechanism(),
        "keepAlive": await host.getKeepAlive(),
        "logLevel": await settings.getLogLevel()
      };

      const onAuthenticate = async (hasPassword) => {

        logger.logAction(`OnAuthenticate`);

        const authentication = await account.getAuthentication();

        const credentials = {};
        credentials.username = await authentication.getUsername();

        if (hasPassword)
          credentials.password = await authentication.getPassword();

        return credentials;
      };

      const onAuthorize = async () => {

        logger.logAction(`onAuthorize`);

        const authorization = await account.getAuthorization();
        return await authorization.getAuthorization();
      };

      const onCertError = async (secInfo) => {
        logger.logAction(`Certificate Error for ${secInfo.host}:${secInfo.port}`);

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

      const hostname = await host.getHostname();
      const port = await host.getPort();

      await browser.sieve.session.connect(id, hostname, `${port}`);
    },

    "account-disconnect": async function (msg) {
      logger.logAction(`Disconnect ${msg.payload.account}`);
      await browser.sieve.session.destroy(msg.payload.account);
    },

    "account-list": async function (msg) {
      logger.logAction(`List scripts for ${msg.payload.account}`);
      return await browser.sieve.session.listScripts(msg.payload.account);
    },

    "account-capabilities": async function (msg) {
      logger.logAction(`Get capabilities for ${msg.payload.account}`);
      return await browser.sieve.session.capabilities(msg.payload.account);
    },

    // Script endpoint...
    "script-create": async function (msg) {
      const account = msg.payload.account;

      logger.logAction(`Create script for ${account}`);

      const name = await SieveIpcClient.sendMessage("accounts", "script-show-create", account);

      if (name.trim() !== "")
        await browser.sieve.session.putScript(account, name, "#test\r\n");

      return name;
    },

    "script-rename": async function (msg) {
      const account = msg.payload.account;
      const oldName = msg.payload.data;

      logger.logAction(`Rename Script ${oldName} for account: ${account}`);

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

      logger.logAction(`Delete Script ${name} for account: ${account}`);

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
      const account = msg.payload.account;
      const name = msg.payload.data;

      logger.logAction(`Activate ${name} for ${account}`);

      await browser.sieve.session.activateScript(account, name);
    },

    "script-deactivate": async function (msg) {
      const account = msg.payload.account;

      logger.logAction(`Deactivate script for ${account}`);

      await browser.sieve.session.activateScript(account);
    },

    "script-edit": async function (msg) {

      const name = msg.payload.data;
      const account = msg.payload.account;

      logger.logAction(`Edit ${name} on ${account}`);

      const url = new URL("./libs/managesieve.ui/editor.html", window.location);

      url.searchParams.append("account", account);
      url.searchParams.append("script", name);

      const tabs = await getTabs(account, name);
      if (tabs.length > 0) {
        await showTab(tabs[0]);
        return;
      }

      // create a new tab...
      await browser.tabs.create({
        active: true,
        url: url.toString()
      });
    },

    "script-get": async function (msg) {
      const name = msg.payload.data;
      const account = msg.payload.account;

      logger.logAction(`Get ${name} for ${account}`);

      return await browser.sieve.session.getScript(account, name);
    },

    "script-check": async function (msg) {
      const account = msg.payload.account;
      const script = msg.payload.data;

      logger.logAction(`Check Script for ${account}`);

      return await browser.sieve.session.checkScript(account, script);
    },

    "script-save": async function (msg) {
      const account = msg.payload.account;
      const name = msg.payload.name;
      const script = msg.payload.script;

      logger.logAction(`Save ${name} for ${account}`);

      await browser.sieve.session.putScript(account, name, script);
    },

    "account-get-settings": async function (msg) {

      logger.logAction(`Get settings for ${msg.payload.account}`);

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

    "settings-get-loglevel": async function (msg) {
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

})(this);
