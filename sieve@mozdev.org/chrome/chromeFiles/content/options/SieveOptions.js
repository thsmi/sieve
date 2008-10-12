
var sieveAccountTreeView = null;

function onWindowLoad()
{
	// Load all the Libraries we need...
	/*var jsLoader = Components
										.classes["@mozilla.org/moz/jssubscript-loader;1"]
										.getService(Components.interfaces.mozIJSSubScriptLoader);

  jsLoader
    .loadSubScript("chrome://sieve/content/options/SieveAccountTreeView.js");*/
    
	// now set our custom TreeView Renderer...
	var tree = document.getElementById('treeAccounts');	
	sieveAccountTreeView = new SievePrefTreeView(this);
	tree.view = sieveAccountTreeView;
		
  // ... and make sure that an entry is selected.
	if ((tree.currentIndex == -1) && (tree.view.rowCount > 0))
	    tree.view.selection.select(0);
}

function onCycleCell(sender)
{
		onTreeSelect(document.getElementById('treeAccounts'));
}

function onTreeSelect(sender)
{	
  if (sender.currentIndex == -1)
	{
		document.getElementById('btnEdit').setAttribute('disabled','true');
		document.getElementById('btnFilters').setAttribute('disabled','true');
		document.getElementById('btnEnable').setAttribute('disabled','true');		
		return;
	}
	
  var account = sieveAccountTreeView.getAccount(sender.currentIndex);
	document.getElementById('btnEnable').removeAttribute('disabled');
	  
  if (account.isEnabled() == false)
  {
  	document.getElementById('btnEdit').setAttribute('disabled','true');
  	document.getElementById('btnFilters').setAttribute('disabled','true');
  	document.getElementById('btnEnable').label = "Enable";
  }
  else
  {
  	document.getElementById('btnEdit').removeAttribute('disabled');
  	document.getElementById('btnFilters').removeAttribute('disabled');
	 	document.getElementById('btnEnable').label = "Disable";	
  }
		
  document.getElementById('txtHostname').value
  	= account.getHost().getHostname();
  document.getElementById('txtPort').value
   	= account.getHost().getPort();
  document.getElementById('txtTLS').value
   	= account.getHost().isTLS();
   
  var authType = ""; 	
  switch (account.getLogin().getType())
  {
  	case 0: authType = "No Authentication"; break;
  	case 1: authType = "Use login from IMAP Account"; break;
  	case 2: authType = "Use a custom login"; break;
  }
  document.getElementById('txtAuth').value = authType;
  document.getElementById('txtUserName').value
   	= account.getLogin().getUsername();     	
}

function onEditClick(sender)
{
	var tree = document.getElementById('treeAccounts');

	// should never happen
  if (tree.currentIndex == -1)
		return;				
    
  var args = new Array();
  args["SieveAccount"] = sieveAccountTreeView.getAccount(tree.currentIndex);
        
  window.openDialog("chrome://sieve/content/options/SieveAccountOptions.xul",
  	 "FilterEditor", "chrome,modal,titlebar,centerscreen", args);	        
  	 
	onTreeSelect(tree);
}

function onEnableClick(sender)
{
	var tree = document.getElementById('treeAccounts');

	// should never happen
  if (tree.currentIndex == -1)
		return;				
			
	if (sender.label == "Disable")
		sieveAccountTreeView.getAccount(tree.currentIndex).setEnabled(false);
	else 	if (sender.label == "Enable")
 		sieveAccountTreeView.getAccount(tree.currentIndex).setEnabled(true);
	else
		alert("Fatal error");

	onTreeSelect(tree);		
}

function onShowFiltersClick()
{
	var tree = document.getElementById('treeAccounts');

	// should never happen
  if (tree.currentIndex == -1)
		return;				
			
  sivOpenFilters(sieveAccountTreeView.getAccount(tree.currentIndex).getUri(),this.window);
 
  return;   
}