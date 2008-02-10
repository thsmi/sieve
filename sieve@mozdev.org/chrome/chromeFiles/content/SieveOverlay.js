function sivOpenFilters(server)
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
  
  // use window... method
  Components
    .classes["@mozilla.org/embedcomp/window-watcher;1"]
    .getService(Components.interfaces.nsIWindowWatcher)
    .openWindow(null, "chrome://sieve/content/editor/SieveFilterExplorer.xul"
                ,"Sieve:FilterExplorer", "chrome,resizable,centerscreen", null);

}


function sivGetAccount()
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
