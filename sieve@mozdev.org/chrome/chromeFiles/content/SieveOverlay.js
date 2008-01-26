function sivOpenFilters()
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
  
  Components
    .classes["@mozilla.org/embedcomp/window-watcher;1"]
    .getService(Components.interfaces.nsIWindowWatcher)
    .openWindow(null, "chrome://sieve/content/editor/SieveFilterExplorer.xul"
                ,"Sieve:FilterExplorer", "chrome,resizable,centerscreen", null);

}


