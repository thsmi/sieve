"use strict";

/* global require */
const $ = require('./libs/jquery/jquery.min.js');
require('./libs/bootstrap/js/bootstrap.bundle.min.js');

// Import the node modules into our global namespace...
const {SieveSession} = require("./libs/libManageSieve/SieveNodeSession.js");
const {SieveAccount} = require("./SieveAccount.js");

const account = new SieveAccount();

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


console.log("Accout" + account);

let accounts = {};

let accountlist = {
  "ba15cb44-a221-11e7-abc4-cec278b6b50a": {
    name: "schmid-thomas@gmx.net1",
    capabilities: {
      "IMPLEMENTATION": "NEMESIS ManageSieved v3700075029",
      "SASL": "PLAIN",
      "UNAUTHENTICATE": null,
      "SIEVE": "body comparator-i;ascii-casemap comparator-i;ascii-numeric comparator-i;octet date encoded-character envelope fileinto imap4flags index relational variables",
      "VERSION": "1.0"
    },
    scripts: {
      "Script 1": true,
      "Script 2": false,
      "Script 3": false
    }
  },
/*  "ba15cdba-a221-11e7-abc4-cec278b6b50a": {
    name: "schmid-thomas@gmx.net2",
    scripts: {
    }
  }*/
};

let actions = {
  "accounts-list": function (msg) {
    msg.data = [];

    Object.keys(accountlist).forEach(function (element) {
      msg.data.push(element);
    }, this);

    return msg;
  },

  "account-delete": function (msg) {
    console.log("Remove Account");

    delete accountlist[msg.data.id];
    return msg;
  },

  "account-settings-get" : function (msg) {

  },

  "account-settings-set" : function (msg) {

  },

  "account-capabilities": async function (msg) {
    console.log("Get Capabilities");

    msg.data = await accounts[msg.data.id].capabilities();

    return msg;
  },

  "account-connect" : async function (msg) {

    accounts[msg.data.id] = new SieveSession(account, "sid2");

    await accounts[msg.data.id].connect();

    return msg;
  },

  "account-connected": function (msg) {

    if (typeof(accounts[msg.data.id]) === "undefined") {
      msg.data.connected = false;
      return msg;
    }

    msg.data.connected = accounts[msg.data.id].isConnected();
    return msg;
  },

  "account-list": async function (msg) {

    console.log("List Scripts for account: " + msg.data.id);

    msg.data = await accounts[msg.data.id].listScripts();
    return msg;
  },

  "script-create": async function(msg) {
    console.log("Create Scripts "+msg.data.data+"for account: " + msg.data.id);

    await accounts[msg.data.id].putScript(msg.data.data);
    return msg;
  },

  "script-rename": async function (msg) {
    console.log("Rename Script " + msg.data.data + " for account: " + msg.data.id);

    await accounts[msg.data.id].renameScript(msg.data.data.old, msg.data.data.new);
    return msg;
  },

  "script-delete": async function (msg) {
    console.log("Delete Scripts " + msg.data.data + " for account: " + msg.data.id);

    await accounts[msg.data.id].deleteScript(msg.data.data);
    return msg;
  },

  "script-activate": async function (msg) {

    console.log("Activate..." + msg);

    await accounts[msg.data.id].setActiveScript(msg.data.data);
    return msg;
  },

  "script-deactivate": async function (msg) {

    console.log("Deactivate...");

    await accounts[msg.data.id].setActiveScript();
    return msg;
  },

  "script-get": async function (msg) {
    console.log("Get Script...");

    msg.data = await accounts[msg.data.id].getScript();
    return msg;
  },

  "script-save": async function (msg) {
    console.log("Save Script...");

    await accounts[msg.data.id].putScript(msg.data.data);
    return msg;
  },

};


window.addEventListener("message", function (e) {

  (async () => {
    console.log('parent received message!:  ', e.data);
    console.dir(e);

    let msg = JSON.parse(e.data);

    if (actions[msg.action]) {
      msg = await (actions[msg.action])(msg);

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

$('#debug').click(function () {
  $('#test')[0].openDevTools();
});
