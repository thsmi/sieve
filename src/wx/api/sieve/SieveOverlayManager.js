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

  const DEBUG = true;

  const MENU_ITEM_LABEL = "Sieve Message Filters";
  const MENU_ITEM_ACCESS_KEY = "S";

  /**
   *
   */
  class SieveAbstractMenuItem {

    constructor(id, parent) {
      this.parentId = parent;
      this.id = id;
    }

    load(document, callback) {

      if (document.getElementById(this.id))
        throw new Error(`Element ${this.id} is already created`);

      const parent = document.getElementById(this.parentId);

      if (!parent)
        throw new Error(`Unknown parent element ${this.parentId}`);

      this.item = this.onLoad(document, callback);

      parent.parentNode.insertBefore(this.item, parent);
    }

    unload() {
      if (!this.item)
        return;

      if (this.onUnload)
        this.onUnload();

      this.item.parentNode.removeChild(this.item);
      this.item = null;
    }
  }

  /**
   *
   */
  class SieveMenuLabel extends SieveAbstractMenuItem {

    constructor(parent, id) {
      super("mnuSieveListDialog", "filtersCmd");
    }

    onLoad(document, callback) {

      const item = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuitem");
      item.setAttribute("id", this.id);
      item.setAttribute("label", MENU_ITEM_LABEL);
      item.setAttribute("accesskey", MENU_ITEM_ACCESS_KEY);

      this.callback = () => { callback(); };
      item.addEventListener("command", this.callback);

      return item;
    }

    onUnload() {
      this.item.removeEventListener("command", this.callback);
    }
  }

  /**
   *
   */
  class SieveMenuSeparator extends SieveAbstractMenuItem {

    /**
     * @inheritdoc
     */
    constructor(parent, id) {
      super("mnuSieveSeparator", "filtersCmd");
    }

    /**
     * @inheritdoc
     */
    onLoad(document) {
      const item = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuseparator");
      item.setAttribute("id", this.id);

      return item;
    }
  }

  class SieveAppMenuItem {

    constructor(parent, id) {
      this.parentId = "appmenu_FilterMenu";
      this.id = "appMenuSieveListDialog";
    }

    load(document, callback) {

      if (this.item)
        throw new Error("Already in use");

      const appMenu = document.getElementById(this.parentId);

      if (!appMenu)
        return;

      this.item = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuitem");
      this.item.setAttribute("id", this.id);
      this.item.setAttribute("label", MENU_ITEM_LABEL);
      this.item.setAttribute("accesskey", MENU_ITEM_ACCESS_KEY);

      appMenu.appendChild(this.item);

      this.callback = () => { callback(); };
      this.item.addEventListener("command", this.callback);
    }

    unload() {
      if (!this.item)
        return;

      this.item.removeEventListener("command", this.callback);
      this.item.parentNode.removeChild(this.item);

      this.item = null;
    }
  }

  class SieveAppMenuSeparator {

    constructor(parent, id) {
      this.parentId = "appmenu_FilterMenu";
      this.id = "appMenuSieveSeparator";
    }

    load(document) {
      if (this.item)
        throw new Error("Already in loaded");

      const appMenu = document.getElementById(this.parentId);

      if (!appMenu)
        return;

      this.item = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuseparator");
      this.item.setAttribute("id", this.id);

      appMenu.appendChild(this.item);
    }

    unload() {
      if (!this.item)
        return;

      this.item.removeEventListener("command", this.callback);
      this.item.parentNode.removeChild(this.item);

      this.item = null;
    }

  }

  class SieveAbstractAppPanelItem {

    constructor(id, parentId) {
      this.id = id;
      this.parentId = parentId;
    }

    /**
     * Loads the overlay into the given document
     * @param {Document} document
     *   the document for which the overlay should be loaded.
     * @param {Function} [callback]
     *   the callback which should be invoked when clicking on the element
     */
    load(document, callback) {
      if (this.item || document.getElementById(this.id))
        throw new Error(`Element ${this.id} already in loaded`);

      const appMenu = document.getElementById(this.parentId);
      if (!appMenu)
        return;

      const appView = document.querySelector(`#${this.parentId}  > .panel-subview-body`);
      if (!appView)
        return;

      const sibling = appView.querySelector(".panel-subview-body > toolbarseparator:last-child,toolbarbutton:last-child");

      if (!sibling)
        throw new Error("No Filter Menu Item found...");

      this.item = this.onLoad(document, callback);

      sibling.parentNode.insertBefore(this.item, sibling.nextSibling);
    }

    /**
     * Loads a new ui element into the given document.
     * @abstract
     *
     * @param {Document} document
     *   the parent document.
     * @param {Function} [callback]
     *   an optional callback function which is executed when clicking
     *   on the element
     * @returns {DOMElement}
     *   the element which should be added to the document
     */
    onLoad(document, callback) {
      throw new Error("Implement me");
    }

    unload() {
      if (!this.item)
        return;

      if (this.onUnload)
        this.onUnload();

      this.item.parentNode.removeChild(this.item);
      this.item = null;
    }
  }

  class SieveAppPanelLabel extends SieveAbstractAppPanelItem {

    constructor(parent, id) {
      super("appMenuSieveListDialog", "appMenu-filtersView");
    }

    /**
     * @inheritdoc
     */
    onLoad(document, callback) {

      const item = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarbutton");
      item.setAttribute("id", this.id);
      item.setAttribute("label", MENU_ITEM_LABEL);
      item.setAttribute("accesskey", MENU_ITEM_ACCESS_KEY);
      item.setAttribute("class", "subviewbutton subviewbutton-iconic");

      this.callback = () => { callback(); };
      item.addEventListener("command", this.callback);

      return item;
    }

    onUnload() {
      this.item.removeEventListener("command", this.callback);
    }
  }

  class SieveAppPanelSeparator extends SieveAbstractAppPanelItem {

    constructor(parent, id) {
      super("appPanelSieveSeparator", "appMenu-filtersView");
    }

    /**
     * @inheritdoc
     */
    onLoad(document) {
      const item = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarseparator");
      item.setAttribute("id", this.id);

      return item;
    }
  }

  class SieveOverlayManager {
    constructor() {
      this._overlays = [];
      this._overlayUrls = {};

      this._unload = new Map();

      this.events = {};
      this.listeners = new Set();

    }

    /**
     * Converts a XUL Window into a DOMWindow
     *
     * @param {nsIXULWindow|nsIAppWindow} appWindow
     *   the xul window which should be converted.
     *
     * @returns {nsIDOMWindow}
     *   the dom window
     */
    _getWindow(appWindow) {
      // Starting TB63 a xul window does not implement the nsIDOMWindow/nsIInterfaceRequestor.
      // The new way is to use the new docShell.domWindow member. But this is not available
      // on older TB Versions, so that we need both implementations.
      if (appWindow.docShell && appWindow.docShell.domWindow)
        return appWindow.docShell.domWindow;

      return appWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
    }

    log(str) {
      if (typeof (DEBUG) === "undefined" || DEBUG !== true)
        return;

      Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService)
        .logStringMessage(str);
    }

    // nsIWindowMediatorListener functions

    /**
     * Called when a new window is opened
     * @param {nsIXULWindow|nsIAppWindow} appWindow
     *   the new xul window which was opened
     *
     *
     */
    onOpenWindow(appWindow) {

      const domWindow = this._getWindow(appWindow);

      // In case the window is already loaded, we missed the load event.
      // So we need to call the method directly...
      if (domWindow.document.readyState === "complete") {
        this.loadOverlay(domWindow);
        return;
      }

      // ... otherwise we need to wait until it finished loading.
      domWindow.addEventListener("load", () => {
        this.loadOverlay(domWindow);
      }, { once: true });
    }

    /**
     * Called when a window is closed
     * @param {nsIXULWindow|nsIAppWindow} appWindow
     *   the xul window which was closed
     *
     *
     */
    onCloseWindow(appWindow) {
    }

    onUnloadWindow(aWindow) {

      this.unloadWatcher(aWindow);

      this.log("OnUnloadWindow");

      // we mutate the array thus we iterate backwards...
      for (let i = this._overlays.length - 1; i >= 0; i--) {

        const windowId = aWindow.windowUtils.outerWindowID;

        // FIXME overlay should store a window id instead of  window
        if (this._overlays[i].windowId !== windowId)
          continue;

        this.log("OnUnloadWindow Overlay");

        this._overlays[i].unload();
        this._overlays.splice(i, 1);
      }
    }

    onWindowTitleChange(window, newTitle) { }

    /**
     * Add a load watcher to the given xul window.
     *
     * @param {nsIXULWindow|nsIAppWindow} appWindow
     *   the xul window which should be monitored
     *
     *
     */
    loadWatcher(appWindow) {

      if (this._unload.has(appWindow))
        return;

      this._unload.set(appWindow, (aEvent) => {
        this.onUnloadWindow(
          this._getWindow(aEvent.currentTarget));
      });

      appWindow.addEventListener("unload", this._unload.get(appWindow));
    }

    /**
     * Removes the unload watch from the given xul window.
     *
     * @param {nsIXULWindow|nsIAppWindow} appWindow
     *   the xul for which the monitoring should be stopped
     *
     *
     */
    unloadWatcher(appWindow) {

      if (typeof (appWindow) === "undefined") {

        // In case no window is specified we clean everything...
        this._unload.forEach((value, key) => {
          this.unloadWatcher(key);
        });

        this._unload.clear();
        return;
      }

      if (this._unload.has(appWindow))
        appWindow.removeEventListener("unload", this._unload.get(appWindow));

      this._unload.delete(appWindow);
    }

    addOverlay2() {
      this.addOverlay(() => { return new SieveMenuLabel();}, "chrome://messenger/content/messenger.xul");
      this.addOverlay(() => { return new SieveMenuSeparator(); }, "chrome://messenger/content/messenger.xul");

      this.addOverlay(() => { return new SieveAppMenuItem(); }, "chrome://messenger/content/messenger.xul");
      this.addOverlay(() => { return new SieveAppMenuSeparator(); }, "chrome://messenger/content/messenger.xul");

      this.addOverlay(() => { return new SieveAppPanelSeparator(); }, "chrome://messenger/content/messenger.xul");
      this.addOverlay(() => { return new SieveAppPanelLabel(); }, "chrome://messenger/content/messenger.xul");

      this.addOverlay(() => { return new SieveMenuLabel(); }, "chrome://messenger/content/messenger.xhtml");
      this.addOverlay(() => { return new SieveMenuSeparator(); }, "chrome://messenger/content/messenger.xhtml");
      this.addOverlay(() => { return new SieveAppMenuItem(); }, "chrome://messenger/content/messenger.xhtml");
      this.addOverlay(() => { return new SieveAppMenuSeparator(); }, "chrome://messenger/content/messenger.xhtml");

      this.addOverlay(() => { return new SieveAppPanelSeparator(); }, "chrome://messenger/content/messenger.xhtml");
      this.addOverlay(() => { return new SieveAppPanelLabel(); }, "chrome://messenger/content/messenger.xhtml");
      return this;
    }

    // ...
    addOverlay(overlay, url) {
      if (typeof(overlay) !== "function")
        throw new Error("Overlay is not a function");

      if (!this._overlayUrls[url])
        this._overlayUrls[url] = [];

      this._overlayUrls[url].push(overlay);

      return this;
    }

    loadOverlay(window) {
      const url = window.document.baseURI;

      console.log("Window id" + window.windowUtils.outerWindowID);
      const windowId = window.windowUtils.outerWindowID;

      if (!this._overlayUrls[url])
        return;

      this.loadWatcher(window);

      for (let i = 0; i < this._overlayUrls[url].length; i++) {
        const overlay = this._overlayUrls[url][i]();
        overlay.windowId = windowId;

        this._overlays.push(overlay);
        overlay.load(window.document, () => {
          this.events.onCommand();
        });
      }
    }

    load() {
      // Step 2: Inject code into UI
      const wm = Cc["@mozilla.org/appshell/window-mediator;1"]
        .getService(Ci.nsIWindowMediator);

      const windows = wm.getEnumerator(null);
      while (windows.hasMoreElements()) {
        this.onOpenWindow(windows.getNext());
      }

      // Wait for any new browser windows to open
      wm.addListener(this);
    }


    /**
     * Unloads all currently loaded overlays.
     **/
    unload() {
      const wm = Cc["@mozilla.org/appshell/window-mediator;1"]
        .getService(Ci.nsIWindowMediator);

      while (this._overlays.length)
        this._overlays.pop().unload();

      wm.removeListener(this);

      this.unloadWatcher();

      delete this._overlayUrls;
    }

    /**
     * Registers an event listener
     * @param {string} name
     *   the event's name
     * @param {Function} [callback]
     *   the callback to be invoked,
     *   if undefined the listener gets unregistered.
     */
    on(name, callback) {

      if (name === "command") {
        this.events.onCommand = callback;
        return;
      }

      throw new Error(`Unknown callback handler`);
    }
  }

  exports.SieveOverlayManager = new SieveOverlayManager();

})(module.exports);
