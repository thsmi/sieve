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
                ,"Sieve:FilterExplorer", "chrome,resizable,centerscreen,all", params);

}


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
