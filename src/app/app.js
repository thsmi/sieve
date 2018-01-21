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

"use strict";

// Import the node modules into our global namespace...

const { SieveSession } = require("./libs/libManageSieve/SieveNodeSession.js");
const { SieveAccounts } = require("./SieveAccounts.js");

const { SieveTemplateLoader } = require("./utils/SieveTemplateLoader.js");

/**
 * Displays a simple dialog with an action button.
 */
class SieveDialog {

  /**
   * Loads and shows the dialog
   * @param {string} template
   *   the dialog template to load
   * @param {object<string,string>} token
   *   key value pairs with replacement values
   * @returns {boolean}
   *   true in case the dialog was accepted, fals in case it was canceled
   */
  async show(template, onInit, onResolve, onReject) {
    let dialog = await (new SieveTemplateLoader()).load(template);

    onInit(dialog);

    $("#ctx").append(dialog);

    return await new Promise((resolve, reject) => {

      dialog.modal('show')
        .on('hidden.bs.modal', () => {
          dialog.remove();
          reject(onReject(dialog));
        })
        .find(".sieve-dialog-resolve").click(() => {
          resolve(onResolve(dialog));
          // ... now trigger the hidden listener it will cleanup
          // it is afe to do so due to promise magics, the first
          // alway resolve wins and all subsequent calls are ignored...
          dialog.modal("hide");
        });
    });
  }
}


let callback = async function (account) {

  let username = account.getLogin().getUsername();
  let displayName = account.getHost().getDisplayName();

  return await (new SieveDialog()).show("./ui/app/dialog.account.password.tpl",
    (dialog) => {
      dialog.find(".sieve-username").text(username);
      dialog.find(".sieve-displayname").text(displayName);

      dialog.find('.sieve-password').keypress((e) => {
        console.log("onenter");
        if (e.which === 13) {
          dialog.find(".sieve-dialog-resolve").trigger('click');
        }
      });
    },
    (dialog) => {
      return dialog.find(".sieve-password").val();
    },
    () => {
      return new Error("Dialog canceled");
    }
  );
};

let accounts = new SieveAccounts(callback).load();


let sessions = {};


