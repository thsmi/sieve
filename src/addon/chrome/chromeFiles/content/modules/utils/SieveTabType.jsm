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

  /* globals Components */

  const Cu = Components.utils;

  let SieveTabType =
    {
      name: "SieveExplorerTab",
      perTabPanel: "iframe",

      modes: {
        SieveExplorerTab: {
          type: "SieveExplorerTab",
          maxTabs: 1,

          openTab: function (aTab, aArgs) {
            aTab.title = "Loading...";

            aArgs.wrappedJSObject = aArgs;
            aTab.panel.contentWindow.arguments = [aArgs];

            this._addListeners(aTab);

            // this is nasty, we don't have a document object in our scope...
            // ... we we have to retrive it manually...
            /*      aTab.panel.contentWindow.tabmail
                    = aTab.panel.ownerDocument.getElementById("tabmail");*/

            aTab.panel.setAttribute("src", "chrome://sieve/content/editor/SieveFilterExplorer.xul");
          },

          closeTab: function (aTab) {
            delete aTab.panel.contentWindow.tabmail;
            this._removeListeners(aTab);
          },

          persistTab: function (aTab) {
            return {
              account: aTab.panel.contentWindow.getSelectedAccount().getUri()
            };
          },

          restoreTab: function (aTabmail, aPersistedState) {
            aTabmail.openTab("SieveExplorerTab", { server: aPersistedState.account });
          }
        },

        SieveEditorTab: {
          type: "SieveEditorTab",

          openTab: function (aTab, aArgs) {
            aTab.title = "Loading...";

            if (aArgs["uri"])
              aTab.uri = aArgs["uri"];

            aArgs.wrappedJSObject = aArgs;
            aTab.panel.contentWindow.arguments = [aArgs];

            this._addListeners(aTab);

            aTab.panel.setAttribute("src", "chrome://sieve/content/editor/SieveFilterEditor.xul");
          },

          closeTab: function (aTab) {
            this._removeListeners(aTab);
          },

          persistTab: function (aTab) {
            if (!aTab.panel.contentWindow.onWindowPersist)
              return null;

            let args = aTab.panel.contentWindow.onWindowPersist();

            if (aTab.uri)
              args["uri"] = aTab.uri;

            return args;
          },

          restoreTab: function (aTabmail, aPersitedState) {
            aTabmail.openTab("SieveEditorTab", aPersitedState);
          }
        }
      },

      showTab: function onShowTab(aTab) {
        // aTab.panel.setAttribute("type", "content-primary");
      },

      saveTabState: function onSaveTabState(aTab) {
      },

      onTitleChanged: function (aTab, aTabNode) {
        /* Cu.reportError("OnTitleChanged"+aTab.panel.contentWindow.document.title); */
        aTab.title = aTab.panel.contentWindow.document.title;
        aTab.busy = false;
      },

      tryCloseTab: function (aTab) {
        let callback = function () {
          aTab.panel.ownerDocument.getElementById("tabmail").closeTab(aTab);
        };

        if (aTab.panel.contentWindow.asyncCloseTab)
          return aTab.panel.contentWindow.asyncCloseTab(callback);

        // we need a catch exceptions. Otherwise we could endup in case of with
        // an unclosable tab...
        try {
          if (!aTab.panel.contentWindow.closeTab())
            return false;
        }
        catch (ex) {
          Cu.reportError("Unclosable tab" + ex);
        }
        return true;
      },

      _addListeners: function (aTab) {
        function onDOMTitleChanged(aEvent) {
          aTab.title = aTab.panel.contentWindow.document.title;
          aTab.panel.ownerDocument.getElementById("tabmail").setTabTitle(aTab);
        }
        // Save the function we'll use as listener so we can remove it later.
        aTab.titleListener = onDOMTitleChanged;

        function onWindowClose(aEvent) {
          if (!aTab.panel.contentWindow.asyncCloseTab)
            return true;

          // We continue closing the window...
          let callback = function () {
            aTab.panel.ownerDocument.defaultView.close();
          };

          if (!aTab.panel.contentWindow.asyncCloseTab(callback)) {
            aEvent.preventDefault();
            return false;
          }

          return true;
        }
        // Save the function we'll use as listener so we can remove it later.
        aTab.closeListener = onWindowClose;


        // Add the listeners
        aTab.panel.addEventListener("DOMTitleChanged", aTab.titleListener, true);

        aTab.panel.ownerDocument.defaultView.addEventListener("close", aTab.closeListener);
      },

      _removeListeners: function (aTab) {

        if (aTab.titleListener)
          aTab.panel.removeEventListener("DOMTitleChanged", aTab.titleListener, true);

        if (aTab.closeListener)
          aTab.panel.ownerDocument.defaultView.removeEventListener("close", aTab.closeListener);

        aTab.titleListener = null;
        aTab.closeListener = null;
      }

    };

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  exports.SieveTabType = SieveTabType;
  exports.EXPORTED_SYMBOLS.push("SieveTabType");

})(this);
