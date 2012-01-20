/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

var gSivExtUtils =
{
  OpenFilters : function(server,parentWin)
  {
    if (typeof(Cc) == 'undefined')
      { Cc = Components.classes; }

    if (typeof(Ci) == 'undefined')
      { Ci = Components.interfaces; }  
    
    if (server == null)
      server = this.GetActiveServer();    
      
    var options = {}
                     
    if (server != null)
      options = { server: server.rootMsgFolder.baseMessageURI.slice(15) }
      
    options.wrappedJSObject = options;

    var mediator = Cc["@mozilla.org/appshell/window-mediator;1"]
          .getService(Ci.nsIWindowMediator);
    
    var w = mediator.getXULWindowEnumerator(null);
    
    while(w.hasMoreElements())
    {
      var win = w.getNext();
      var docShells = win
              .QueryInterface(Ci.nsIXULWindow).docShell
              .getDocShellEnumerator(Ci.nsIDocShellTreeItem.typeChrome,Ci.nsIDocShell.ENUMERATE_FORWARDS);           
        
      while (docShells.hasMoreElements())
      {
        var childDoc = docShells.getNext()
                .QueryInterface(Ci.nsIDocShell)
                .contentViewer.DOMDocument;
  
        if (childDoc.location.href != "chrome://sieve/content/editor/SieveFilterExplorer.xul")
          continue;
          
        var tabmail = win.docShell.contentViewer.DOMDocument.getElementById("tabmail");
       
        if (!tabmail)
          continue;
    
        if (!tabmail.tabModes.SieveExplorerTab)
          continue;

        if (!tabmail.tabModes.SieveExplorerTab.tabs.length)
          continue;
      
        tabmail.switchToTab(tabmail.tabModes.SieveExplorerTab.tabs[0]);
        childDoc.defaultView.QueryInterface(Ci.nsIDOMWindow).focus();
        win
        
        return;
    }
  }

  // opening tabs might be a bit more tricky. Tabmail does only exist in...
  // ... mail:3pane windows, so we have to find one or open one. 
  var tabmail = document.getElementById("tabmail");  
  if (!tabmail)
  {  
    // Try opening new tabs in an existing 3pane window  
    var mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]  
                                  .getService(Components.interfaces.nsIWindowMediator)  
                                  .getMostRecentWindow("mail:3pane");  
    if (mail3PaneWindow)
    {  
    tabmail = mail3PaneWindow.document.getElementById("tabmail");  
    mail3PaneWindow.focus();  
    }
  } 
  
  if (tabmail)                      
    tabmail.openTab("SieveExplorerTab", options);
  else
 -  window.openDialog("chrome://messenger/content/", "_blank",  
                    "chrome,dialog=no,all", null,  
                    { tabType: "SieveExplorerTab",  
                      tabParams: options });    
  return;
   
    var w = null;
    var mediator = Components
            .classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator);
    
    // we allow only one instance of the Filter Explorer Window...
    w =  mediator.getMostRecentWindow("Sieve:FilterExplorer");
    if (w && (typeof(w) != "undefined") &&!w.closed)
    {
      // notify window to switch accounts...
      w.focus();
      return;
    }

    if (server == null)
      server = this.GetActiveServer();      

    var options = {}
                     
    if (server != null)
      options = { server: server.rootMsgFolder.baseMessageURI.slice(15) }
    
    options.wrappedJSObject = options;

    //we need to call nsIWindowWatcher.openWindow with parentWindow set to ...
    //...null, otherwise dialogs are broken on Mac!
     
    Components
        .classes["@mozilla.org/embedcomp/window-watcher;1"]
        .getService(Components.interfaces.nsIWindowWatcher)
        .openWindow(
          null, 
          "chrome://sieve/content/editor/SieveFilterExplorer.xul",
          "Sieve:FilterExplorer", 
          "chrome,resizable,centerscreen,all", options);
           
  },  
  
  
  /**
   * Opens the Account Manager and selects the page to configure sieve
   * settings and preferences. 
   * 
   * @param {nsIMsgIncomingServer}
   *   the server which should be configured, can be null.
   */
  OpenSettings : function (server)
  {
    
//#ifdef POSTBOX
      // postbox includes accountmanager in Options Dialog..
      // ... so we need a postbox specific hack.
      var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
                      .getService(Components.interfaces.nsIXULAppInfo).ID;
                    
      if (appInfo == "postbox@postbox-inc.com")
      {
        // we might need to load mailCore.js, as we can't be sure if it's...
        // ... loaded or not.
        if (typeof(openOptionsDialog) == "undefined")
        {
          Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
            .getService(Components.interfaces.mozIJSSubScriptLoader) 
            .loadSubScript("chrome://messenger/content/mailCore.js");
        }
        
        var options = {};

        if (server == null)
          server = this.GetActiveServer();
      
        if (server != null)
          options = { server: server, selectPage: 'am-sieve-account.xul' }
      
        // we hit postbox, settings are where in the preferences menu...
        openOptionsDialog('paneAccounts', '',  options);
        return;
      }
//#endif POSTBOX
    
    var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].
                            getService(Components.interfaces.nsIWindowMediator);

    var existingAccountManager = 
           windowManager.getMostRecentWindow("mailnews:accountmanager");

    if (existingAccountManager)
    {
      existingAccountManager.focus();
      return;
    }
    
    var options = {};

    if (server == null)
      server = this.GetActiveServer();
      
    if (server != null)
      options = { server: server, selectPage: 'am-sieve-account.xul' }
      
    window.openDialog("chrome://messenger/content/AccountManager.xul",
                      "AccountManager", "chrome,centerscreen,titlebar,modal",
                      options);     
  },
  
  /**
   * Retrieves the currently focused nsIMsgIncomingServer object. If the user 
   * has not focused an server, it returns the default. In case no Server is 
   * configured, null is returned.
   * 
   * @return {nsIMsgIncomingServer} 
   *   the active server or null
   */
  GetActiveServer : function()
  {
    // this function depends on funtions of the overlayed message window...
    if (typeof(GetFirstSelectedMsgFolder) == "undefined")
      return null;
  
    // As we can access message window functions, we can try to retrieve... 
    // ... the currently selected message account 
    var server = null;
    var folder = GetFirstSelectedMsgFolder();

    if (folder)
      server = folder.server;
    else
      server = accountManager.defaultAccount.incomingServer;
      
    if ((server.type == "imap") || (server.type == "pop3")) 
      return server;
      
    return null;
  }
}


