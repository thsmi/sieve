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
/* global SieveOverlayManager */
/* global clearTimeout */
/* global Services */

(function (exports) {

  // Enable Strict Mode
  "use strict";

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const Cu = Components.utils;

  Cu.import("resource://gre/modules/Services.jsm");

  Cu.import("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");

  let { SieveConnections } = SieveOverlayManager.requireModule("./sieve/SieveConnectionManager.jsm", window);
  let { require } = SieveOverlayManager.requireModule("./sieve/SieveRequire.jsm", window);

  let { SieveAccountManager } = require("./settings/SieveMozAccounts.js");
  let { SieveAbstractChannel } = require("./SieveAbstractChannel.js");

  let textEditor = null;
  let gBackHistory = [];
  let gForwardHistory = [];

  let gEditorStatus = {
    checkScriptDelay: 200,
    checkScriptTimer: null,

    persistedScript: null,

    closeListener: null,

    sidebar: true,

    checksum: {
      // used to detect if the script was changed via a gui...
      gui: null,
      // used to detect if the script changed upon a reconnect
      // the script's serverside checksum
      server: null
    }
  };


  function SieveFilterEditor() {
    SieveAbstractChannel.call(this);
  }

  SieveFilterEditor.prototype = Object.create(SieveAbstractChannel.prototype);
  SieveFilterEditor.prototype.constructor = SieveFilterEditor;

  SieveFilterEditor.prototype.getConnection
    = function () {
      return SieveConnections;
    };

  SieveFilterEditor.prototype.onChannelReady
    = function (cid) {
      // We observe only our channel...
      if (cid !== this._cid)
        return;

      let that = this;
      let event = {
        onError: function (reponse) {
          // Script does not exists, or was deleted

          // if we have a server checksum, we are reconnecting and our
          // editor contains valid data. A typical scenario is having
          // an unsaved script, losing the connection and then clicking
          // on reconnect.
          if (gEditorStatus.checksum.server) {

            that.getScriptAsync((script) => { that.onScriptLoaded(script); });
            return;
          }

          if (gEditorStatus.persistedScript) {
            that.onScriptLoaded(gEditorStatus.persistedScript);
            return;
          }

          // if not use the default script
          let date = new Date();
          let script = "#\r\n# " + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "\r\n#\r\n";
          that.onScriptLoaded(script);
        }
      };

      this.trySendRequest((channel) => {
        channel.getScript(this.getScriptName(), this, event);
      });
    };

  SieveFilterEditor.prototype.onChannelClosed
    = function (cid) {
      // some other channel died we don't care about that...
    };

  SieveFilterEditor.prototype._calcChecksum
    = function (str) {

      // Convert to byte Array
      let data = new Uint8Array(new TextEncoder("UTF-8").encode(str));
      data = Array.prototype.slice.call(data);

      let ch = Cc["@mozilla.org/security/hash;1"]
        .createInstance(Ci.nsICryptoHash);

      ch.init(ch.SHA512);
      ch.update(data, data.length);

      let hash = ch.finish(false);

      // convert the binary hash data to a hex string.
      return Array.from(hash,
        function (cur, idx) { return ("0" + hash.charCodeAt(idx).toString(16)).slice(-2); }).join("");
    };

  SieveFilterEditor.prototype.onGetScriptResponse
    = function (response) {

      let that = this;
      let remoteScript = response.getScriptBody();

      this.getScriptAsync((localScript) => {

        // The server checksum is empty, so we have nothing to compare, which means...
        // ...the script was never loaded
        if (!gEditorStatus.checksum.server) {
          that.onScriptLoaded(remoteScript);
          return;
        }

        let remoteCheckSum = that._calcChecksum(remoteScript);
        let localCheckSum = that._calcChecksum(localScript);

        // The server side script is equal to out current script. We are perfectly
        // in sync. And do not need to do anything...
        if (remoteCheckSum === localCheckSum) {
          that.onScriptLoaded(localScript);
          return;
        }

        // The server side script is equal to our last save. So no third party changed
        // anything. We can be sure the local script is newer.
        if (remoteCheckSum === gEditorStatus.checksum.server) {
          that.onScriptLoaded(localScript);
          return;
        }

        // not so good. We got out of sync, we can't descide which one is newer...
        that.onStatusChange(10, { local: localScript, remote: remoteScript });
      });
    };

  SieveFilterEditor.prototype.onPutScriptResponse
    = function (response) {
      let that = this;

      // the script was updated, which means we need to update the checksum...
      this.getScriptAsync(function (script) {

        if (!document.getElementById('btnViewSource').checked) {
          textEditor.setScript(script);
          // Update the gui checksum...
          gEditorStatus.checksum.gui = that._calcChecksum(script);
        }

        // ... and the editor checksum
        gEditorStatus.checksum.server = that._calcChecksum(script);

        that.setScriptName();

        // check if tab is in the progress of closing
        if (!gEditorStatus.closeListener)
          return;

        // eslint-disable-next-line no-use-before-define
        if (closeTab())
          return;
      });
    };

  SieveFilterEditor.prototype.onCheckScriptResponse
    = function (response) {
      let strings = Services.strings.createBundle("chrome://sieve/locale/locale.properties");

      if (!response.hasError()) {
        // TODO: The response might contain warnings, parse them
        document.getElementById("lblErrorBar").firstChild.nodeValue
          = strings.GetStringFromName("syntax.ok");

        document.getElementById("imgErrorBar").src
          = "chrome://sieve/content/images/syntax-ok.png";

        return;
      }

      // CHECKSCRIPT or PUTSCRIPT failed and the server rejected the script...
      // ... most likely because of syntax errors.
      //
      // In case we used the PUTSCRIPT hack, we don't need to delete the...
      // ... temporary script because it was never stored on the server, due...
      // ... to this error...

      // we got an overquota warning, this means syntaxcheck can't be performed
      if (response.getResponseCode().equalsCode("QUOTA")) {

        document.getElementById("lblErrorBar").firstChild.nodeValue
          = strings.GetStringFromName("syntax.quota");

        document.getElementById("imgErrorBar").src
          = "chrome://sieve/content/images/syntax-warning.png";

        return;
      }


      document.getElementById("lblErrorBar").firstChild.nodeValue
        = response.getMessage();

      document.getElementById("imgErrorBar").src
        = "chrome://sieve/content/images/syntax-error.png";

      return;
    };

  // *********************
  // Custom Methods

  SieveFilterEditor.prototype.onScriptLoaded
    = function (script) {
      this.onStatusChange(0);
      gEditorStatus.persistedScript = null;

      let that = this;

      textEditor.loadScript(script, function () {

        if (gEditorStatus.checksum.server === null) {
          gEditorStatus.checksum.server = that._calcChecksum(script);
          that.setScriptName();
        }

        textEditor.focus();
      });


      let account = SieveAccountManager.getAccountByName(gEditorStatus.account);

      let settings = {};

      settings.tab = {};
      settings.tab.width = account.getSettings().getTabWidth();

      settings.indention = {};
      settings.indention.width = account.getSettings().getIndentionWidth();
      settings.indention.policy = account.getSettings().getIndentionPolicy();

      textEditor.setOptions(settings);
    };

  SieveFilterEditor.prototype.observe
    = function (aSubject, aTopic, aData) {
      if (aTopic === "quit-application-requested") {
        // we are asychnonous, so need to trigger the event if we are done...
        let callback = function () {
          let cancelQuit = Cc["@mozilla.org/supports-PRBool;1"]
            .createInstance(Ci.nsISupportsPRBool);
          Services.obs.notifyObservers(cancelQuit, "quit-application-requested", aData);

          // Something aborted the quit process.
          if (cancelQuit.data)
            return;

          // TODO if aData == restart add flag Ci.nsIAppStartup.eRestart
          Cc["@mozilla.org/toolkit/app-startup;1"]
            .getService(Ci.nsIAppStartup)
            .quit(Ci.nsIAppStartup.eAttemptQuit);
        };

        if (asyncCloseTab(callback) === false)
          aSubject.QueryInterface(Ci.nsISupportsPRBool).data = true;

        return;
      }

      SieveAbstractChannel.prototype.observe.call(this, aSubject, aTopic, aData);
    };


  SieveFilterEditor.prototype.onStatusChange
    = function (state, message) {

      if (state === 0) {
        document.getElementById("sivEditorStatus").setAttribute('hidden', 'true');
        document.getElementById('dkView').removeAttribute('collapsed');
        return;
      }

      // The rest has to be redirected to the status window...
      document.getElementById('dkView').setAttribute('collapsed', 'true');
      document.getElementById("sivEditorStatus").contentWindow.onStatus(state, message);
      document.getElementById("sivEditorStatus").removeAttribute('hidden');
    };


  SieveFilterEditor.prototype.getScript
    = function (editor) {
      if (gEditorStatus.persistedScript)
        return gEditorStatus.persistedScript;

      if (!editor)
        editor = document.getElementById("sivEditor2").contentWindow.editor.getValue();

      // Thunderbird scrambles linebreaks to single \n so we have to fix that
      if (editor) {
        // eslint-disable-next-line no-control-regex
        editor = editor.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");
      }

      if (document.getElementById('btnViewSource').checked)
        return editor;

      let widget = Components.utils
        .waiveXrays(document.getElementById("sivWidgetEditor").contentWindow)
        .getSieveScript();

      if (this._calcChecksum(widget) === gEditorStatus.checksum.gui)
        return editor;

      return widget;
    };

  SieveFilterEditor.prototype.getScriptAsync
    = function (callback) {

      if (!callback)
        return;

      if (gEditorStatus.persistedScript) {
        callback(gEditorStatus.persistedScript);
        return;
      }

      // In case it's the source we return the plaintext editor...
      if (document.getElementById('btnViewSource').checked) {

        textEditor.getScript((script) => {
          // Sanatize the line breaks to a single \n. Thunderbird scrambles them sometimes...

          // eslint-disable-next-line no-control-regex
          script = script.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");

          callback(script);
        });

        return;
      }

      let widget = Components.utils
        .waiveXrays(document.getElementById("sivWidgetEditor").contentWindow)
        .getSieveScript();

      callback(widget);
    };

  SieveFilterEditor.prototype.hasChanged
    = function () {

      if (gEditorStatus.checksum.server === null)
        return true;

      if (this._calcChecksum(this.getScript()) === gEditorStatus.checksum.server)
        return false;

      return true;
    };


  SieveFilterEditor.prototype.saveScript
    = function (scriptName, content) {

      if (typeof (scriptName) === "undefined")
        scriptName = this.getScriptName();

      if (typeof (content) === "undefined") {

        // We postpone the call. First we get the script from the editor,
        // and then call the method again...
        this.getScriptAsync((script) => { this.saveScript(scriptName, script); });
        return;
      }

      let event = {
        onError: function (response) {
          Cc["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Ci.nsIPromptService)
            .alert(window, "Error", "The script could not be saved:\n\n" + response.getMessage());

          // If save failes during shutdown we have to abort it...
          gEditorStatus.closeListener = null;
        }
      };


      this.trySendRequest((channel) => {
        channel.putScript(scriptName, content, this, event);
      });
    };

  SieveFilterEditor.prototype.setScriptName
    = function (scriptName) {
      if (typeof (scriptName) !== "undefined")
        this._scriptName = scriptName;

      let title = this.getScriptName() + " - Sieve Filters";


      if (this.hasChanged())
        title = "*" + title;

      if (document.title !== title)
        document.title = title;
    };

  SieveFilterEditor.prototype.getScriptName
    = function () {
      return this._scriptName;
    };



  let gSFE = new SieveFilterEditor();


  /**
   *
   */
  function onCompile() {
    gSFE.getScriptAsync((script) => { gSFE.checkScript(script); });
  }


  /**
   * Called up on each editor input and resets the checkscript timer
   *
   */
  function onInput() {
    // TODO update change status more lazilys
    gSFE.setScriptName();

    // on every keypress we reset the timeout
    if (gEditorStatus.checkScriptTimer !== null) {
      clearTimeout(gEditorStatus.checkScriptTimer);
      gEditorStatus.checkScriptTimer = null;
    }

    if (document.getElementById("btnCompile").checked)
      gEditorStatus.checkScriptTimer = setTimeout(function () { onCompile(); }, gEditorStatus.checkScriptDelay);
  }

  /**
   * Called by thunderbird. And needs to return the persistance information
   * in order to restore a tab in case of a crash.
   *
   * @returns {*}
   *   the arguments which are needed to restore this window.
   *   They have to be JSON serializable
   */
  function onWindowPersist() {
    let args = {};

    args["compile"] = document.getElementById('btnCompile').checked;
    args["account"] = gEditorStatus.account;

    // the script cannot be canged in the editor
    args["scriptName"] = window.arguments[0].wrappedJSObject["scriptName"];

    // we do not persist upon shutdown, the user already descided wether we
    // wants to keep the script or not. We need this only in case of a crash
    if (gSFE && !gEditorStatus.closeListener) {
      args["scriptBody"] = gSFE.getScript();
      args["checksumServer"] = gEditorStatus.checksum.server;
    }

    return args;
  }


  let sivEditorListener = {
    onChange: function () {
      onInput();
    },

    onStringFound: function () {
      document.getElementById("boxSearchError").setAttribute('hidden', 'true');
    }
  };


  const KEY_CODE_ENTER = 13;
  /**
   * A generic key event filter.
   * Checks if the user pressed the enter key in a textbox.
   * If so it triggers the callback.
   *
   * @param {Event} event
   *   the keydown event.
   * @param {Function} callback
   *   the callback event which should be invoked.
   *
   */
  function onEnterKeyPress(event, callback) {

    if (event.keyCode !== KEY_CODE_ENTER)
      return;

    callback();
  }


  /**
   * Callback handler for the find button in the search dialog
   *
   */
  function onFindString() {
    document.getElementById("boxSearchError").removeAttribute('hidden');

    let token = document.getElementById("txtToken").value;

    let isReverse = !!document.getElementById('cbxBackward').checked;
    let isCaseSensitive = document.getElementById('cbxCaseSensitive').checked;

    textEditor.findString(token, isCaseSensitive, isReverse);

    return;
  }

  /**
   * Callback handler for the replace button in the search dialog
   *
   */
  function onReplaceString() {
    document.getElementById("boxSearchError").removeAttribute('hidden');

    let oldToken = document.getElementById("txtToken").value;

    // We can skip in case the old token is empty.
    if (oldToken === "")
      return;

    let newToken = document.getElementById("txtReplace").value;

    let isReverse = !!document.getElementById('cbxBackward').checked;
    let isCaseSensitive = document.getElementById('cbxCaseSensitive').checked;

    textEditor.replaceString(oldToken, newToken, isCaseSensitive, isReverse);

    return;
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

  /**
   *
   * @param {*} visible
   * @param {*} aNoUpdate
   */
  function onViewSource(visible, aNoUpdate) {
    if (typeof (visible) === "undefined")
      visible = document.getElementById('btnViewSource').checked;

    let deck = document.getElementById('dkView');

    if (visible) {
      // show Source
      deck.selectedIndex = 0;
      onSideBar(gEditorStatus.sidebar);
      onErrorBar(document.getElementById('btnCompile').hasAttribute("checked"));

      document.getElementById("btnViewSource").setAttribute('checked', 'true');

      document.getElementById("btnUndo").removeAttribute('disabled');
      document.getElementById("btnRedo").removeAttribute('disabled');
      document.getElementById("btnCut").removeAttribute('disabled');
      document.getElementById("btnCopy").removeAttribute('disabled');
      document.getElementById("btnPaste").removeAttribute('disabled');
      document.getElementById("btnCompile").removeAttribute('disabled');
      document.getElementById("btnSearchBar").removeAttribute('disabled');
      document.getElementById('btnReference').removeAttribute('disabled');

      document.getElementById("sivEditor2").focus();

      let script = Components.utils
        .waiveXrays(document.getElementById("sivWidgetEditor").contentWindow)
        .getSieveScript();

      // GUI did not change so se can skip...
      if (aNoUpdate || (gEditorStatus.checksum.gui === gSFE._calcChecksum(script)))
        return;

      textEditor.setScript(script);

      onInput();
      return;
    }

    document.getElementById("btnViewSource").removeAttribute('checked');

    document.getElementById("btnUndo").setAttribute('disabled', "true");
    document.getElementById("btnRedo").setAttribute('disabled', "true");
    document.getElementById("btnCut").setAttribute('disabled', "true");
    document.getElementById("btnCopy").setAttribute('disabled', "true");
    document.getElementById("btnPaste").setAttribute('disabled', "true");
    document.getElementById("btnCompile").setAttribute('disabled', "true");
    document.getElementById("btnSearchBar").setAttribute('disabled', "true");
    document.getElementById('btnReference').setAttribute('disabled', "true");

    onSearchBar(false);
    onErrorBar(false, true);

    gEditorStatus.sidebar = document.getElementById('btnReference').checked;
    onSideBar(false);

    deck.selectedIndex = 1;

    // Finally we need to transfer the current script from the editor into the gui...
    textEditor.getScript(function (script) { updateWidgets(script); });
  }

  /**
   *
   * @param {*} script
   */
  function updateWidgets(script) {

    try {
      let capabilities = SieveConnections
        .getChannel(gSFE._sid, gSFE._cid).getExtensions();

      // set script content...
      Components.utils
        .waiveXrays(document.getElementById("sivWidgetEditor").contentWindow)
        .setSieveScript(script, JSON.stringify(capabilities));

      // ... and create a shadow copy
      gEditorStatus.checksum.gui = gSFE._calcChecksum(
        Components.utils
          .waiveXrays(document.getElementById("sivWidgetEditor").contentWindow)
          .getSieveScript());
    }
    catch (ex) {
      // Cu.reportError(ex);
      // throw ex;
      alert("Error while parsing script.\n\n" + ex);
      // switching to souce view failed
      onViewSource(true, true);
    }
  }

  /**
   *
   * @param {*} loading
   */
  function onSideBarLoading(loading) {
    if (loading)
      document.getElementById("dkSideBarBrowser").selectedIndex = 1;
    else
      document.getElementById("dkSideBarBrowser").selectedIndex = 0;
  }

  const MAX_HISTORY = 20;
  /**
   *
   * @param {*} uri
   */
  function onSideBarGo(uri) {
    onSideBarLoading(true);

    gBackHistory.push(uri);

    if (gBackHistory.length > MAX_HISTORY)
      gBackHistory.shift();

    if (gBackHistory.length === 1)
      document.getElementById("btnSideBarBack").setAttribute('disabled', "true");
    else
      document.getElementById("btnSideBarBack").removeAttribute('disabled');

    if (gForwardHistory.length === 0)
      document.getElementById("btnSideBarForward").setAttribute('disabled', "true");
    else
      document.getElementById("btnSideBarForward").removeAttribute('disabled');

    /* if (document.getElementById("ifSideBar").addEventListener)
      document.addEventListener(
        "DOMContentLoaded", function(event) { onSideBarLoading(false); }, false);*/
    if (document.getElementById("ifSideBar").addEventListener)
      document.getElementById("ifSideBar").addEventListener(
        "DOMContentLoaded", function () { onSideBarLoading(false); }, false);

    document.getElementById("ifSideBar").setAttribute('src', uri);
  }

  /**
   *
   * @param {*} event
   */
  function onSideBarBrowserClick(event) {
    let href = null;

    if (event.target.nodeName === "A")
      href = event.target.href;
    else if (event.target.parentNode.nodeName === "A")
      href = event.target.parentNode.href;
    else
      return;

    event.preventDefault();

    if (gForwardHistory.length !== 0)
      gForwardHistory = [];

    onSideBarGo(href);
  }

  /**
   *
   */
  function onSideBarBack() {
    // store the current location in the history...
    gForwardHistory.push(gBackHistory.pop());
    // ... and go back to the last page
    onSideBarGo(gBackHistory.pop());
  }

  /**
   *
   */
  function onSideBarForward() {
    onSideBarGo(gForwardHistory.pop());
  }

  /**
   *
   */
  function onSideBarHome() {
    if (gForwardHistory.length !== 0)
      gForwardHistory = [];

    let url = document.getElementById("ifSideBar").getAttribute('data-home');
    onSideBarGo(url);
  }

  /**
   * Called when the user clicks on the save button.
   *
   */
  function onSave() {
    gSFE.saveScript();
  }

  /**
   *
   * @param {} callback
   * @returns {boolean}
   *   true if a synchonous shutdown was successfull
   *   false if shutdown was canceled or asynchnous shutdown started and
   *   the callback will be invoked
   */
  function asyncCloseTab(callback) {
    // We are already closed...
    if (!gSFE)
      return true;

    if (!gSFE.hasChanged()) {
      // eslint-disable-next-line no-use-before-define
      return closeTab();
    }

    if (!gSFE.isActive())
      gEditorStatus.closeListener = null;

    if (gEditorStatus.closeListener)
      return false;

    // we need to wait for user feedback...
    let prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Ci.nsIPromptService);

    let strings = Services.strings.createBundle("chrome://sieve/locale/locale.properties");

    // The flags 393733 equals [Save] [Don't Save] [Cancel]
    let result =
      prompts.confirmEx(
        window, strings.GetStringFromName("edit.save.title"),
        strings.GetStringFromName("edit.save.description"), 393733,
        "", "", "", null, { value: false });

    // cancel clicked...
    if (result === 1)
      return false;

    // don't save clicked...
    if (result !== 0)
      return closeTab();

    gEditorStatus.closeListener = callback;
    onSave();

    return false;
  }

  /**
   * Closes the tab, does not prompt if it should be saved or not...
   * @returns {boolean}
   *   true if the tab can be close otherwise false
   */
  function closeTab() {
    try {
      Cc["@mozilla.org/observer-service;1"]
        .getService(Ci.nsIObserverService)
        .removeObserver(gSFE, "quit-application-requested");
    }
    catch (ex) { }

    clearTimeout(gEditorStatus.checkScriptTimer);

    try {
      gSFE.disconnect();
    }
    catch (ex) { }

    gSFE = null;

    // we need to unlock the close function, otherwise we might endup in a
    // deadlock
    if (gEditorStatus.closeListener)
      gEditorStatus.closeListener();
    // we need to null the listener before calling it otherwise we could
    // enup in an endless loop...
    /* var callback = gEditorStatus.closeListener;
     gEditorStatus.closeListener = null;

     if (callback)
        callback();*/

    gEditorStatus.closeListener = null;
    return true;
  }

  /**
   *
   */
  function onDoImport(filePicker, rv) {

    if (rv !== Ci.nsIFilePicker.returnOK)
      return;

    let inputStream = Cc["@mozilla.org/network/file-input-stream;1"]
      .createInstance(Ci.nsIFileInputStream);
    let scriptableStream = Cc["@mozilla.org/scriptableinputstream;1"]
      .createInstance(Ci.nsIScriptableInputStream);

    inputStream.init(filePicker.file, 0x01, parseInt("0444", 8), null);
    scriptableStream.init(inputStream);

    // todo insert imported snipplet instead of replacing the whole script
    let script = scriptableStream.read(scriptableStream.available());

    scriptableStream.close();
    inputStream.close();

    textEditor.replaceSelection(script);

    onInput();

  }

  /**
   *
   */
  function onImport() {

    let filePicker = Cc["@mozilla.org/filepicker;1"]
      .createInstance(Ci.nsIFilePicker);

    filePicker.appendFilter("Sieve Scripts (*.siv)", "*.siv");
    filePicker.appendFilter("All Files (*.*)", "*.*");
    filePicker.init(window, "Import Sieve Script", filePicker.modeOpen);

    filePicker.open(function (rv) { onDoImport(filePicker, rv); });
  }

  /**
   *
   * @param {*} filePicker
   * @param {*} rv
   */
  function onDoExport(filePicker, rv) {

    if ((rv !== filePicker.returnOK) && (rv !== filePicker.returnReplace))
      return;

    gSFE.getScriptAsync(function (data) {
      let file = filePicker.file;

      if (file.exists() === false)
        file.create(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt("0644", 8));

      let outputStream = Cc["@mozilla.org/network/file-output-stream;1"]
        .createInstance(Ci.nsIFileOutputStream);

      outputStream.init(file, 0x04 | 0x08 | 0x20, parseInt("0644", 8), null);


      outputStream.write(data, data.length);
      outputStream.close();
    });

  }

  /**
   *
   */
  function onExport() {
    let filePicker = Cc["@mozilla.org/filepicker;1"]
      .createInstance(Ci.nsIFilePicker);

    filePicker.defaultExtension = ".siv";
    filePicker.defaultString = gSFE.getScriptName() + ".siv";

    filePicker.appendFilter("Sieve Scripts (*.siv)", "*.siv");
    filePicker.appendFilter("Text Files (*.txt)", "*.txt");
    filePicker.appendFilter("All Files (*.*)", "*.*");
    filePicker.init(window, "Export Sieve Script", filePicker.modeSave);

    filePicker.open(function (rv) { onDoExport(filePicker, rv); });
  }

  /**
   *
   * @param {*} visible
   * @param {*} aSilent
   */
  function onErrorBar(visible, aSilent) {
    if (typeof (visible) === "undefined" || visible === null)
      visible = document.getElementById('btnCompile').checked;

    if (visible) {
      if (!aSilent)
        document.getElementById("btnCompile").setAttribute('checked', 'true');

      document.getElementById('spErrorBar').removeAttribute('hidden');
      document.getElementById('vbErrorBar').removeAttribute('hidden');

      onCompile();

      return;
    }

    clearTimeout(gEditorStatus.checkScriptTimer);
    gEditorStatus.checkScriptTimer = null;

    if (!aSilent)
      document.getElementById("btnCompile").removeAttribute('checked');

    document.getElementById("vbErrorBar").setAttribute('hidden', 'true');
    document.getElementById('spErrorBar').setAttribute('hidden', 'true');
    return;
  }

  /**
   * Shows the Sidebar containing the Sieve Reference.
   */
  function onSideBarShow() {
    document.getElementById('btnReference').setAttribute('checked', 'true');
    document.getElementById('spSideBar').removeAttribute('hidden');
    document.getElementById('vbSidebar').removeAttribute('hidden');

    return;
  }

  /**
   *
   */
  function onSearchBar(visible) {
    if (typeof (visible) === "undefined" || visible === null)
      visible = document.getElementById('btnSearchBar').checked;

    if (visible) {
      onSideBar(true);

      document.getElementById('btnSearchBar').setAttribute('checked', 'true');
      document.getElementById('vbSearchBar').removeAttribute('hidden');

      return;
    }

    document.getElementById('vbSearchBar').setAttribute('hidden', 'true');
    document.getElementById('btnSearchBar').removeAttribute('checked');
    return;
  }

  /**
   * Shows the Sidebar containing the Sieve Reference
   *
   */
  function onSideBarHide() {
    document.getElementById('btnReference').removeAttribute('checked');
    document.getElementById('spSideBar').setAttribute('hidden', 'true');
    document.getElementById('vbSidebar').setAttribute('hidden', 'true');

    onSearchBar(false);

    return;
  }

  /**
   *
   * @param {*} visible
   */
  function onSideBar(visible) {
    if (typeof (visible) === "undefined" || visible === null)
      visible = document.getElementById('btnReference').checked;

    if (visible)
      onSideBarShow();
    else
      onSideBarHide();

    return;
  }

  /**
   *
   */
  function onKeepLocalScript() {
    gSFE.onScriptLoaded(gSFE.getScript());
  }

  /**
   *
   * @param {*} script
   */
  function onUseRemoteScript(script) {
    gSFE.onScriptLoaded(script);
  }


  /**
   *
   */
  function onEditorShowMenu() {
    let callback = function (status) {

      if (status.canCut)
        document.getElementById("ctxCut").removeAttribute("disabled");
      else
        document.getElementById("ctxCut").setAttribute("disabled", "true");

      if (status.canCopy)
        document.getElementById("ctxCopy").removeAttribute("disabled");
      else
        document.getElementById("ctxCopy").setAttribute("disabled", "true");

      if (status.canPaste)
        document.getElementById("ctxPaste").removeAttribute("disabled");
      else
        document.getElementById("ctxPaste").setAttribute("disabled", "true");

      if (status.canDelete)
        document.getElementById("ctxDelete").removeAttribute("disabled");
      else
        document.getElementById("ctxDelete").setAttribute("disabled", "true");

      if (status.canUndo)
        document.getElementById("ctxUndo").removeAttribute("disabled");
      else
        document.getElementById("ctxUndo").setAttribute("disabled", "true");
    };

    textEditor.getStatus(callback);
  }

  /**
   */
  function onDelete() {
    textEditor.replaceSelection();
  }

  /**
   */
  function onSelectAll() {
    textEditor.selectAll();
  }

  /**
   *
   */
  function onWindowLoad() {
    textEditor = new net.tschmid.sieve.editor.text.Client("sivEditor2");
    textEditor.setListener(sivEditorListener);

    // hack to prevent links to be opened in the default browser window...
    document.getElementById("ifSideBar")
      .addEventListener("click", (event) => { onSideBarBrowserClick(event); }, false);

    let url = "resource://sieve-addon/libSieve/SieveGui.html";
    document.getElementById("sivWidgetEditor")
      .setAttribute("src", url);

    let args = window.arguments[0].wrappedJSObject;
    gEditorStatus.account = args["account"];

    let account = SieveAccountManager.getAccountByName(gEditorStatus.account);

    document.getElementById("sivEditorStatus").contentWindow
      .onAttach(account,
        function () { gEditorStatus.closeListener = null; gSFE.connect(account); },
        {
          onUseRemote: function (script) { onUseRemoteScript(script); },
          onKeepLocal: function () { onKeepLocalScript(); }
        });

    // There might be a default or persisted script...
    if (args["scriptBody"])
      gEditorStatus.persistedScript = args["scriptBody"];

    if (args["checksumServer"])
      gEditorStatus.checksum.server = args["checksumServer"];


    gEditorStatus.checkScriptDelay = account.getSettings().getCompileDelay();

    gSFE.setScriptName(args["scriptName"]);

    document.getElementById("lblErrorBar").firstChild.nodeValue
      = Services.strings
        .createBundle("chrome://sieve/locale/locale.properties")
        .GetStringFromName("syntax.ok");

    gSFE.onStatusChange(3, "status.loading");

    gSFE.connect(account);

    // preload sidebar...
    onSideBarHome();

    if (!args["compile"])
      args["compile"] = account.getSettings().hasCompileDelay();

    onErrorBar(args["compile"]);
    onSideBar(true);
    onSearchBar(false);
    /* onViewSource(true);*/

    Cc["@mozilla.org/observer-service;1"]
      .getService(Ci.nsIObserverService)
      .addObserver(gSFE, "quit-application-requested", false);

    /* window.addEventListener("unload", function() {
          Cc["@mozilla.org/observer-service;1"]
            .getService (Ci.nsIObserverService)
            .removeObserver(gSFE, "quit-application-requested");
        }, false);*/
  }

  exports.onCompile = onCompile;
  exports.onInput = onInput;
  exports.onEnterKeyPress = onEnterKeyPress;
  exports.onFindString = onFindString;
  exports.onReplaceString = onReplaceString;
  exports.onWindowLoad = onWindowLoad;
  exports.onDonate = onDonate;
  exports.onViewSource = onViewSource;
  exports.onSideBarBrowserClick = onSideBarBrowserClick;
  exports.onSideBarBack = onSideBarBack;
  exports.onSideBarForward = onSideBarForward;
  exports.onSideBarHome = onSideBarHome;
  exports.onSave = onSave;
  exports.onDoImport = onDoImport;
  exports.onImport = onImport;
  exports.onDoExport = onDoExport;
  exports.onExport = onExport;
  exports.onErrorBar = onErrorBar;
  exports.onSearchBar = onSearchBar;
  exports.onSideBar = onSideBar;

  exports.onEditorShowMenu = onEditorShowMenu;
  exports.onDelete = onDelete;
  exports.onSelectAll = onSelectAll;

  // used by the tab type...
  exports.onWindowPersist = onWindowPersist;
  exports.asyncCloseTab = asyncCloseTab;
  exports.closeTab = closeTab;
})(this);
