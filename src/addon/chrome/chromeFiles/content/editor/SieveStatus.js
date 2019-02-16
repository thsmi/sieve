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

/* global document */
/* global window */
/* global Components */
/* global Services */
/* global SieveOverlayManager */

// Enable Strict Mode
"use strict";

const STATE_SCRIPT_READY = 0;
const STATE_WARNING = 1;
const STATE_CLIENT_ERROR = 2;
const STATE_WAITING = 3;
const STATE_SERVER_ERROR = 4;
const STATE_BAD_CERT = 5;
const STATE_OFFLINE = 6;
const STATE_CAPABILITIES = 7;
const STATE_AUTOCONFIG = 8;


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

Cu.import("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");
Cu.import("chrome://sieve/content/modules/utils/SieveWindowHelper.jsm");

let { SieveUtils } = SieveOverlayManager.requireModule("./utils/SieveWindowHelper.jsm", window);
let { SieveAutoConfig } = SieveOverlayManager.requireModule("./sieve/SieveAutoConfig.jsm", window);

/*
 *  Auto Config
 */

let gAutoConfig = null;
let gAccount = null;
let gCallback = null;
let gCallbacks = null;

let gCertStatus = null;

function onStatus(state, message) {
  // we need this array to corelate status ids and the deck's selectedIndex
  // 0:StatusWait, 1:StatusBadCert, 2:StatusDisabled, 3:StatusConnectionLost,
  // 4:StatusOffline, 5:StatusWarning, 6:StatusOutOfSync, 7:StatusError
  let mapping = { STATE_SCRIPT_READY: null, STATE_WARNING: 5, STATE_CLIENT_ERROR: 7, 3: 0, 4: 7, 5: 1, 6: 4, STATE_CAPABILITIES: null, STATE_AUTOCONFIG: 2, 9: 3, 10: 6 };

  try {
    let strings = Services.strings.createBundle("chrome://sieve/locale/locale.properties");


    switch (state) {
      case STATE_WARNING: document.getElementById('StatusWarningMsg')
        .firstChild.nodeValue = strings.GetStringFromName(message);
        break;
      // client error
      case STATE_CLIENT_ERROR: document.getElementById('StatusErrorMsg')
        .firstChild.nodeValue = strings.GetStringFromName(message);
        break;
      case STATE_WAITING: document.getElementById('StatusWaitMsg')
        .firstChild.nodeValue = strings.GetStringFromName(message);
        break;
      // server error
      case STATE_SERVER_ERROR: document.getElementById('StatusErrorMsg').textContent = message;
        break;
      case STATE_BAD_CERT:
        gCertStatus = message.status;
        document.getElementById("btnIgnoreBadCert").setAttribute("message", message.site);
        document.getElementById("btnIgnoreBadCert").setAttribute("oncommand",
          "onBadCertOverride(this.getAttribute('message'),document.getElementById('cbBadCertRemember').checked);");

        document.getElementById("btnAbortBadCert").setAttribute("oncommand",
          "onStatus(1,'warning.brokencert');");

        break;
      // Offline Mode
      case STATE_OFFLINE:
        break;
      // Capabilities set...
      case STATE_CAPABILITIES:
        return;
      // account disabled
      case STATE_AUTOCONFIG:
        document.getElementById('sivAutoConfig').setAttribute("selectedIndex", message);
        break;

      case 9:
        break;

      case 10:
        document.getElementById("sivClientSide").value = message.local;
        document.getElementById("sivServerSide").value = message.remote;
        break;

      // Show the tobber as default...
      default:
        document.getElementById('StatusWaitMsg').firstChild.nodeValue = "";
        state = 0;
    }

    document.getElementById('StatusDeck').setAttribute("selectedIndex", "" + mapping[state]);

  } catch (ex) {
    Cu.reportError(state + " || " + message + "||" + ex.toSource());
  }
}


let gAutoConfigEvent =
{
  onSuccess: function (host, port, proxy) {
    onStatus(STATE_AUTOCONFIG, 2);

    gAccount.setActiveHost(0);
    gAccount.getHost().setPort(port);
    gAccount.setEnabled(true);

    gAutoConfig = null;
  },

  onError: function () {
    onStatus(STATE_AUTOCONFIG, 3);
    gAutoConfig = null;
  }
};

