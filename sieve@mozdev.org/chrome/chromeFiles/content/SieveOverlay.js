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


