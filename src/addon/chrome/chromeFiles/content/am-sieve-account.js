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
/* global SieveUtils */
/* global SieveOverlayManager */
/* global Services */

// This function is wraped into an iframe.
// It is guaranteed we have a completely separated namespace.
// So no need to wrap this into an anonymous function

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");

let { require } = SieveOverlayManager.requireModule("./sieve/SieveRequire.jsm", window);
let { SieveAccountManager } = require("./settings/SieveMozAccounts.js");

let gSieveAccount = null;
let gSivIncomingServer = null;
let gLogger = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);


function onLoad() {
  "use strict";

  parent.onPanelLoaded('am-sieve-account.xul');
}

function onUnload() {
  "use strict";

  gSieveAccount = null;
  gSivIncomingServer = null;
}

/**
 * Called everytime we need to refresh the page's content.
 *
 */
function updatePage() {
  "use strict";

  if (gSieveAccount.isEnabled())
    document.getElementById('rgAccount').selectedIndex = 1;
  else
    document.getElementById('rgAccount').selectedIndex = 0;

  document.getElementById('txtHostname').value
    = gSieveAccount.getHost().getHostname();
  document.getElementById('txtPort').value
    = gSieveAccount.getHost().getPort();

  document.getElementById('txtTLS').value
    = gSieveAccount.getSecurity().isSecure();

  let description = Services.strings.createBundle("chrome://sieve/locale/locale.properties")
    .GetStringFromName(gSieveAccount.getAuthentication().getDescription());

  document.getElementById('txtAuth').value
    = description;

  document.getElementById('txtUserName').value
    = gSieveAccount.getAuthentication().getUsername();
}


/*
function onAcceptEditor() { }

function onSave() { }
*/

function onPreInit(account, accountvalues) {
  "use strict";
  gSivIncomingServer = account.incomingServer;
}

function onInit(pageId, serverId) {
  "use strict";

  // we need to wrap this into a try catch otherwise the error will get discarded silently...
  try {
    gSieveAccount = SieveAccountManager.getAccountByServer(gSivIncomingServer);
    updatePage();
  } catch (ex) {
    gLogger.logMessage(ex);
  }
}

function onAccountStatusChange() {
  "use strict";

  let rgAccount = document.getElementById('rgAccount');

  if (rgAccount.selectedIndex > 0)
    gSieveAccount.setEnabled(true);
  else if (gSieveAccount)
    gSieveAccount.setEnabled(false);
}

function onFiltersClick() {
  "use strict";

  Components.utils.import("chrome://sieve/content/modules/utils/SieveWindowHelper.jsm");
  SieveUtils.OpenFilter(window, gSivIncomingServer);

  parent.close();
}

/**
 * Clickhandler which opens the settings dialog.
 *
 **/
function onSettingsClick() {
  "use strict";

  try {
    // We don't need a mediator right here as long as we open a modal window ...
    // ... Because Thunderbird ensures, that the parent account settings can ...
    // ... be opened exactly one time!
    window.openDialog("chrome://sieve/content/options/SieveAccountOptions.xul",
      "FilterAccountOptions", "chrome,modal,titlebar,centerscreen",
      { SieveAccount: gSieveAccount });

    updatePage();
  } catch (ex) {
    gLogger.logMessage(ex);
  }
}
