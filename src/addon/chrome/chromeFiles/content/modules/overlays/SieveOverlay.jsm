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
  /* global document */
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

    load(window) {
      if (this.window)
        throw new Error("Already bound to window");

      // We have to import the methods there because they need a valid window reference...
      const { SieveUtils } = SieveOverlayManager.requireModule("./utils/SieveWindowHelper.jsm", window);
      const { SieveTabType } = SieveOverlayManager.requireModule("./utils/SieveTabType.jsm", window);

      this.window = window;

      let document = window.document;

      let strings = Services.strings.createBundle("chrome://sieve/locale/locale.properties");
      // Add Toolbar Overlay
      let onOpenFilterCmd =
        function () { SieveUtils.OpenFilter(document.defaultView); };

      let onOpenSettingsCmd =
        function () { SieveUtils.OpenSettings(document.defaultView); };

      // Add Tabtypes Overlay
      let tabmail = document.getElementById('tabmail');


      SieveOverlayUtils.addTabType(SieveTabType, tabmail);
      // TODO add finally method when all windows are closed, to unload unused components

      this.unloadCallback(
        function () { SieveOverlayUtils.removeTabType(SieveTabType, tabmail); });

      let toolbarbutton = document.createElement("toolbarbutton");
      toolbarbutton.setAttribute("id", "btnSieveFilter");
      toolbarbutton.setAttribute("label", strings.GetStringFromName("toolbar.filters.title"));
      toolbarbutton.setAttribute("tooltiptext", strings.GetStringFromName("toolbar.filters.tooltip"));
      toolbarbutton.addEventListener("command", onOpenFilterCmd);
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
        function () { toolbarbutton.removeEventListener("command", onOpenFilterCmd); });

      this.unloadCallback(
        function () { SieveOverlayUtils.removeToolBarItem(toolbarbutton); });


      // Add Menu Overlay

      let menu = document.getElementById("filtersCmd");

      let mmuOpenFilters = document.createElement("menuitem");
      mmuOpenFilters.setAttribute("id", "mnuSieveListDialog");
      mmuOpenFilters.setAttribute("label", strings.GetStringFromName("menu.filters"));
      mmuOpenFilters.setAttribute("accesskey", strings.GetStringFromName("menu.filters.key"));
      mmuOpenFilters.addEventListener("command", onOpenFilterCmd);

      this.unloadCallback(
        function () { mmuOpenFilters.removeEventListener("command", onOpenFilterCmd); });

      this.unloadCallback(
        function () { SieveOverlayUtils.removeMenuItem(mmuOpenFilters); });

      SieveOverlayUtils.addMenuItem(document, mmuOpenFilters, menu);


      let mnuOpenSettings = document.createElement("menuitem");
      mnuOpenSettings.setAttribute("id", "mnuSieveOptionsDialog");
      mnuOpenSettings.setAttribute("label", strings.GetStringFromName("menu.options"));
      mnuOpenSettings.setAttribute("accesskey", strings.GetStringFromName("menu.options.key"));
      mnuOpenSettings.addEventListener('command', onOpenSettingsCmd);

      this.unloadCallback(
        function () { mnuOpenSettings.removeEventListener("command", onOpenSettingsCmd); });

      this.unloadCallback(
        function () { SieveOverlayUtils.removeMenuItem(mnuOpenSettings); });

      SieveOverlayUtils.addMenuItem(document, mnuOpenSettings, menu);


      let mnuSeparator = document.createElement("menuseparator");
      mnuSeparator.setAttribute("id", "mnuSieveSeparator");

      this.unloadCallback(
        function () { SieveOverlayUtils.removeMenuItem(mnuSeparator); });


      SieveOverlayUtils.addMenuItem(document, mnuSeparator, menu);

      // AppMenuOverlay

      let appMenu = document.getElementById("appmenu_FilterMenu");

      if (!appMenu)
        return;

      let appMenuSeparator = document.createElement("menuseparator");
      appMenuSeparator.setAttribute("id", "appMenuSieveSeparator");

      this.unloadCallback(
        function () { SieveOverlayUtils.removeMenuItem(appMenuSeparator); });

      appMenu.appendChild(appMenuSeparator);

      let appMenuOpenFilters = document.createElement("menuitem");
      appMenuOpenFilters.setAttribute("id", "appMenuSieveListDialog");
      appMenuOpenFilters.setAttribute("label", strings.GetStringFromName("menu.filters"));
      appMenuOpenFilters.setAttribute("accesskey", strings.GetStringFromName("menu.filters.key"));
      appMenuOpenFilters.addEventListener("command", onOpenFilterCmd);

      this.unloadCallback(
        function () { appMenuOpenFilters.removeEventListener("command", onOpenFilterCmd); });

      this.unloadCallback(
        function () { SieveOverlayUtils.removeMenuItem(appMenuOpenFilters); });

      appMenu.appendChild(appMenuOpenFilters);

      let appMenuOpenSettings = document.createElement("menuitem");
      appMenuOpenSettings.setAttribute("id", "appMenuSieveOptionsDialog");
      appMenuOpenSettings.setAttribute("label", strings.GetStringFromName("menu.options"));
      appMenuOpenSettings.setAttribute("accesskey", strings.GetStringFromName("menu.options.key"));
      appMenuOpenSettings.addEventListener('command', onOpenSettingsCmd);

      this.unloadCallback(
        function () { appMenuOpenSettings.removeEventListener("command", onOpenSettingsCmd); });

      this.unloadCallback(
        function () { SieveOverlayUtils.removeMenuItem(appMenuOpenSettings); });

      appMenu.appendChild(appMenuOpenSettings);

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
