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

/* global Components */
/* global document */
/* global window */
/* global SieveAccountManager */
/* global SieveUtils */
/* global SieveOverlayManager */

// Enable Strict Mode
"use strict";

Components.utils.import("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");
SieveOverlayManager.require("/sieve/SieveAccounts.js", this, window);

let gSieveAccount = null;
let gSivIncomingServer = null;

function onLoad() {
  parent.onPanelLoaded('am-sieve-account.xul');
}

function onUnload() {
  gSieveAccount = null;
  gSivIncomingServer = null;
}

function updatePage() {
  if (gSieveAccount.isEnabled())
    document.getElementById('rgAccount').selectedIndex = 1;
  else
    document.getElementById('rgAccount').selectedIndex = 0;

  document.getElementById('txtHostname').value
    = gSieveAccount.getHost().getHostname();
  document.getElementById('txtPort').value
    = gSieveAccount.getHost().getPort();
  document.getElementById('txtTLS').value
    = gSieveAccount.getHost().isTLSForced();

  document.getElementById('txtAuth').value
    = gSieveAccount.getLogin().getDescription();

  document.getElementById('txtUserName').value
    = gSieveAccount.getLogin().getUsername();
}


/*
function onAcceptEditor() { }

function onSave() { }
*/

function onPreInit(account, accountvalues) {
  gSivIncomingServer = account.incomingServer;
}

function onInit(pageId, serverId) {
  gSieveAccount = SieveAccountManager.getAccountByServer(gSivIncomingServer);
  updatePage();
}

function onAccountStatusChange() {
  var rgAccount = document.getElementById('rgAccount');

  if (rgAccount.selectedIndex > 0)
    gSieveAccount.setEnabled(true);
  else if (gSieveAccount)
    gSieveAccount.setEnabled(false);
}

function onFiltersClick() {
  Components.utils.import("chrome://sieve/content/modules/utils/SieveWindowHelper.jsm");
  SieveUtils.OpenFilter(window, gSivIncomingServer);

  parent.close();
}

function onSettingsClick() {
  // We don't need a mediator right here as long as we open a modal window ...
  // ... Because Thunderbird ensures, that the parent account settings can ...
  // ... be opened exactly one time!

  window.openDialog("chrome://sieve/content/options/SieveAccountOptions.xul",
    "FilterAccountOptions", "chrome,modal,titlebar,centerscreen",
    { SieveAccount: gSieveAccount });

  updatePage();
}
