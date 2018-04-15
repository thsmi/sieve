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

  const { SieveUtils } = SieveOverlayManager.requireModule("./utils/SieveWindowHelper.jsm", window);
  const { SieveTabType } = SieveOverlayManager.requireModule("./utils/SieveTabType.jsm", window);


  function SieveAbstractOverlay() {
    this._callbacks = [];
    this.window = null;
  }

  SieveAbstractOverlay.prototype.getWindow
    = function () {
      return this.window;
    };

  SieveAbstractOverlay.prototype.unloadCallback
    = function (callback) {
      this._callbacks.push(callback);
    };

  SieveAbstractOverlay.prototype.unload
    = function () {
      while (this._callbacks.length)
        this._callbacks.pop()();

      delete this._callbacks;
      delete this.window;
    };

  /**
   * Overlays the message filter window.
   * Injects an additional tab with sieve message filters.
   * @constructor
   */
  function SieveFilterListOverlay() {
    SieveAbstractOverlay.call(this);
  }

  // Inherrit from SieveAbstractOverlay...
  SieveFilterListOverlay.prototype = Object.create(SieveAbstractOverlay.prototype);
  SieveFilterListOverlay.prototype.constructor = SieveFilterListOverlay;


  SieveFilterListOverlay.prototype.loadAccount
    = function (server) {
      let document = this.window.document;
      if (!server)
        server = document.getElementById("serverMenu").selectedItem._folder.server;

      if (!server)
        return false;

      if ((server.type !== "imap") && (server.type !== "pop3")) {
        document.getElementById("sivFilterList").tabs.getItemAtIndex(1).collapsed = true;
        document.getElementById("sivFilterList").selectedIndex = 0;

        return true;
      }

      document.getElementById("sivFilterList").tabs.getItemAtIndex(1).collapsed = false;

      // we initialize sieve just in time in oder to save resources...
      if (document.getElementById("sivFilterList").selectedIndex !== 1)
        return true;

      let key = "" + server.key;

      let iframe = document.getElementById('sivFilterListFrame');

      if (iframe.getAttribute("key") === key)
        return true;



      /*  if (iframe.contentWindow)
          if (iframe.contentWindow.onCanChangeAccount(key) == false)
            return true;

        //'DOMContentLoaded'
        // 'DOMFrameContentLoaded'
        iframe.addEventListener('load', function iframeReady(ev) {

          document.getElementById('sivFilterListFrame')
            .removeEventListener('load',iframeReady,true)

          document.getElementById('sivFilterListFrame')
            .contentWindow.onLoad(key);

          }, true);*/


      /* document.getElementById('sivFilterListFrame').src =
        document.getElementById('sivFilterListFrame').src;*/
      /* document.getElementById('sivFilterListFrame').contentDocument
        .location.reload(true);*/

      /* document.getElementById('sivFilterListFrame').contentWindow
        .location.reload(true);*/
      if (iframe.hasAttribute("src"))
        iframe.contentWindow.location.reload();
      else
        iframe.setAttribute("src", "chrome://sieve/content/filterList/SieveFilterList.xul");

      iframe.setAttribute("key", key);

      /* document.getElementById("sivFilterListFrame")
        .contentWindow.onAccountChange(server.key); */

      return true;
    };

  SieveFilterListOverlay.prototype.load
    = function (window) {
      Cu.reportError("load overlay filter list 1");

      if (this.window)
        throw new Error("Already bound to window");

      let that = this;
      this.window = window;

      let document = window.document;
      Cu.import("chrome://sieve/content/modules/utils/SieveWindowHelper.jsm");


      let dialog = window.document.getElementById("filterListDialog");

      let grid = document.getElementsByTagName("grid");

      // there should be exactly one grid otherwise we collided with some other...
      // ... extension. In order to avoid incompatibilies, we show an error...
      // ... message and skip ...
      if (grid.length !== 1) {
        let elm = document.createElement("hbox");
        elm.setAttribute("align", "center");
        elm.style.backgroundImage = "-moz-linear-gradient(center bottom , rgb(255, 221, 102), rgb(255, 235, 125))";
        elm.style.borderTop = "1pt solid #fff1a3";
        elm.style.borderBottom = "1pt solid #c0972e";
        elm.style.margin = "0pt";
        elm.style.padding = "0.7em";
        elm.style.marginBottom = "1em";

        elm.appendChild(document.createElement("hbox"));
        elm.lastChild.setAttribute("flex", "1");

        elm.lastChild.appendChild(document.createElement("description"));
        elm.lastChild.lastChild.setAttribute("value", "Initializing Server Side Filters failed!");
        elm.lastChild.lastChild.style.fontWeight = "bold";

        elm.lastChild.appendChild(document.createElement("description"));
        elm.lastChild.lastChild.setAttribute("value", "Please report bug to schmid-thomas@gmx.net");

        dialog.insertBefore(elm, dialog.firstChild);

        this.unloadCallback(
          function () { elm.parentNode.removeChild(elm); });

        return;
      }

      // setup all listeners before binding...
      let folderChangeListener = function (event) {
        let folder = event.target._folder;

        if (!folder.server) {
          // FIXME
          alert("Incompatible folder");
          return;
        }
        that.loadAccount(folder.server);
      };

      let tabSelectListener = function () {
        that.loadAccount();
      };

      let filterListListener = function (event) {
        if (that.loadAccount())
          event.currentTarget.removeEventListener('select', filterListListener, false);
      };


      // start modifiying the UI
      grid = grid.item(0);

      // create the tabbox...
      let elm = document.createElement("tabbox");
      elm.setAttribute("id", "sivFilterList");
      elm.setAttribute("flex", "1");
      elm.style.padding = "5px";
      elm.style.paddingBottom = "0px";

      // ... and insert it before the grid ...
      grid.parentNode.insertBefore(elm, grid);

      // ... then create the tabs ...
      let tabs = elm.appendChild(document.createElement("tabs"));
      tabs.addEventListener("select", tabSelectListener, true);

      this.unloadCallback(
        function () { tabs.removeEventListener("select", tabSelectListener, true); });

      tabs.appendChild(document.createElement("tab"));
      tabs.lastChild.setAttribute("label", "Local Filters");

      tabs.appendChild(document.createElement("tab"));
      tabs.lastChild.setAttribute("label", "Server side filters");
      tabs.lastChild.collapsed = true;

      // ... finally the corresponding tabpanels...
      let tabpanels = elm.appendChild(document.createElement("tabpanels"));

      // ... the first one is the grid element, so we move this element into...
      // ... tabbox...
      tabpanels.setAttribute("flex", "1");
      tabpanels.appendChild(grid);

      // ... then we add the iframe for our sieve scripts...
      tabpanels.appendChild(document.createElement("iframe"));
      tabpanels.lastChild.setAttribute("flex", "1");
      tabpanels.lastChild.setAttribute("type", "chrome");
      tabpanels.lastChild.setAttribute("id", "sivFilterListFrame");
      tabpanels.lastChild.setAttribute("style",
        "overflow:auto; -moz-appearance: textfield;");

      this.unloadCallback(
        function () { elm.parentNode.removeChild(elm); });

      this.unloadCallback(
        function () { elm.parentNode.insertBefore(grid, elm); });

      let menu = document.getElementById("serverMenu");
      menu.addEventListener("command", folderChangeListener, true);

      this.unloadCallback(
        function () { menu.removeEventListener("command", folderChangeListener, true); });

      // When the server Menu gets populated the first time no command event is...
      // ... fired thus we need this hack. We listen to the filter list's selection...
      // ... changes and wait until the menu is populated.
      let filterList = document.getElementById("filterList");

      filterList.addEventListener("select", filterListListener, false);

      this.unloadCallback(
        function () { filterList.removeEventListener("select", filterListListener, false); });
      // Ensure the first tab is selected...
      elm.selectedIndex = 0;

      Cu.reportError("load overlay filter list ");
    };


  /**
   * Overlay the main mail window.
   * Injects the menu items as well as the tab window handlers.
   * @constructor
   */
  function SieveMailWindowOverlay() {
    SieveAbstractOverlay.call(this);
  }

  SieveMailWindowOverlay.prototype = Object.create(SieveAbstractOverlay.prototype);
  SieveMailWindowOverlay.prototype.constructor = SieveMailWindowOverlay;


  SieveMailWindowOverlay.prototype.load
    = function (window) {
      if (this.window)
        throw new Error("Already bound to window");

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

    };

  // Filter window Overlay...Components

  /**
   * Overlays the toolbar and injects a toolbar button.
   * @constructor
   */
  function SieveToolbarOverlay() {
    SieveAbstractOverlay.call(this);
  }

  SieveToolbarOverlay.prototype = Object.create(SieveAbstractOverlay.prototype);
  SieveToolbarOverlay.prototype.constructor = SieveToolbarOverlay;


  SieveToolbarOverlay.prototype.load
    = function (window) {
      if (this.window)
        throw new Error("already bound to window");

      this.window = window;

      let document = window.document;

      SieveOverlayUtils.addStyleSheet(document, "chrome://sieve/skin/ToolBarButton.css");

      this.unloadCallback(
        function () { SieveOverlayUtils.removeStyleSheet(document, "chrome://sieve/skin/ToolBarButton.css"); });
    };


  exports.SieveMailWindowOverlay = SieveMailWindowOverlay;
  exports.SieveToolbarOverlay = SieveToolbarOverlay;

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  exports.EXPORTED_SYMBOLS.push("SieveMailWindowOverlay");
  exports.EXPORTED_SYMBOLS.push("SieveToolbarOverlay");

})(this);
