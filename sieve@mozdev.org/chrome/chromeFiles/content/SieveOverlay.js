/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

// we don't want to pollute the global namespace more than necessay.
var gSivExtUtils =
{
  OpenFilters : function(server,parentWin)
  {
    var w = null;
    var mediator = Components
            .classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator);
    
    // as the filter explorer opens a modal dialog...
    // ... we have to check for this dialog first.
  
    w = mediator.getMostRecentWindow("Sieve:FilterEditor");
    if (w && (typeof(w) != "undefined") &&!w.closed)
    {
      w.focus();
      return;
    }
    
    w =  mediator.getMostRecentWindow("Sieve:FilterExplorer");
    if (w && (typeof(w) != "undefined") &&!w.closed)
    {
      // notify window to switch accounts...
      w.focus();
      return;
    }

    if (server == null)
      server = this.GetActiveImapServer();      

    var options = {}
                     
    if (server != null)
      options = { server: server.rootMsgFolder.baseMessageURI.slice(15) }

    window.openDialog("chrome://sieve/content/editor/SieveFilterExplorer.xul",
                      "Sieve:FilterExplorer",
                      "chrome,resizable,centerscreen,all",
                      options);
 /*   Components
        .classes["@mozilla.org/embedcomp/window-watcher;1"]
        .getService(Components.interfaces.nsIWindowWatcher)
        .openWindow(
          parentWin,,
          null, "chrome,resizable,centerscreen,all", options);*/

/*                
  if (parentWin == null)
    parentWin = window;
    
  parentWin.openDialog("chrome://sieve/content/editor/SieveFilterExplorer.xul", 
                    "Sieve:FilterExplorer", 
                    "chrome,resizable,centerscreen,all", account);*/                    
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
      server = this.GetActiveImapServer();
      
    if (server != null)
      options = { server: server, selectPage: 'am-sieve-account.xul' }
      
    window.openDialog("chrome://messenger/content/AccountManager.xul",
                      "AccountManager", "chrome,centerscreen,titlebar,modal",
                      options);     
  },
  
  /**
   * Retrieves the currently focused IMAP server. If the user has not
   * focused an IMAP server, it returns the default IMAP. In case no
   * IMAP Server is configured, null is returned.
   * 
   * @return {nsIMsgIncomingServer} 
   *   the active server or null
   */
  GetActiveImapServer : function()
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
      
    if (server.type == "imap")
      return server;
      
    return null;
  }
}