let actions = {

  "import-thunderbird" : function() {
    console.log("Import Thunderbird accounts");

    const {SieveThunderbirdImport} = require("./utils/SieveThunderbirdImport.js");
    return (new SieveThunderbirdImport()).getAccounts();
  },

  // account endpoints...
  "accounts-list": function () {
    console.log("List Accounts");
    return accounts.getAccounts();
  },

  "account-probe" : async function(msg) {
    console.log("probe Account");

    const { SieveAutoConfig } = require("./libs/libManageSieve/SieveAutoConfig.js");
    msg.payload["port"] = await (new SieveAutoConfig(msg.payload["hostname"])).detect();

    return msg.payload;
  },

  "account-create": function (msg) {
    console.log("create Account");
    return accounts.create(msg.payload);
  },

  "account-delete": async function (msg) {

    console.log("Remove Account");

    let account = msg.payload.account;
    let displayName = accounts.getAccountById(account).getHost().getDisplayName();

    let rv = await new SieveDialog().show(
      "./ui/app/dialog.account.delete.tpl",
      (dialog) => { dialog.find("#sieve-dialog-account-remove-name").text(displayName); },
      () => { return true; },
      () => { return false; }
    );

    if (rv)
      accounts.remove(account);

    return rv;
  },

  "account-get-displayname": function (msg) {
    return accounts.getAccountById(msg.payload.account).getHost().getDisplayName();
  },

  "account-get-server": function (msg) {
    let account = accounts.getAccountById(msg.payload.account);

    return {
      displayName: account.getHost().getDisplayName(),
      hostname: account.getHost().getHostname(),
      secure: account.getHost().isSecure(),
      port: account.getHost().getPort(),
      fingerprint : account.getHost().getFingerprint()
    };
  },

  "account-get-authentication": function (msg) {
    let account = accounts.getAccountById(msg.payload.account);

    return {
      mechanism: account.getLogin().getSaslMechanism(),
      username: account.getLogin().getUsername()
    };
  },

  "account-get-general": function (msg) {
    let account = accounts.getAccountById(msg.payload.account);

    return {
      keepAliveEnabled: account.getSettings().isKeepAlive(),
      keepAliveInterval: account.getSettings().getKeepAliveInterval()
    };
  },

  "account-set-server": function (msg) {
    let account = accounts.getAccountById(msg.payload.account);

    account.getHost().setDisplayName(msg.payload.displayName);
    account.getHost().setHostname(msg.payload.hostname);
    account.getHost().setSecure(msg.payload.secure);
    account.getHost().setPort(msg.payload.port);
    account.getHost().setFingerprint(msg.payload.fingerprint);
  },

  "account-set-authentication": function (msg) {
    let account = accounts.getAccountById(msg.payload.account);

    account.getLogin().setSaslMechanism(msg.payload.mechanism);
    account.getLogin().setUsername(msg.payload.username);
  },

  "account-set-general": function (msg) {
    let account = accounts.getAccountById(msg.payload.account);

    account.getSettings().setKeepAlive(msg.payload.keepAliveEnabled);
    account.getSettings().setKeepAliveInterval(msg.payload.keepAliveInterval);
  },

  "account-capabilities": async function (msg) {
    console.log("Get Capabilities");

    return await sessions[msg.payload.account].capabilities();
  },

  "account-cert-error" : async (msg) => {
    let rv = await new SieveDialog().show(
      "./ui/app/dialog.account.cert.tpl",
      (dialog) => { dialog.find(".sieve-dialog-fingerprint").text(msg.payload.fingerprint); },
      () => { return true; },
      () => { return false; }
    );

    // save the fingerprint.
    if (rv === true) {
      accounts.getAccountById(msg.payload.account).getHost().setFingerprint(msg.payload.fingerprint);
      // TODO we need to trigger this reconnect async...
      actions["account-connecting"](msg);
    }
  },

  "account-connecting" : async (msg) => {
    try {
      await sessions[msg.payload.account].connect();
    } catch (e) {

      if (e.getType && e.getType() === "SIEVE_CERT_VALIDATION_EXCEPTION") {
        msg.payload.fingerprint = e.cert.fingerprint;
        await actions["account-cert-error"](msg);
        return;
      }

      // connecting failed for some reason, which means we
      // need to handle the error.
      alert(e);
    }

  },

  "account-connect": async (msg) => {

    console.log("Connect");

    if (sessions[msg.payload.account])
      await sessions[msg.payload.account].disconnect();

    let account = accounts.getAccountById(msg.payload.account);

    sessions[msg.payload.account] = new SieveSession(account, "sid2");

    await actions["account-connecting"](msg);
  },

  "account-connected": function (msg) {
    console.log("Is Connected");

    if (typeof (sessions[msg.payload.account]) === "undefined") {
      return false;
    }

    return sessions[msg.payload.account].isConnected();
  },


  "account-disconnect": async function (msg) {
    if (sessions[msg.payload.account])
      await sessions[msg.payload.account].disconnect();

    delete sessions[msg.payload.account];
  },

  "account-list": async function (msg) {
    console.log("List Scripts for account: " + msg.payload.account);

    return await sessions[msg.payload.account].listScripts();
  },

  // Script endpoint...
  "script-create": async function (msg) {
    console.log("Create Scripts " + msg.payload.data + " for account: " + msg.payload.account);

    await sessions[msg.payload.account].putScript(msg.payload.data, "#test\r\n");
  },

  "script-rename": async function (msg) {
    console.log("Rename Script " + msg.payload.data + " for account: " + msg.payload.account);

    await sessions[msg.payload.account].renameScript(msg.payload.old, msg.payload.new);
  },

  "script-delete": async function (msg) {
    console.log("Delete Scripts " + msg.payload.data + " for account: " + msg.payload.account);

    await sessions[msg.payload.account].deleteScript(msg.payload.data);
  },

  "script-activate": async function (msg) {
    console.log("Activate..." + msg);

    await sessions[msg.payload.account].setActiveScript(msg.payload.data);
  },

  "script-deactivate": async function (msg) {
    console.log("Deactivate...");

    await sessions[msg.payload.account].setActiveScript();
  },

  "script-edit": async function (msg) {

    let name = msg.payload.data;
    let account = msg.payload.account;

    // create a new tab...

    console.log("Edit Script " + name);

    let id = "" + account + "-" + name;

    let tabId = id + "-tab";
    let contentId = id + "-content";

    if ($("#" + tabId).length) {
      $("#myTab .nav-link[href='#" + contentId + "']").tab('show');
      return;
    }

    // create a new tab.
    let content = await (new SieveTemplateLoader()).load("./ui/app/editor.content.tpl");
    let tab = await (new SieveTemplateLoader()).load("./ui/app/editor.tab.tpl");

    tab.find(".nav-link")
      .attr("href", "#" + contentId);

    tab
      .find(".siv-tab-name")
      .text(name);

    tab
      .find(".close")
      .click(() => {
        $("#" + contentId).remove();
        $("#" + tabId).remove();
        $("#accounts-tab").find(".nav-link").tab('show');
      });

    content.attr("id", contentId);
    tab.attr("id", tabId);

    // Update the iframe's url.
    let url = new URL(content.attr("src"), window.location);

    url.searchParams.append("account", account);
    // FIXME: the script name should ne an id so that we survive a rename...
    url.searchParams.append("script", name);

    content.attr("src", url.toString());

    $("#myTabContent").append(content);
    $("#myTab").append(tab);

    tab.find(".nav-link").tab('show');

    // insert tab.
    // insert content.
    // wait for message...
  },

  "script-get": async function (msg) {
    console.log("Get Script...");
    return await sessions[msg.payload.account].getScript(msg.payload.data);
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

    await sessions[msg.payload.account].putScript(msg.payload.name, msg.payload.script);
  },

  "script-import": async function (msg) {
    console.log("Import Script...");

    let options = {
      title: "Import Script",
      openFile: true,
      openDirectory: false,
      filters: [
        { name: 'Sieve Scripts', extensions: ['siv', "sieve"] },
        { name: 'All Files', extensions: ['*'] }]
    };

    let filenames = require("electron").remote.dialog.showOpenDialog(options);

    if (!Array.isArray(filenames))
      return undefined;

    let fs = require('fs');

    if (!fs.existsSync(filenames[0]))
      return undefined;

    let file = fs.readFileSync(filenames[0], "utf-8");
    return file;
  },

  "script-export": async function (msg) {
    console.log("Export Script...");

    let options = {
      title: "Export Script",
      filters: [
        { name: 'Sieve Scripts', extensions: ['siv', "sieve"] },
        { name: 'All Files', extensions: ['*'] }]
    };

    let filename = require("electron").remote.dialog.showSaveDialog(options);

    // Check if the dialog was chanceled...
    if (typeof (filename) === "undefined")
      return;

    require('fs').writeFileSync(filename, msg.payload.script, "utf-8");
    return;
  },

  "script-changed": function (msg) {
    console.log("Script changed...");

    let tab = $("#" + msg.payload.account + "-" + msg.payload.name + "-tab .close");

    if (msg.payload.changed)
      tab.text("•");
    else
      tab.text("×");
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
    const { SievePrefManager } = require('./utils/SievePrefManager.js');

    let pref = new SievePrefManager("editor");

    if (msg.payload.data === "tabulator-policy")
      return pref.getBoolean("tabulator-policy", true);

    if (msg.payload.data === "tabulator-width")
      return pref.getInteger("tabulator-width", 2);

    if (msg.payload.data === "indentation-policy")
      return pref.getBoolean("indentation-policy", false);

    if (msg.payload.data === "indentation-width")
      return pref.getInteger("indentation-width", 2);

    if (msg.payload.data === "syntax-check")
      return pref.getBoolean("syntax-check", true);

    throw new Error("Unknown settings");
  },

  "set-preference": (msg) => {
    const { SievePrefManager } = require('./utils/SievePrefManager.js');

    let pref = new SievePrefManager("editor");

    pref.setValue(msg.payload.key, msg.payload.value);
  }

};


window.addEventListener("message", function (e) {

  (async () => {
    console.log('parent received message!:  ', e.data);
    console.dir(e);

    let msg = JSON.parse(e.data);

    if (actions[msg.action]) {
      try {
        msg.payload = await (actions[msg.action])(msg);
      } catch (ex) {
        msg.error = ex.message;
        console.log(ex);
      }

      e.source.postMessage(JSON.stringify(msg), e.origin);
      return;
    }

    // TODO add timeout and error handling...
    // othewise we block endlessly due to await.

    console.log("Unknown action " + msg.action);
    e.source.postMessage(JSON.stringify(msg), e.origin);
  })();
}, false);


$("#donate").click(() => {
  require("electron").shell.openExternal("https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=EAS576XCWHKTC");
});

$('#scrollright').click(function () {

  // $('.scroller-left').fadeIn('slow');
  // $('.scroller-right').fadeOut('slow');

  $('.list').animate({ left: "-=100px" }, function () {

  });
});

$('#scrollleft').click(function () {

  // $('.scroller-right').fadeIn('slow');
  // $('.scroller-left').fadeOut('slow');

  if ($('.list').position().left >= 0)
    $('.list').animate({ left: "0px" });
  else
    $('.list').animate({ left: "+=100px" });
});
