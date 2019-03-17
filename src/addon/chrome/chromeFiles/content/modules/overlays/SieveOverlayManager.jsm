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

(function (exports) {

  "use strict";

  /* global Components */

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const Cu = Components.utils;

  const CLEANUP_DELAY = 5000;
  const DEBUG = false;

  let SieveOverlayUtils =
  {
    addTabType: function (aTabType, tabmail) {
      if (!tabmail)
        throw new Error("Adding extension failed");

      tabmail.registerTabType(aTabType);
    },

    removeTabType: function (aTabType, tabmail) {
      /* if (tabmail.unregisterTabType)
      {
        tabmail.unregisterTabType(aTabType);

        if (aTabType.name in tabmail.tabTypes)
          throw "error";

        return;
      }*/

      if (!aTabType || !aTabType.name)
        throw new Error("Invalid Tabtype" + aTabType.name);

      if (!tabmail)
        throw new Error("Invalid Tabmail" + tabmail);

      if (!tabmail.tabTypes)
        throw new Error("Invalid tabtypes" + tabmail.tabTypes);

      if ((aTabType.name in tabmail.tabTypes) === false)
        return;

      for (let [modeName] of Object.entries(aTabType.modes)) {
        if (!tabmail.tabModes[modeName])
          continue;

        while (tabmail.tabModes[modeName].tabs.length) {
          // TODO we need a force close here....
          tabmail.closeTab(tabmail.tabModes[modeName].tabs[0], true);
          // Sleep -> Sync
          // TODO close tabs...
        }

        delete tabmail.tabModes[modeName];
      }

      delete tabmail.tabTypes[aTabType.name];

      if (aTabType.name in tabmail.tabTypes)
        throw new Error("Removing Tabtypes failed");
    },

    addToolBarItem: function (document, toolbox, button) {

      toolbox.palette.appendChild(button);

      // now it's getting ugly, the toolbar is already initialzed, so our button
      // is missing.

      // At first we are looking for toolbars containing a currentset
      // attribute with our id. The current set attribute is used to restore
      // the toolbar and does not change.
      let toolbars = document.querySelectorAll('toolbar[currentset*="' + button.id + '"]');

      // we need to loop through all toolbars as querySelector's can't match
      // attributes containing kommas. So we have to do that on our own.
      for (let i = 0; i < toolbars.length; i++) {
        let currentset = toolbars[i].getAttribute("currentset").split(",");
        let pos = currentset.indexOf("" + button.id);

        if (pos === -1)
          continue;

        let sib = null;
        let offset = 0;

        // we are now looking for the element directly behind us...
        while (pos < currentset.length - 1) {
          pos++;

          // these types are hardcoded in toolbar.xml and have no real Id
          // so we have no chance to find them. So we need a hack...
          switch (currentset[pos]) {
            case "separator":
            case "spring":
            case "spacer":
              offset++;
              continue;
          }

          // ... all other elements can be found.
          let sel = "#" + currentset[pos];

          sib = toolbars[i].querySelector(sel);

          if (sib)
            break;
        }

        if (!sib && offset) {
          sib = toolbars[i].lastChild;
          offset--;
        }

        while (sib && offset--)
          sib = sib.previousSibling;

        toolbars[i].insertItem("" + button.id, sib);
      }
    },

    removeToolBarItem: function (item) {
      item.parentNode.removeChild(item);
    },

    addMenuItem: function (document, item, sibling) {
      sibling.parentNode.insertBefore(item, sibling);
    },

    removeMenuItem: function (item) {
      item.parentNode.removeChild(item);
    },

    addStyleSheet: function (document, url) {
      let style = document.createProcessingInstruction(
        "xml-stylesheet",
        'href="' + url + '" "type="text/css"');
      document.insertBefore(style, document.documentElement);
    },

    removeStyleSheet: function (document, url) {
      for (let stylesheet of document.styleSheets) {
        if (stylesheet.href !== url)
          continue;

        stylesheet.ownerNode.parentNode.removeChild(stylesheet.ownerNode);
      }
    }
  };


  let SieveOverlayManager =
  {
    _overlays: [],
    _overlayUrls: {},

    _unload: new Map(),

    scripts: new Map(),
    listeners: new Set(),

    cleanupTimer: Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer),

    /**
     * Converts a XUL Window into a DOMWindow
     *
     * @param {nsIXULWindow} xulWindow
     *   the xul window which should be converted.
     *
     * @returns {nsIDOMWindow}
     *   the dom window
     */
    _getWindow: function (xulWindow) {
      // Starting TB63 a xul window does not implement the nsIDOMWindow/nsIInterfaceRequestor.
      // The new way is to use the new docShell.domWindow member. But this is not available
      // on older TB Versions, so that we need both implementations.
      if (xulWindow.docShell && xulWindow.docShell.domWindow)
        return xulWindow.docShell.domWindow;
      return xulWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
    },


    log: function (str) {
      if (typeof (DEBUG) === "undefined" || DEBUG !== true)
        return;

      Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService)
        .logStringMessage(str);
    },

    addUnloadHook: function (win, uri) {

      // Conect the window with the script...
      if (this.scripts.has(uri) === false)
        this.scripts.set(uri, new Set());


      this.scripts.get(uri).add(win);

      // Next add an on close listener...
      // ... but one listener per window is more than enough.
      if (this.listeners.has(win))
        return;

      let that = this;

      win.addEventListener("unload", function _callback(ev) {

        that.log(`On Unload Event`);
        if (ev && (ev.target.defaultView !== win))
          return;

        win.removeEventListener("unload", _callback, false);

        that.listeners.delete(win);
        that.onUnload(win);
      });

      this.listeners.add(win);
    },

    /**
     * Called when a window is unloaded.
     * It removes the window from the watch and triggers a cleanup.
     *
     * The cleanup not instantanious instead it will be delayed by
     * few seconds to give the sieve protocol some time to cleanup.
     *
     * @param {Window} win
     *   the window which was unloaded.
     *
     */
    onUnload: function (win) {

      this.log(`Unloading ${win.location.href}`);
      // Remove all reverence to the window
      this.scripts.forEach((windows, uri) => {
        if (!windows.has(win))
          return;

        this.log(`Removing ${uri} from ${win.location.href}`);
        windows.delete(win);
      });

      this.log(`Resetting cleanup timer`);
      // Tigger tigger timeout...
      this.cleanupTimer.cancel();
      // then restart the timeout timer with a 5 second delay.
      this.cleanupTimer.initWithCallback(
        this, CLEANUP_DELAY,
        Ci.nsITimer.TYPE_ONE_SHOT);
    },

    /**
     * Checks the refcounting if there are any unused script.
     * And removes them if needed
     *
     */
    cleanup: function () {
      this.log(`Doing cleanup`);

      this.scripts.forEach((windows, uri) => {
        if (windows.size !== 0)
          return;

        this.log(`Unloading ${uri}, it is no more in use.`);
        Cu.unload(uri);

        this.scripts.delete(uri);
      });
    },

    /**
     * Callback handler needed by the timer implementation.
     * Do not invoke it manually
     * @param {nsITimer} timer
     *   the timer instance which caused this notification.
     *
     */
    notify: function (timer) {
      if (this.cleanupTimer !== timer)
        return;

      this.cleanupTimer.cancel();
      this.cleanup();
    },

    requireModule: function (uri, win) {
      if (uri.startsWith(".")) {
        uri = "chrome://sieve/content/modules" + uri.substring(1);
      }

      this.log(`Load ${uri} from ${win.location.href}`);

      let scope = {};
      Cu.import(uri, scope);

      if (typeof (win) !== "undefined" && win !== null)
        this.addUnloadHook(win, uri);

      return scope;
    },

    // nsIWindowMediatorListener functions

    /**
     * Called when a new window is opened
     * @param {nsIXULWindow} xulWindow
     *   the new xul window which was opened
     *
     *
     */
    onOpenWindow: function (xulWindow) {

      let domWindow = SieveOverlayManager._getWindow(xulWindow);

      // Wait for it to finish loading
      domWindow.addEventListener("load", function listener() {
        domWindow.removeEventListener("load", listener, false);

        SieveOverlayManager.loadOverlay(domWindow);

      }, false);
    },

    /**
     * Called when a window is closed
     * @param {nsIXULWindow} xulWindow
     *   the xul window which was closed
     *
     *
     */
    onCloseWindow: function (xulWindow) {
    },

    onUnloadWindow: function (aWindow) {

      SieveOverlayManager.unloadWatcher(aWindow);

      this.log("OnUnloadWindow");

      // we mutate the array thus we interate backwards...
      for (let i = SieveOverlayManager._overlays.length - 1; i >= 0; i--) {
        if (SieveOverlayManager._overlays[i].window !== aWindow)
          continue;

        SieveOverlayManager._overlays[i].unload();
        SieveOverlayManager._overlays.splice(i, 1);
      }

      // Every time a window unloads we trigger this method...
      // ... to ensure the window gets cleaned
      this.onUnload(aWindow);
    },

    onWindowTitleChange: function (window, newTitle) { },

    /**
     * Add a load watcher to the given xul window.
     *
     * @param {nsIXULWindow} xulWindow
     *   the xul window which should be monitored
     *
     *
     */
    loadWatcher: function (xulWindow) {

      if (SieveOverlayManager._unload.has(xulWindow))
        return;

      SieveOverlayManager._unload.set(xulWindow, function (aEvent) {
        let xulWindow = aEvent.currentTarget;

        SieveOverlayManager.onUnloadWindow(
          SieveOverlayManager._getWindow(xulWindow));
      });

      xulWindow.addEventListener("unload", SieveOverlayManager._unload.get(xulWindow));
    },

    /**
     * Removes the unload wtach from the given xul window.
     *
     * @param {nsIXULWindow} xulWindow
     *   the xul for which the monitoring should be stopped
     *
     *
     */
    unloadWatcher: function (xulWindow) {

      if (typeof (xulWindow) === "undefined") {

        // In case no window is specified we clean everything...
        this._unload.forEach((value, key) => {
          this.unloadWatcher(key);
        });

        this._unload.clear();
        return;
      }

      if (SieveOverlayManager._unload.has(xulWindow))
        xulWindow.removeEventListener("unload", SieveOverlayManager._unload.get(xulWindow));

      SieveOverlayManager._unload.delete(xulWindow);
    },

    // ...
    addOverlay: function (overlay, url) {
      if (!this._overlayUrls[url])
        this._overlayUrls[url] = [];

      this._overlayUrls[url].push(overlay);
    },

    loadOverlay: function (window) {
      let url = window.document.baseURI;

      if (!this._overlayUrls[url])
        return;

      SieveOverlayManager.loadWatcher(window);

      for (let i = 0; i < this._overlayUrls[url].length; i++) {
        let overlay = new (this._overlayUrls[url][i])();
        this._overlays.push(overlay);
        overlay.load(window);
      }
    },

    load: function () {
      // Step 2: Inject code into UI
      let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
        .getService(Ci.nsIWindowMediator);

      let windows = wm.getEnumerator(null);
      while (windows.hasMoreElements()) {
        let domWindow = windows.getNext();
        SieveOverlayManager.loadOverlay(domWindow);
      }

      // Wait for any new browser windows to open
      wm.addListener(this);
    },


    /**
     * Forces Unloading all loaded components.
     *
     */
    unload: function () {
      let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
        .getService(Ci.nsIWindowMediator);

      while (this._overlays.length)
        this._overlays.pop().unload();

      wm.removeListener(this);

      SieveOverlayManager.unloadWatcher();

      this.cleanupTimer.cancel();

      this.scripts.forEach((windows, uri) => {
        Cu.unload(uri);

        windows.clear();
        this.scripts.delete(uri);
      });

      delete this._overlayUrls;
    }
  };

  exports.SieveOverlayUtils = SieveOverlayUtils;
  exports.SieveOverlayManager = SieveOverlayManager;

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  exports.EXPORTED_SYMBOLS.push("SieveOverlayUtils");
  exports.EXPORTED_SYMBOLS.push("SieveOverlayManager");

})(this);
