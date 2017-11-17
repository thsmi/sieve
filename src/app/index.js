"use strict";

/* global require */
/* global $ */

// Import the node modules into our global namespace...
const {SieveSession} = require("./libs/libManageSieve/SieveNodeSession.js");
const {SieveAccount} = require("./SieveAccount.js");

const account = new SieveAccount();
let session = (new SieveSession(account, "sid2"));

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

( async () => {
  //session.addListener(listener);
  await session.connect0();
  console.dir(await session.listScripts());
})();



console.log("Accout" + account);

let accounts = {
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
  "ba15cdba-a221-11e7-abc4-cec278b6b50a": {
    name: "schmid-thomas@gmx.net2",
    scripts: {
    }
  }
};


window.addEventListener("message", function (e) {

  (async () => {
  console.log('parent received message!:  ', e.data);
  console.dir(e);

  let msg = JSON.parse(e.data);

  if (msg.action === "accounts-list") {
    msg.data = [];

    Object.keys(accounts).forEach(function (element) {
      msg.data.push(element);
    }, this);

    e.source.postMessage(JSON.stringify(msg), e.origin);
    return;
  }

  if (msg.action === "account-connected") {
    msg.data.connected = session.isConnected();

    console.log("Account " + msg.data.id + " connected ? "+ msg.data.connected );

    e.source.postMessage(JSON.stringify(msg), e.origin);
    return;
  }

  if (msg.action === "account-list") {

    console.log("List Scripts for account: " + msg.data.id);

    msg.data = await session.listScripts();
    e.source.postMessage(JSON.stringify(msg), e.origin);

    return;
  }

  // TODO add timeout and error handling...
  // othewise we block endlessly due to await.
  if (msg.action === "script-rename") {

    console.log("Rename Script "+msg.data.data+" for account: " + msg.data.id);

    await session.renameScript(msg.data.data.old, msg.data.data.new);
    e.source.postMessage(JSON.stringify(msg), e.origin);
    return;
  }

  if (msg.action === "script-delete") {
    console.log("Delete Scripts "+msg.data.data+" for account: " + msg.data.id);

    await session.deleteScript(msg.data.data);
    e.source.postMessage(JSON.stringify(msg), e.origin);

    return;
  }

  if (msg.action === "script-create") {
    console.log("Create Scripts "+msg.data.data+"for account: " + msg.data.id);

    await session.putScript(msg.data.data);
    e.source.postMessage(JSON.stringify(msg), e.origin);

    return;
  }

  if (msg.action === "script-activate") {

    console.log("Activate..." + JSON.stringify(msg));

    await session.setActiveScript(msg.data.data);
    e.source.postMessage(JSON.stringify(msg), e.origin);
    return;
  }

  if (msg.action === "script-deactivate") {

    console.log("Deactivate...");

    await session.setActiveScript();
    e.source.postMessage(JSON.stringify(msg), e.origin);
    return;
  }

  if (msg.action === "script-edit") {
    console.log("Edit Script...");

    let script = await session.getScript();

    //$("#")
  }

  if (msg.action === "account-delete") {

    console.log("Remove Account");

    delete accounts[msg.data.id];

    e.source.postMessage(JSON.stringify(msg), e.origin);
    return;
  }

  if (msg.action === "account-capabilities") {
    console.log("Get Capabilities");

    msg.data = await session.capabilities();

    e.source.postMessage(JSON.stringify(msg), e.origin);
    return;
  }

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
