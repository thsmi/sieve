/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 /* global Components */
 
// Enable Strict Mode
"use strict"; 

const Cu = Components.utils;
const Cc = Components.classes;
const Ci = Components.interfaces;

//525: gSivExtUtils.OpenSettings(server); 
var EXPORTED_SYMBOLS = [ "SieveUtils" ];

var SieveUtils =
{
  OpenFilter : function(window, server)
  {    
    if (server == null)
      server = this.GetActiveServer(window);    
      
    var options = {};
                     
    if (server != null)
      options = { server: server.rootMsgFolder.baseMessageURI.slice(15) };
      
    options.wrappedJSObject = options;

    // We have to check if the explorer view is already open.
    // If so we switch to it
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
        //childDoc.defaultView.QueryInterface(Ci.nsIDOMWindow).focus();
        
        var view = tabmail.tabModes.SieveExplorerTab.tabs[0].panel.contentWindow;
        view.onSelectAccount(server);
        view.focus();
        
        return;
      }
    }

    // It's not open, so we have to open the view. It's a bit more tricky,
    // as tabmail does only exist in mail:3pane windows. 
    
    // First try The window object...
    var tabmail = window.document.getElementById("tabmail");
    
    if (!tabmail)
    {  
      // .. then we try the most recent 3pane window  
      var mail3PaneWindow = Cc["@mozilla.org/appshell/window-mediator;1"]  
                                .getService(Ci.nsIWindowMediator)  
                                .getMostRecentWindow("mail:3pane");  
      if (mail3PaneWindow) 
      {  
        tabmail = mail3PaneWindow.document.getElementById("tabmail");  
        mail3PaneWindow.focus();  
      }
    } 
  
    // and as last resort we create a new mail:3pane window...
    if (!tabmail) {
      window.openDialog("chrome://messenger/content/", "_blank",  
                      "chrome,dialog=no,all", null,  
                      { tabType: "SieveExplorerTab",  
                        tabParams: options }); 
                        
      return;
    }
  
    // we found our tabmail interface!
    tabmail.openTab("SieveExplorerTab", options);
  },  
  
  /**
   * Opens the Account Manager and selects the page to configure sieve
   * settings and preferences. 
   * 
   * @param {nsIMsgIncomingServer}
   *   the server which should be configured, can be null.
   */
  OpenSettings : function (window, server)
  {    
    // the accountmanager is modal. We need a parent window!
    if (window == null)
      throw "window missing, need an owner for Accountmanager...";
      
    var windowManager = Cc['@mozilla.org/appshell/window-mediator;1'].
                            getService(Ci.nsIWindowMediator);

    var existingAccountManager = 
           windowManager.getMostRecentWindow("mailnews:accountmanager");

    if (existingAccountManager)
    {
      existingAccountManager.focus();
      return;
    }
    
    var options = {};

    if (server == null)
      server = this.GetActiveServer(window);
      
    if (server != null)
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
   * @return {nsIMsgIncomingServer} 
   *   the active server or null
   */
  GetActiveServer : function(window)
  {
    try {
      // check if we got a 3pane window. If not we discard it.
      if (window && (window.document.documentElement))
        if (window.document.documentElement.getAttribute("windowtype") != "mail:3pane")
          window = null;
      
      // so let's try to get the most recent 3Pane Window 
      if (!window)
      {
        window = Cc["@mozilla.org/appshell/window-mediator;1"]  
                     .getService(Ci.nsIWindowMediator)  
                     .getMostRecentWindow("mail:3pane");        
      }
              
      if (!window) 
        return null;
    
      // this function depends on funtions of the overlayed message window...
      if (typeof(window.GetFirstSelectedMsgFolder) === "undefined")
        return null;
  
      // As we can access message window functions, we can try to retrieve... 
      // ... the currently selected message account 
      var server = null;
      var folder = window.GetFirstSelectedMsgFolder();

      if (folder)
        server = folder.server;
      else
        server = accountManager.defaultAccount.incomingServer;
      
      if ((server.type == "imap") || (server.type == "pop3")) 
        return server;
    }
    catch (ex)
    {
      Cu.reportError(ex);
    }
    
    return null;
  }
};

