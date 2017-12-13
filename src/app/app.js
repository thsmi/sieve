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

/* global require */
const $ = require('./libs/jquery/jquery.min.js');
require('./libs/bootstrap/js/bootstrap.bundle.min.js');

// Import the node modules into our global namespace...

const { SieveSession } = require("./libs/libManageSieve/SieveNodeSession.js");
const { SieveAccounts } = require("./SieveAccounts.js");
const { SieveTemplateLoader } = require("./utils/SieveTemplateLoader.js");

let callback = async function (account) {

  let username = account.getLogin().getUsername();
  let displayName = account.getHost().getDisplayName();

  // we show a password prompt which is async.
  // In case the dialog is canceled we throw an exception
  // Otherwise we return the given password.
  return await new Promise((resolve, reject) => {
    let dialog = $("#sieve-password-dialog");

    dialog
      .find(".sieve-username")
      .text(username);

    dialog
     .find(".sieve-displayname")
     .text(displayName);

    dialog.modal('show')
      .on('hidden.bs.modal', () => {
        dialog.find(".sieve-password").val("");
        reject(new Error("Dialog canceled"));
      })
      .find(".sieve-login").off().click(() => {
        dialog.off('hidden.bs.modal').modal('hide');
        let password = dialog.find(".sieve-password").val();
        dialog.find(".sieve-password").val("");
        resolve(password);
      });
  });
};

let accounts = new SieveAccounts(callback).load();

/*let listener = {
  onTimeout: function () {
    session.disconnect(true);
  },
  onChannelCreated: function () {

    let request = new SieveListScriptRequest();
    request.addListScriptListener(this);
    request.addErrorListener(this);

    session.sieve.addRequest(request);
  },
  onListScriptResponse: function (response) {
    console.dir(response.getScripts());
    // session.disconnect();
  }
};*/


let sessions = {};



let actions = {

  // account endpoints...
  "accounts-list": function () {
    console.log("List Accounts");
    return accounts.getAccounts();
  },

  "account-create": function () {
    console.log("Remove Account");
    return accounts.create();
  },

  "account-delete": function (msg) {
    console.log("Remove Account");
    accounts.remove(msg.payload.account);
    return;
  },

  "account-get-displayname" : function(msg) {
    return accounts.getAccountById(msg.payload.account).getHost().getDisplayName();
  },

  "account-get-server": function (msg) {
    let account = accounts.getAccountById(msg.payload.account);

    return {
      displayName : account.getHost().getDisplayName(),
      hostname: account.getHost().getHostname(),
      secure: account.getHost().isSecure(),
      port: account.getHost().getPort()
    };
  },

  "account-get-authentication": function (msg) {
    let account = accounts.getAccountById(msg.payload.account);

    return {
      mechanism: account.getLogin().getSaslMechanism(),
      username: account.getLogin().getUsername()
    };
  },

  "account-set-server": function (msg) {
    let account = accounts.getAccountById(msg.payload.account);

    account.getHost().setDisplayName(msg.payload.displayName);
    account.getHost().setHostname(msg.payload.hostname);
    account.getHost().setSecure(msg.payload.secure);
    account.getHost().setPort(msg.payload.port);
  },

  "account-set-authentication": function (msg) {
    let account = accounts.getAccountById(msg.payload.account);

    account.getLogin().setSaslMechanism(msg.payload.mechanism);
    account.getLogin().setUsername(msg.payload.username);
  },


  "account-capabilities": async function (msg) {
    console.log("Get Capabilities");

    return await sessions[msg.payload.account].capabilities();
  },

  "account-connect": async function (msg) {

    console.log("Connect");

    if (sessions[msg.payload.account])
      await sessions[msg.payload.account].disconnect();

    let account = accounts.getAccountById(msg.payload.account);

    sessions[msg.payload.account] = new SieveSession(account, "sid2");

    await sessions[msg.payload.account].connect();
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

    await sessions[msg.payload.account].putScript(msg.payload.data);
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

  "script-edit" : async function(msg) {

    let name = msg.payload.data;
    let account = msg.payload.account;

    // create a new tab...

    console.log("Edit Script "+name);
    let script = await sessions[msg.payload.account].getScript(name);

    let m = {
      "action" : "editor-init",
      "script" : script,
      "account" : account,
    };

    m = JSON.stringify(m);

    let id = ""+account+"-"+name;

    if ($("#"+id).length) {
      $("#myTab .nav-link[href='#"+id+"']").tab('show');
      return;
    }

    // create a new tab.
    let content = await (new SieveTemplateLoader()).load("./ui/app/editor.content.tpl");
    let tab = await (new SieveTemplateLoader()).load("./ui/app/editor.tab.tpl");

    tab.find(".nav-link")
      .attr("href", "#"+id)
      .text(name);

    content
      .attr("id", id);

    // Update the iframe's url.
    let url = new URL(content.attr("src"), window.location);

    url.searchParams.append("account", account);
    //FIXME the script name should ne an id so that we survive a rename...
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

  "script-check" : async function(msg) {
    console.log("Check Script...");

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

    await sessions[msg.payload.account].putScript(msg.payload.data);
  },

};


window.addEventListener("message", function (e) {

  (async () => {
    console.log('parent received message!:  ', e.data);
    console.dir(e);

    let msg = JSON.parse(e.data);

    if (actions[msg.action]) {
      msg.payload = await (actions[msg.action])(msg);

      e.source.postMessage(JSON.stringify(msg), e.origin);
      return;
    }

    // TODO add timeout and error handling...
    // othewise we block endlessly due to await.

    console.log("Unknown action " + msg.action);
    e.source.postMessage(JSON.stringify(msg), e.origin);
  })();
}, false);



$('#scrollright').click(function () {

  //$('.scroller-left').fadeIn('slow');
  //$('.scroller-right').fadeOut('slow');

  $('.list').animate({ left: "-=100px" }, function () {

  });
});

$('#scrollleft').click(function () {

  //$('.scroller-right').fadeIn('slow');
  //$('.scroller-left').fadeOut('slow');

  if ($('.list').position().left >= 0)
    $('.list').animate({ left: "0px" });
  else
    $('.list').animate({ left: "+=100px" });
});

$('#tmp').click(function () {
  $("#sieve-password-dialog").modal('show');
});

$('#debug').click(function () {
  $('#test')[0].openDevTools();
});
