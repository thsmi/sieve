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
  /* global accountManager */

  const Cu = Components.utils;
  const Cc = Components.classes;
  const Ci = Components.interfaces;



  let SieveUtils =
    {
      OpenFilter: function (window, server) {
        if (typeof (server) === "undefined" || server === null)
          server = this.GetActiveServer(window);

        let options = {};

        if (server !== null)
          options = { server: server.rootMsgFolder.baseMessageURI.slice(15) };

        options.wrappedJSObject = options;

        // We have to check if the explorer view is already open.
        // If so we switch to it
        let mediator = Cc["@mozilla.org/appshell/window-mediator;1"]
          .getService(Ci.nsIWindowMediator);

        let w = mediator.getXULWindowEnumerator(null);

        while (w.hasMoreElements()) {
          let win = w.getNext();
          let docShells = win
            .QueryInterface(Ci.nsIXULWindow).docShell
            .getDocShellEnumerator(Ci.nsIDocShellTreeItem.typeChrome, Ci.nsIDocShell.ENUMERATE_FORWARDS);

          while (docShells.hasMoreElements()) {
            let childDoc = docShells.getNext()
              .QueryInterface(Ci.nsIDocShell)
              .contentViewer.DOMDocument;

            if (childDoc.location.href !== "chrome://sieve/content/editor/SieveFilterExplorer.xul")
              continue;

            let tabmail = win.docShell.contentViewer.DOMDocument.getElementById("tabmail");

            if (!tabmail)
              continue;

            if (!tabmail.tabModes.SieveExplorerTab)
              continue;

            if (!tabmail.tabModes.SieveExplorerTab.tabs.length)
              continue;

            tabmail.switchToTab(tabmail.tabModes.SieveExplorerTab.tabs[0]);

            let view = tabmail.tabModes.SieveExplorerTab.tabs[0].panel.contentWindow;
            view.onSelectAccount(server);
            view.focus();

            return;
          }
        }

        // It's not open, so we have to open the view. It's a bit more tricky,
        // as tabmail does only exist in mail:3pane windows.

        // First try The window object...
        let tabmail = window.document.getElementById("tabmail");

        if (!tabmail) {
          // .. then we try the most recent 3pane window
          let mail3PaneWindow = Cc["@mozilla.org/appshell/window-mediator;1"]
            .getService(Ci.nsIWindowMediator)
            .getMostRecentWindow("mail:3pane");
          if (mail3PaneWindow) {
            tabmail = mail3PaneWindow.document.getElementById("tabmail");
            mail3PaneWindow.focus();
          }
        }

        // and as last resort we create a new mail:3pane window...
        if (!tabmail) {
          window.openDialog("chrome://messenger/content/", "_blank",
            "chrome,dialog=no,all", null,
            {
              tabType: "SieveExplorerTab",
              tabParams: options
            });

          return;
        }

        // we found our tabmail interface!
        tabmail.openTab("SieveExplorerTab", options);
      },

      /**
       * Opens the Account Manager and selects the page to configure sieve
       * settings and preferences.
       *
       * @param {window} window
       *   the parent window.
       * @param {nsIMsgIncomingServer} server
       *   the server which should be configured, can be null.
       *
       */
      OpenSettings: function (window, server) {
        // the accountmanager is modal. We need a parent window!
        if (typeof (window) === "undefined" || window === null)
          throw new Error("Window missing, need an owner for Accountmanager...");

        let windowManager =
          Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);

        let existingAccountManager =
          windowManager.getMostRecentWindow("mailnews:accountmanager");

        if (existingAccountManager) {
          existingAccountManager.focus();
          return;
        }

        let options = {};

        if (typeof (server) === "undefined" || server === null)
          server = this.GetActiveServer(window);

        if (server !== null)
          options = { server: server, selectPage: 'am-sieve-account.xul' };

        window.openDialog("chrome://messenger/content/AccountManager.xul",
          "AccountManager", "chrome,centerscreen,titlebar,modal",
          options);
      },

      /**
       * Retrieves the currently focused nsIMsgIncomingServer object. If the user
       * has not focused an server, it returns the default. In case no Server is
       * configured, null is returned.
       *
       * @param {window} window
       *   reference to a dom window.
       * @returns {nsIMsgIncomingServer}
       *   the active server or null
       */
      GetActiveServer: function (window) {
        try {
          // check if we got a 3pane window. If not we discard it.
          if (window && (window.document.documentElement))
            if (window.document.documentElement.getAttribute("windowtype") !== "mail:3pane")
              window = null;

          // so let's try to get the most recent 3Pane Window
          if (!window) {
            window = Cc["@mozilla.org/appshell/window-mediator;1"]
              .getService(Ci.nsIWindowMediator)
              .getMostRecentWindow("mail:3pane");
          }

          if (!window)
            return null;

          // this function depends on funtions of the overlayed message window...
          if (typeof (window.GetFirstSelectedMsgFolder) === "undefined")
            return null;

          // As we can access message window functions, we can try to retrieve...
          // ... the currently selected message account
          let server = null;
          let folder = window.GetFirstSelectedMsgFolder();

          if (folder)
            server = folder.server;
          else
            server = accountManager.defaultAccount.incomingServer;

          if ((server.type === "imap") || (server.type === "pop3"))
            return server;
        }
        catch (ex) {
          Cu.reportError(ex);
        }

        return null;
      }
    };

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  exports.SieveUtils = SieveUtils;
  exports.EXPORTED_SYMBOLS.push("SieveUtils");

})(this);