var SieveTabType =
{
  name: "SieveExplorerTab",
  perTabPanel: "iframe",

  modes: {
    SieveExplorerTab: {
      type: "SieveExplorerTab",
      maxTabs: 1,
      
      openTab: function(aTab, aArgs)
      {
        aArgs.wrappedJSObject = aArgs;
        aTab.panel.contentWindow.arguments = [aArgs];
       
        this._addListeners(aTab);
        aTab.panel.contentWindow.tabmail = document.getElementById("tabmail");        
        
        aTab.panel.setAttribute("src","chrome://sieve/content/editor/SieveFilterExplorer.xul");
      },
      
      persistTab: function(aTab)  
      {
        return {
          account: aTab.panel.contentWindow.getSelectedAccount().getUri()
        }
      },
      
      restoreTab: function(aTabmail, aPersistedState)
      {
        aTabmail.openTab("SieveExplorerTab",{server:  aPersistedState.account})
      }      
    },
    
    SieveEditorTab: {
      type: "SieveEditorTab",
      
      openTab: function(aTab, aArgs)
      {
        if (aArgs["uri"])
          aTab.uri = aArgs["uri"];
        
        aArgs.wrappedJSObject = aArgs;
        aTab.panel.contentWindow.arguments = [aArgs];
               
        this._addListeners(aTab);        
        
        aTab.panel.setAttribute("src","chrome://sieve/content/editor/SieveFilterEditor.xul");
      },
      
      persistTab: function(aTab)  
      {
        if (! aTab.panel.contentWindow.onWindowPersist)
          return null;
          
        var args = aTab.panel.contentWindow.onWindowPersist();
        
        if (aTab.uri)
          args["uri"] = aTab.uri;
          
        return args;
      },
      
      restoreTab: function(aTabmail, aPersitedState)
      {
        aTabmail.openTab("SieveEditorTab",  aPersitedState);
      }
    }
  }, 
  
  closeTab: function(aTab)
  {          
    this._removeListeners(aTab);
  },
  
  showTab: function onShowTab(aTab)
  {
    //aTab.panel.setAttribute("type", "content-primary");
  },
  
  saveTabState: function onSaveTabState(aTab)
  {
  },
      
  onTitleChanged: function(aTab, aTabNode)
  {
    aTab.title = aTab.panel.contentWindow.document.title;
  },
  
  tryCloseTab: function(aTab)
  {
    if (! aTab.panel.contentWindow.onWindowClose())
      return false;
    
    return true;
  },
  
  _addListeners: function(aTab)
  {
    function onDOMTitleChanged(aEvent)
    {
      document.getElementById("tabmail").setTabTitle(aTab);
    }
    // Save the function we'll use as listener so we can remove it later.
    aTab.titleListener = onDOMTitleChanged;

    function onDOMWindowClose(aEvent)
    {
      if (!aEvent.isTrusted)
        return;
 
      // Redirect any window.close events to closing the tab. As a 3-pane tab
      // must be open, we don't need to worry about being the last tab open.
      document.getElementById("tabmail").closeTab(aTab);
      aEvent.preventDefault();
    }
    // Save the function we'll use as listener so we can remove it later.
    aTab.closeListener = onDOMWindowClose;        
    
    function onLoad(aEvent)
    {
      document.getElementById("tabmail").setTabTitle(aTab);
    }    
    aTab.loadListener = onLoad;
    
    // Add the listener.
    aTab.panel.contentWindow.addEventListener("DOMTitleChanged", aTab.titleListener, true);
    
    // Add the listener.
    aTab.panel.contentWindow.addEventListener("DOMWindowClose", aTab.closeListener, true);
    
    aTab.panel.contentWindow.addEventListener("load",aTab.loadListener,true);
  },
  
  _removeListeners: function(aTab)
  {
    if (aTab.titleListener)
      aTab.panel.contentWindow.removeEventListener("DOMTitleChanged", aTab.titleListener, true);
    
    if (aTab.closeListener)
      aTab.panel.contentWindow.removeEventListener("DOMWindowClose", aTab.closeListener, true);
    
    if (aTab.loadListeners)
      aTab.panel.contentWindow.removeEventListener("load",aTab.loadListener,true)
    
    aTab.titleListener = null;
    aTab.closeListener = null;
    aTab.loadListener = null;
  }
    
};

window.addEventListener("load", function(e) {
    var tabmail = document.getElementById('tabmail');
    if( tabmail ) tabmail.registerTabType(SieveTabType);
}, false);

