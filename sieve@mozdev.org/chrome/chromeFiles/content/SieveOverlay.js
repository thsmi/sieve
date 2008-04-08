function sivOpenFilters(account,parentWin)
{
  
  var w = null;
  var mediator = Components
    .classes["@mozilla.org/appshell/window-mediator;1"]
    .getService(Components.interfaces.nsIWindowMediator);
    
  // as the filter explorer opens a modal dialog...
  // ... we have to check for this dialog first.
  
  w = mediator.getMostRecentWindow("Sieve:FilterEditor");  
  if (w)
  {
    w.focus();
    return;
  }
    
  w =  mediator.getMostRecentWindow("Sieve:FilterExplorer");
  if (w)
  {
    w.focus();
    return;
  }


  var params = Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
                .createInstance(Components.interfaces.nsIDialogParamBlock);
  params.SetNumberStrings(1);
  params.SetString(0, new String(account));

  // use window... method
  Components
    .classes["@mozilla.org/embedcomp/window-watcher;1"]
    .getService(Components.interfaces.nsIWindowWatcher)
    .openWindow(parentWin, "chrome://sieve/content/editor/SieveFilterExplorer.xul"
                ,null, "chrome,resizable,centerscreen,all", params);

 //       window.openDialog("chrome://browser/content/preferences/cookies.xul",
 //                         "Browser:Cookies", "", {filterString : eTLD});

}

/* 810       openDialog(kDesktopBackgroundURL, "",
 811                  "centerscreen,chrome,dialog=no,dependent,resizable=no",
 812                  this.target);
*/

/*
 167   **
 168    * Open the login manager window
 169    *
 170   viewPasswords : function()
 171   {
 172     var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
 173                        .getService(Components.interfaces.nsIWindowMediator);
 174     var win = wm.getMostRecentWindow("Toolkit:PasswordManager");
 175     if (win) {
 176       win.setFilter(this._getSecurityInfo().hostName);
 177       win.focus();
 178     }
 179     else
 180       window.openDialog("chrome://passwordmgr/content/passwordManager.xul",
 181                         "Toolkit:PasswordManager", "", 
 182                         {filterString : this._getSecurityInfo().hostName});
 183   }
*/

function sivGetActiveAccount()
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

  // make sure that we found an imap account as sieve works only with imap
  if (server.type == "imap")
    return server.rootMsgFolder.baseMessageURI.slice(15);
    
  return null;    
}