function onAutoConfigRunClick() {
  if (gAutoConfig)
    gAutoConfig.cancel();

  gAutoConfig = new SieveAutoConfig();

  gAutoConfig.addHost(
    gAccount.getHost(0).getHostname(),
    4190,
    gAccount.getProxy().getProxyInfo());

  gAutoConfig.addHost(
    gAccount.getHost(0).getHostname(),
    2000,
    gAccount.getProxy().getProxyInfo());

  gAutoConfig.run(gAutoConfigEvent);

  onStatus(STATE_AUTOCONFIG, 1);
}

function onAutoConfigCancelClick() {
  gAutoConfig.cancel();
  gAutoConfig = null;

  onStatus(STATE_AUTOCONFIG, 3);
}

function onAutoConfigFinishedClick() {
  gCallback();
}

function onReconnectClick() {
  gCallback();
}

/**
 * Called when a bad certificate should be overwritten.
 * @param {string} targetSite
 *   the websites address as string
 * @param {boolean} permanent
 *   if true the override will be permanent otherwise temporary
 */
function onBadCertOverride(targetSite, permanent) {
  "use strict";

  try {
    let overrideService = Cc["@mozilla.org/security/certoverride;1"]
      .getService(Ci.nsICertOverrideService);

    let status = null;
    if (gCertStatus) {
      status = gCertStatus;
    }
    else if (Cc["@mozilla.org/security/recentbadcerts;1"]) {
      status = Cc["@mozilla.org/security/recentbadcerts;1"]
        .getService(Ci.nsIRecentBadCertsService)
        .getRecentBadCert(targetSite);
    }
    else {
      status = Cc["@mozilla.org/security/x509certdb;1"]
        .getService(Ci.nsIX509CertDB)
        .getRecentBadCerts(false)
        .getRecentBadCert(targetSite);
    }

    if (!status)
      throw new Error("No certificate stored for taget Site...");

    let flags = ((status.isUntrusted) ? overrideService.ERROR_UNTRUSTED : 0)
      | ((status.isDomainMismatch) ? overrideService.ERROR_MISMATCH : 0)
      | ((status.isNotValidAtThisTime) ? overrideService.ERROR_TIME : 0);

    if (typeof(Ci.nsISSLStatus) !== "undefined")
      status = status.QueryInterface(Ci.nsISSLStatus);

    let cert = status.serverCert;

    if (!cert)
      throw new Error("Status does not contain a certificate...");

    overrideService.rememberValidityOverride(
      // Host Name with port (host:port)
      targetSite.split(":")[0],
      targetSite.split(":")[1],
      cert,
      flags,
      !permanent);

    gCallback();

    gCertStatus = null;
  }
  catch (ex) {
    onStatus(2, "error.brokencert");
    Cu.reportError(ex);
  }

}

function onDetach() {
  if (gAutoConfig) {
    gAutoConfig.cancel();
    gAutoConfig = null;
  }

  gCallback = null;
  gCallbacks = null;
}

/**
 * The callback is invoced when the user wants to reconnect
 *
 * @param {} account
 * @param {} callback
 *
 */
function onAttach(account, callback, callbacks) {
  if (gAutoConfig) {
    gAutoConfig.cancel();
    gAutoConfig = null;
  }

  gAccount = account;
  gCallback = callback;
  if (callbacks)
    gCallbacks = callbacks;
}

function onSettingsClick() {
  let server = Cc['@mozilla.org/messenger/account-manager;1']
    .getService(Ci.nsIMsgAccountManager)
    .getIncomingServer(gAccount.imapKey);

  SieveUtils.OpenSettings(window, server);
}


function onGoOnlineClick() {
  let ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
  ioService.offline = false;

  gCallback();
}


function onKeepLocal() {
  gCallbacks.onKeepLocal();
}

function onUseRemote() {
  gCallbacks.onUseRemote(document.getElementById("sivServerSide").value);
}


// ChannelCreated
// ChannelClosed
// ChannelReady
// ChannelStatus

// Events Account Switch
// Status Change

