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

  /* global SieveOverlayUtils */
  /* global Components */
  /* global Services */
  /* global SieveOverlayManager */

  // const Cc = Components.classes;
  // const Ci = Components.interfaces;
  const Cu = Components.utils;

  Cu.import("resource://gre/modules/Services.jsm");
  Cu.import("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");


  class SieveAbstractOverlay {

    constructor() {
      this._callbacks = [];
      this.window = null;
    }

    getWindow() {
      return this.window;
    }

    unloadCallback(callback) {
      this._callbacks.push(callback);
    }

    unload() {
      while (this._callbacks.length)
        this._callbacks.pop()();

      delete this._callbacks;
      delete this.window;
    }
  }



  /**
   * Overlay the main mail window.
   * Injects the menu items as well as the tab window handlers.
   */
  class SieveMailWindowOverlay extends SieveAbstractOverlay {

    addToolBarOverlay(document, filterCmd) {
      let strings = Services.strings.createBundle("chrome://sieve/locale/locale.properties");

      let toolbarbutton = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarbutton");
      toolbarbutton.setAttribute("id", "btnSieveFilter");
      toolbarbutton.setAttribute("label", strings.GetStringFromName("toolbar.filters.title"));
      toolbarbutton.setAttribute("tooltiptext", strings.GetStringFromName("toolbar.filters.tooltip"));
      toolbarbutton.addEventListener("command", filterCmd);
      toolbarbutton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");

      let toolbox = document.getElementById("mail-toolbox");

      SieveOverlayUtils.addToolBarItem(
        document,
        toolbox,
        toolbarbutton);

      SieveOverlayUtils.addStyleSheet(document, "chrome://sieve/skin/ToolBarButton.css");

      this.unloadCallback(
        function () { SieveOverlayUtils.removeStyleSheet(document, "chrome://sieve/skin/ToolBarButton.css"); });

      this.unloadCallback(
        function () { toolbarbutton.removeEventListener("command", filterCmd); });

      this.unloadCallback(
        function () { SieveOverlayUtils.removeToolBarItem(toolbarbutton); });
    }

    addMenuOverlay(document, filterCmd, settingsCmd) {
      let strings = Services.strings.createBundle("chrome://sieve/locale/locale.properties");

      let menu = document.getElementById("filtersCmd");

      let mmuOpenFilters = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuitem");
      mmuOpenFilters.setAttribute("id", "mnuSieveListDialog");
      mmuOpenFilters.setAttribute("label", strings.GetStringFromName("menu.filters"));
      mmuOpenFilters.setAttribute("accesskey", strings.GetStringFromName("menu.filters.key"));
      mmuOpenFilters.addEventListener("command", filterCmd);

      this.unloadCallback(
        function () { mmuOpenFilters.removeEventListener("command", filterCmd); });

      this.unloadCallback(
        function () { SieveOverlayUtils.removeMenuItem(mmuOpenFilters); });

      SieveOverlayUtils.addMenuItem(document, mmuOpenFilters, menu);

      let mnuOpenSettings = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuitem");
      mnuOpenSettings.setAttribute("id", "mnuSieveOptionsDialog");
      mnuOpenSettings.setAttribute("label", strings.GetStringFromName("menu.options"));
      mnuOpenSettings.setAttribute("accesskey", strings.GetStringFromName("menu.options.key"));
      mnuOpenSettings.addEventListener('command', settingsCmd);

      this.unloadCallback(
        function () { mnuOpenSettings.removeEventListener("command", settingsCmd); });

      this.unloadCallback(
        function () { SieveOverlayUtils.removeMenuItem(mnuOpenSettings); });

      SieveOverlayUtils.addMenuItem(document, mnuOpenSettings, menu);


      let mnuSeparator = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuseparator");
      mnuSeparator.setAttribute("id", "mnuSieveSeparator");

      this.unloadCallback(
        function () { SieveOverlayUtils.removeMenuItem(mnuSeparator); });


      SieveOverlayUtils.addMenuItem(document, mnuSeparator, menu);
    }

    addAppMenuOverlay(document, filterCmd, settingsCmd) {
      let appMenu = document.getElementById("appmenu_FilterMenu");

      if (!appMenu)
        return;

      let strings = Services.strings.createBundle("chrome://sieve/locale/locale.properties");

      let appMenuSeparator = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuseparator");
      appMenuSeparator.setAttribute("id", "appMenuSieveSeparator");

      this.unloadCallback(
        function () { SieveOverlayUtils.removeMenuItem(appMenuSeparator); });

      appMenu.appendChild(appMenuSeparator);

      let appMenuOpenFilters = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuitem");
      appMenuOpenFilters.setAttribute("id", "appMenuSieveListDialog");
      appMenuOpenFilters.setAttribute("label", strings.GetStringFromName("menu.filters"));
      appMenuOpenFilters.setAttribute("accesskey", strings.GetStringFromName("menu.filters.key"));
      appMenuOpenFilters.addEventListener("command", filterCmd);

      this.unloadCallback(
        function () { appMenuOpenFilters.removeEventListener("command", filterCmd); });

      this.unloadCallback(
        function () { SieveOverlayUtils.removeMenuItem(appMenuOpenFilters); });

      appMenu.appendChild(appMenuOpenFilters);

      let appMenuOpenSettings = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuitem");
      appMenuOpenSettings.setAttribute("id", "appMenuSieveOptionsDialog");
      appMenuOpenSettings.setAttribute("label", strings.GetStringFromName("menu.options"));
      appMenuOpenSettings.setAttribute("accesskey", strings.GetStringFromName("menu.options.key"));
      appMenuOpenSettings.addEventListener('command', settingsCmd);

      this.unloadCallback(
        function () { appMenuOpenSettings.removeEventListener("command", settingsCmd); });

      this.unloadCallback(
        function () { SieveOverlayUtils.removeMenuItem(appMenuOpenSettings); });

      appMenu.appendChild(appMenuOpenSettings);

    }

    addAppPanelOverlay(document, filterCmd, settingsCmd) {


      let appMenu = document.getElementById("appMenu-filtersView");
      if (!appMenu)
        return;

      let sibling = document.querySelector("#appMenu-filtersView  > .panel-subview-body > toolbarbutton:last-child");

      if (!sibling)
        throw new Error("No Filter Menu Item found...");


      let strings = Services.strings.createBundle("chrome://sieve/locale/locale.properties");

      let appMenuSeparator = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarseparator");
      sibling.parentNode.insertBefore(appMenuSeparator, sibling.nextSibling);

      this.unloadCallback(
        function () { appMenuSeparator.parentNode.removeChild(appMenuSeparator); });


      let appMenuOpenFilters = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarbutton");
      appMenuOpenFilters.setAttribute("id", "appMenuSieveListDialog");
      appMenuOpenFilters.setAttribute("label", strings.GetStringFromName("menu.filters"));
      appMenuOpenFilters.setAttribute("accesskey", strings.GetStringFromName("menu.filters.key"));
      appMenuOpenFilters.setAttribute("class", "subviewbutton subviewbutton-iconic");
      appMenuOpenFilters.addEventListener("command", filterCmd);

      this.unloadCallback(
        function () { appMenuOpenFilters.removeEventListener("command", filterCmd); });

      this.unloadCallback(
        function () { appMenuOpenFilters.parentNode.removeChild(appMenuOpenFilters); });

      sibling.parentNode.insertBefore(appMenuOpenFilters, appMenuSeparator.nextSibling);


      let appMenuOpenSettings = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarbutton");
      appMenuOpenSettings.setAttribute("id", "appMenuSieveOptionsDialog");
      appMenuOpenSettings.setAttribute("label", strings.GetStringFromName("menu.options"));
      appMenuOpenSettings.setAttribute("accesskey", strings.GetStringFromName("menu.options.key"));
      appMenuOpenSettings.setAttribute("class", "subviewbutton subviewbutton-iconic");
      appMenuOpenSettings.addEventListener('command', settingsCmd);

      this.unloadCallback(
        function () { appMenuOpenSettings.removeEventListener("command", settingsCmd); });

      this.unloadCallback(
        function () { appMenuOpenSettings.parentNode.removeChild(appMenuOpenSettings); });

      sibling.parentNode.insertBefore(appMenuOpenSettings, appMenuOpenFilters.nextSibling);
    }

    load(window) {

      if (this.window)
        throw new Error("Already bound to window");

      // We have to import the methods there because they need a valid window reference...
      const { SieveUtils } = SieveOverlayManager.requireModule("./utils/SieveWindowHelper.jsm", window);
      const { SieveTabType } = SieveOverlayManager.requireModule("./utils/SieveTabType.jsm", window);

      this.window = window;

      if (!window.document)
        throw new Error("Window does not have a document");

      let document = window.document;

      // Add Toolbar Overlay
      let onOpenFilterCmd =
        function () { SieveUtils.OpenFilter(document.defaultView); };

      let onOpenSettingsCmd =
        function () { SieveUtils.OpenSettings(document.defaultView); };

      // Add Tabtypes Overlay
      try {
        let tabmail = document.getElementById('tabmail');


        SieveOverlayUtils.addTabType(SieveTabType, tabmail);
        // TODO add finally method when all windows are closed, to unload unused components

        this.unloadCallback(
          () => { SieveOverlayUtils.removeTabType(SieveTabType, tabmail); });
      } catch (ex) {
        Cu.reportError("Failed to register tab type");
        Cu.reportError(ex);
      }

      try {
        this.addToolBarOverlay(document, onOpenFilterCmd);
      } catch (ex) {
        Cu.reportError("Failed to add toolbar item");
        Cu.reportError(ex);
      }


      // Add Menu Overlay
      try {
        this.addMenuOverlay(document, onOpenFilterCmd, onOpenSettingsCmd);
      } catch (ex) {
        Cu.reportError("Failed to add toolbar item");
        Cu.reportError(ex);
      }

      try {
        this.addAppPanelOverlay(document, onOpenFilterCmd, onOpenSettingsCmd);
      } catch (ex) {
        Cu.reportError("Failed to add toolbar item");
        Cu.reportError(ex);
      }

      // AppMenuOverlay
      try {
        this.addAppMenuOverlay(document, onOpenFilterCmd, onOpenSettingsCmd);
      } catch (ex) {
        Cu.reportError("Failed to add toolbar item");
        Cu.reportError(ex);
      }

    }
  }

  // Filter window Overlay...Components

  /**
   * Overlays the toolbar and injects a toolbar button.
   */
  class SieveToolbarOverlay extends SieveAbstractOverlay {

    load(window) {
      if (this.window)
        throw new Error("already bound to window");

      this.window = window;

      let document = window.document;

      SieveOverlayUtils.addStyleSheet(document, "chrome://sieve/skin/ToolBarButton.css");

      this.unloadCallback(
        function () { SieveOverlayUtils.removeStyleSheet(document, "chrome://sieve/skin/ToolBarButton.css"); });
    }
  }


  exports.SieveMailWindowOverlay = SieveMailWindowOverlay;
  exports.SieveToolbarOverlay = SieveToolbarOverlay;

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  exports.EXPORTED_SYMBOLS.push("SieveMailWindowOverlay");
  exports.EXPORTED_SYMBOLS.push("SieveToolbarOverlay");

})(this);
