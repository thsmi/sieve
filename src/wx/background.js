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

(function() {

  "use strict";

  /* global browser */
  /* global SieveIpcClient */
  /* global SieveAccounts */

  browser.tabs.create({
    active: true,
    url : "./libs/managesieve.ui/accounts.html"
  });

  let accounts = [];
  const sessions = {};

  const actions = {
    // account endpoints...
    "accounts-list": async function () {
      console.log("List Accounts");

      accounts = (await (new SieveAccounts().load()));

      return accounts.getAccounts();
    },

    "account-get-displayname": function (msg) {
      return accounts.getAccountById(msg.payload.account).getHost().getDisplayName();
    },

    "account-connected": function (msg) {
      console.log("Is Connected");

      if (typeof (sessions[msg.payload.account]) === "undefined") {
        return false;
      }

      return sessions[msg.payload.account].isConnected();
    },
  };

  for (const [key, value] of Object.entries(actions)) {
    SieveIpcClient.setRequestHandler(key, value);
  }

})(this);
