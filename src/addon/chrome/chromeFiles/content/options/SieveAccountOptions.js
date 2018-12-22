/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 * Contributor(s):
 *   Cyril Kluska <ckluska@easter-eggs.com>
 */

/* global document */
/* global window */
/* global Components */
/* global SieveOverlayManager */

/** @type SieveAccount */
let gAccount = null;

(function (exports) {
  // Enable Strict Mode
  "use strict";

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const Cu = Components.utils;

  Cu.import("resource://gre/modules/Services.jsm");

  Cu.import("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");
  let { SieveAutoConfig } = SieveOverlayManager.requireModule("./sieve/SieveAutoConfig.jsm", window);


  const AUTH_TYPE_CUSTOM = 2;

  const SIEVE_RFC_PORT = 4190;
  const SIEVE_OLD_PORT = 2000;

  // === Server Sheet ===========================================================
  function enableHost(type) {
    if (type === 1)
      document.getElementById('txtHostname').removeAttribute('disabled');
    else
      document.getElementById('txtHostname').setAttribute('disabled', 'true');
  }

  function enablePort(type) {
    if (type === 2)
      document.getElementById('txtPort').removeAttribute('disabled');
    else
      document.getElementById('txtPort').setAttribute('disabled', 'true');
  }

  function onServerSheetLoad(account) {
    let rbHost = document.getElementById('rgHost');
    rbHost.selectedIndex = account.getHost().getType();
    enableHost(rbHost.selectedIndex);

    // get the custom Host settings
    document.getElementById('txtHostname').value
      = account.getHost(1).getHostname();

    document.getElementById('lblHostname').value
      = account.getHost(0).getHostname();


    let rbPort = document.getElementById('rgPort');

    // Load custom port settings
    let port = account.getHost().getPort(2);

    if ((port === SIEVE_OLD_PORT) || (port === SIEVE_RFC_PORT))
      port = "";

    document.getElementById('txtPort').value = port;

    // Load port
    port = account.getHost().getPort();

    if (port === SIEVE_RFC_PORT)
      rbPort.selectedIndex = 0;
    else if (port === SIEVE_OLD_PORT)
      rbPort.selectedIndex = 1;
    else {
      rbPort.selectedIndex = 2;
      document.getElementById('txtPort').value = port;
    }

    enablePort(rbPort.selectedIndex);
  }



  function onHostSelect(idx) {
    if (!gAccount)
      return;

    gAccount.setActiveHost(idx);
    enableHost(idx);
  }

  function onHostnameChange(value) {
    if (!gAccount)
      return;

    gAccount.getHost(1).setHostname(value);
  }

  function onPortChange(value) {
    if (!gAccount)
      return;

    gAccount.getHost().setPort(value, true);
  }

  function onPortSelect(idx) {
    if (!gAccount)
      return;

    if (idx === 0)
      gAccount.getHost().setPort(SIEVE_RFC_PORT);
    else if (idx === 1)
      gAccount.getHost().setPort(SIEVE_OLD_PORT);
    else
      onPortChange(document.getElementById('txtPort').value);

    enablePort(idx);
  }


  let gAutoConfig = null;

  let gAutoConfigCallback =
  {
    onSuccess: function (host, port) {
      gAutoConfig = null;

      gAccount.getHost().setPort(port);

      document.getElementById("dkAutoSelect").selectedIndex = "2";
      document.getElementById("lblAutoSelectPort").value = port;

      if (port === SIEVE_RFC_PORT)
        document.getElementById("rgPort").selectedIndex = 0;
      else if (port === SIEVE_OLD_PORT)
        document.getElementById("rgPort").selectedIndex = 1;
    },

    onError: function () {
      gAutoConfig = null;
      document.getElementById("dkAutoSelect").selectedIndex = "3";
    }
  };

  function onPortAutoSelect() {
    try {
      document.getElementById("dkAutoSelect").selectedIndex = "1";

      // Load auoconfig only when we realy need it
      gAutoConfig = new SieveAutoConfig();

      gAutoConfig.addHost(
        gAccount.getHost().getHostname(),
        SIEVE_RFC_PORT,
        gAccount.getProxy().getProxyInfo());

      gAutoConfig.addHost(
        gAccount.getHost().getHostname(),
        SIEVE_OLD_PORT,
        gAccount.getProxy().getProxyInfo());

      let port = document.getElementById("txtPort").value;
      port = parseInt(port, 10);

      if (!isNaN(port))
        gAutoConfig.addHost(
          gAccount.getHost().getHostname(),
          port,
          gAccount.getProxy().getProxyInfo());

      gAutoConfig.run(gAutoConfigCallback);
    }
    catch (ex) {
      window.alert("Exception\n" + ex.toSource());
    }
  }

  // === Security Sheet =========================================================

  function enableLogin(type) {
    if (type === AUTH_TYPE_CUSTOM)
      document.getElementById('txtUsername').removeAttribute('disabled');
    else
      document.getElementById('txtUsername').setAttribute('disabled', 'true');
  }

  /**
   * Called when the security page should be populated.
   * @param {SieveAccount} account
   *   a reference to a sieve account which contains the settings.
   *
   */
  function onSecuritySheetLoad(account) {

    let mechanism = document.getElementById("mlAuthMechanism");
    mechanism.addEventListener("command", () => {
      account.getSecurity().setMechanism(
        document.getElementById("mlAuthMechanism").value);
    });

    mechanism.value = account.getSecurity().getMechanism();

    // initalize login related elements...
    document.getElementById('txtUsername').value
      = account.getAuthentication(AUTH_TYPE_CUSTOM).getUsername();

    let rgLogin = document.getElementById('rgLogin');
    rgLogin.addEventListener("select", () => {

      account.setActiveLogin(
        document.getElementById('rgLogin').value);

      enableLogin(account.getAuthentication().getType());
    });

    rgLogin.value = account.getAuthentication().getType();
    enableLogin(rgLogin.value);

    let rbTLS = document.getElementById('rgTLS');

    if (!account.getSecurity().isSecure())
      rbTLS.selectedIndex = 0;
    else
      rbTLS.selectedIndex = 1;

  }

  function onTLSSelect(idx) {
    if (!gAccount)
      return;

    gAccount.getSecurity().setSecure(idx !== 0);
  }





  function onUsernameChange(value) {
    if (!gAccount)
      return;

    gAccount.getAuthentication(2).setUsername(value);
  }

  // === General Sheet ==========================================================


  function enableKeepAlive(enabled) {
    if (enabled)
      document.getElementById('txtKeepAlive').removeAttribute('disabled');
    else
      document.getElementById('txtKeepAlive').setAttribute('disabled', 'true');
  }

  function enableCompile(enabled) {
    if (enabled)
      document.getElementById('txtCompile').removeAttribute('disabled');
    else
      document.getElementById('txtCompile').setAttribute('disabled', 'true');
  }

  function onGeneralSheetLoad(account) {
    document.getElementById('txtKeepAlive').value
      = account.getSettings().getKeepAliveInterval() / (1000 * 60);

    let cbxKeepAlive = document.getElementById('cbxKeepAlive');
    cbxKeepAlive.checked = account.getSettings().isKeepAlive();
    enableKeepAlive(cbxKeepAlive.checked);

    document.getElementById('txtCompile').value
      = account.getSettings().getCompileDelay();

    let element = null;

    element = document.getElementById('cbxCompile');
    element.checked = account.getSettings().hasCompileDelay();
    enableCompile(element.checked);
  }

  // === Proxy Sheet ============================================================

  function enableProxy(type) {
    document.getElementById('txtSocks4Port').setAttribute('disabled', 'true');
    document.getElementById('txtSocks4Host').setAttribute('disabled', 'true');
    document.getElementById('txtSocks5Port').setAttribute('disabled', 'true');
    document.getElementById('txtSocks5Host').setAttribute('disabled', 'true');
    document.getElementById('cbxSocks5RemoteDNS').setAttribute('disabled', 'true');

    switch (type) {
      case 2:
        document.getElementById('txtSocks4Port').removeAttribute('disabled');
        document.getElementById('txtSocks4Host').removeAttribute('disabled');
        break;
      case 3:
        document.getElementById('txtSocks5Port').removeAttribute('disabled');
        document.getElementById('txtSocks5Host').removeAttribute('disabled');
        document.getElementById('cbxSocks5RemoteDNS').removeAttribute('disabled');
        break;
    }
  }

  function onProxySheetLoad(account) {
    // Proxy Configuration...
    document.getElementById('txtSocks4Host').value
      = account.getProxy(2).getHost();
    document.getElementById('txtSocks4Port').value
      = account.getProxy(2).getPort();

    document.getElementById('txtSocks5Host').value
      = account.getProxy(3).getHost();
    document.getElementById('txtSocks5Port').value
      = account.getProxy(3).getPort();
    document.getElementById('cbxSocks5RemoteDNS').checked
      = account.getProxy(3).usesRemoteDNS();

    let rgSocksProxy = document.getElementById('rgSocksProxy');
    rgSocksProxy.selectedIndex = account.getProxy().getType();
    enableProxy(rgSocksProxy.selectedIndex);
  }

  function onProxySelect(type) {
    if (!gAccount)
      return;

    if (typeof (type) === "undefined" || (type === null) || (type > 3))
      type = 1;

    gAccount.setProxy(type);
    enableProxy(type);
  }

  // === Advanced Sheet ==========================================================

  // Function for the custom authentication
  function enableAuthorization(type) {
    if (type == 3)
      document.getElementById('txtAuthorization').removeAttribute('disabled');
    else
      document.getElementById('txtAuthorization').setAttribute('disabled', 'true');
  }

  /**
   * Populates the advanced property sheet with data.
   *
   * @author Thomas Schmid <schmid-thomas@gmx.net>
   * @author Cyril Kluska <ckluska@easter-eggs.com>
   *
   * @param {SieveAccount} account
   *   A SieveAccount which should be used to populate the property sheet
   *
   */
  function onAdvancedSheetLoad(account) {

    // initalize the authorization related elements...
    document.getElementById('txtAuthorization').value
      = account.getAuthorization(3).getAuthorization();

    let rgAuthorization = document.getElementById('rgAuthorization');
    rgAuthorization.selectedIndex = account.getAuthorization().getType();
    enableAuthorization(rgAuthorization.selectedIndex);
  }

  function onAuthorizationSelect(type) {
    if (!gAccount)
      return;

    if (typeof (type) === "undefined" || (type === null) || (type > 3))
      type = 1;

    gAccount.setActiveAuthorization(type);
    enableAuthorization(type);
  }

  function onAuthorizationChange(value) {
    if (!gAccount)
      return;

    gAccount.getAuthorization(3).setAuthorization(value);
  }

  // === Editor Sheet ==========================================================

  /**
   * Populates the editor property sheet with data.
   *
   * @param {SieveAccount} account
   *   A SieveAccount which should be used to populate the property sheet
   *
   */
  function onEditorSheetLoad(account) {
    try {
      // var rgDefaultEditor = document.getElementById('rgDefaultEditor');
      // rgDefaultEditor.selectedIndex = account.getSettings().getDefaultEditor();

      document.getElementById("txtIndentionWidth").value = account.getSettings().getIndentionWidth();
      document.getElementById("txtTabWidth").value = account.getSettings().getTabWidth();

      document.getElementById('mlIndentionPolicy').selectedIndex = account.getSettings().getIndentionPolicy();
    }
    catch (e) {
      Components.utils.reportError(e);
    }

  }

  function onDefaultEditorSelect(type) {
    if (!gAccount)
      return;

    if ((type == null) || (type > 1))
      type = 0;

    gAccount.getSettings().setDefaultEditor(type);
  }

  function onIndentionWidthChange(value) {
    if (!gAccount)
      return;

    gAccount.getSettings().setIndentionWidth(value);
  }

  function onIndentionPolicySelect(value) {
    if (!gAccount)
      return;

    gAccount.getSettings().setIndentionPolicy(value);
  }


  function onTabWidthChange(value) {
    if (!gAccount)
      return;

    gAccount.getSettings().setTabWidth(value);
  }

  // === Debug Sheet =============================================================

  function onDebugSheetLoad(account) {
    document.getElementById('cbxDebugRequest').checked
      = account.getSettings().hasDebugFlag(0);

    document.getElementById('cbxDebugResponse').checked
      = account.getSettings().hasDebugFlag(1);

    document.getElementById('cbxDebugExceptions').checked
      = account.getSettings().hasDebugFlag(2);

    document.getElementById('cbxDebugStream').checked
      = account.getSettings().hasDebugFlag(3);

    document.getElementById('cbxDebugSession').checked
      = account.getSettings().hasDebugFlag(4);
  }

  function onDebugFlagCommand(sender, bit) {
    if (!gAccount)
      return;

    gAccount.getSettings().setDebugFlag(bit, sender.checked);
  }



  function onDialogLoad() {
    gAccount = window.arguments[0]["SieveAccount"];
    try {
      onServerSheetLoad(gAccount);
      onSecuritySheetLoad(gAccount);
      onProxySheetLoad(gAccount);
      onGeneralSheetLoad(gAccount);
      onAdvancedSheetLoad(gAccount);
      onEditorSheetLoad(gAccount);
      onDebugSheetLoad(gAccount);
    }
    catch (e) {
      Components.utils.reportError(e);
    }
  }

  function onDialogAccept() {
    return true;
    // Do nothing since there should be only valid entries...
  }

  // Function for the general Settings...
  function onKeepAliveCommand(sender) {
    if (!gAccount)
      return;

    gAccount.getSettings().enableKeepAlive(sender.checked);
    enableKeepAlive(sender.checked);
  }

  function onKeepAliveChange(sender) {
    if (!gAccount)
      return;

    gAccount.getSettings().setKeepAliveInterval(sender.value * 1000 * 60);
  }

  function onCompileCommand(sender) {
    if (!gAccount)
      return;

    gAccount.getSettings().enableCompileDelay(sender.checked);
    enableCompile(sender.checked);
  }


  function onCompileChange(sender) {
    if (!gAccount)
      return;

    gAccount.getSettings().setCompileDelay(sender.value);
  }


  /**
   * Opens thunderbird's the password manager dialog
   *
   * The dialog call might be non modal.
   *
   */
  function onShowPassword() {

    let winName = "Toolkit:PasswordManager";
    let uri = "chrome://passwordmgr/content/passwordManager.xul";

    let w = Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow(winName);

    if (w)
      w.focus();
    else
      window.openDialog(uri, winName, "");
    /* else
      Components
        .classes["@mozilla.org/embedcomp/window-watcher;1"]
        .getService(Components.interfaces.nsIWindowWatcher)
        .openWindow(null, uri, name, "chrome,resizable", null);*/
  }

  /**
   * Opens the error / browser console
   *
   */
  function onShowErrorConsole() {

    // The error console was replaced with the HUD...
    // ... so the new way to load the error console is this ridiculous piece of broken bloat...
    try {
      // 59 and up need this code
      let { require } = Components.utils.import("resource://devtools/shared/Loader.jsm", {});
      let { HUDService } = require("devtools/client/webconsole/hudservice");
      HUDService.openBrowserConsoleOrFocus();
    } catch (ex1) {
      try {
        // 52 and up needs this code
        let { require } = Components.utils.import("resource://devtools/shared/Loader.jsm", {});
        let HUDService = require("devtools/client/webconsole/hudservice");
        HUDService.openBrowserConsoleOrFocus();
      }
      catch (ex2) {
        // in case all of the previous failed, we know we are on an really older thunderbird version.
        // so we try to open the classic error console.

        let name = "global:console";
        let uri = "chrome://global/content/console.xul";

        let w = Cc["@mozilla.org/appshell/window-mediator;1"]
          .getService(Ci.nsIWindowMediator)
          .getMostRecentWindow(name);

        if (w) {
          w.focus();
        } else {
          Cc["@mozilla.org/embedcomp/window-watcher;1"]
            .getService(Ci.nsIWindowWatcher)
            .openWindow(null, uri, name, "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar", null);
        }
      }
    }
  }


  function onSocks5RemoteDNSCommand(sender) {
    if (!gAccount)
      return;

    gAccount.getProxy(3).setRemoteDNS(sender.checked);
  }

  function onSocks5HostChange(sender) {
    if (!gAccount)
      return;

    gAccount.getProxy(3).setHost(sender.value);
  }

  function onSocks5PortChange(sender) {
    if (!gAccount)
      return;

    gAccount.getProxy(3).setPort(sender.value);
  }

  function onSocks4HostChange(sender) {
    if (!gAccount)
      return;

    gAccount.getProxy(2).setHost(sender.value);
  }

  function onSocks4PortChange(sender) {
    if (!gAccount)
      return;

    gAccount.getProxy(2).setPort(sender.value);
  }

  /**
   * Click handler for the donate button.
   * Opens a new browser window with the paypal donation website
   *
   */
  function onDonate() {
    let uri = Cc["@mozilla.org/network/io-service;1"]
      .getService(Ci.nsIIOService)
      .newURI("https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=EAS576XCWHKTC", null, null);

    Cc["@mozilla.org/uriloader/external-protocol-service;1"]
      .getService(Ci.nsIExternalProtocolService)
      .loadURI(uri);
  }

  window.addEventListener('error', function (event) {
    Components.utils.reportError(event.error);
  });

  exports.onServerSheetLoad = onServerSheetLoad;
  exports.onHostSelect = onHostSelect;
  exports.onHostnameChange = onHostnameChange;
  exports.onPortSelect = onPortSelect;
  exports.onPortChange = onPortChange;
  exports.onPortAutoSelect = onPortAutoSelect;
  exports.onSecuritySheetLoad = onSecuritySheetLoad;
  exports.onTLSSelect = onTLSSelect;
  exports.onUsernameChange = onUsernameChange;
  exports.onGeneralSheetLoad = onGeneralSheetLoad;
  exports.onProxySheetLoad = onProxySheetLoad;
  exports.onProxySelect = onProxySelect;
  exports.onAdvancedSheetLoad = onAdvancedSheetLoad;
  exports.onAuthorizationSelect = onAuthorizationSelect;
  exports.onAuthorizationChange = onAuthorizationChange;
  exports.onEditorSheetLoad = onEditorSheetLoad;
  exports.onDefaultEditorSelect = onDefaultEditorSelect;
  exports.onIndentionWidthChange = onIndentionWidthChange;
  exports.onIndentionPolicySelect = onIndentionPolicySelect;
  exports.onTabWidthChange = onTabWidthChange;
  exports.onDebugSheetLoad = onDebugSheetLoad;
  exports.onDebugFlagCommand = onDebugFlagCommand;
  exports.onDialogLoad = onDialogLoad;
  exports.onDialogAccept = onDialogAccept;
  exports.onKeepAliveCommand = onKeepAliveCommand;
  exports.onKeepAliveChange = onKeepAliveChange;
  exports.onCompileCommand = onCompileCommand;
  exports.onCompileChange = onCompileChange;
  exports.onShowPassword = onShowPassword;
  exports.onShowErrorConsole = onShowErrorConsole;
  exports.onSocks5RemoteDNSCommand = onSocks5RemoteDNSCommand;
  exports.onSocks5HostChange = onSocks5HostChange;
  exports.onSocks5PortChange = onSocks5PortChange;
  exports.onSocks4HostChange = onSocks4HostChange;
  exports.onSocks4PortChange = onSocks4PortChange;
  exports.onDonate = onDonate;

})(this);
