

function sivInitFilterList()
{
  // cleanup event listener
  document.removeEventListener('DOMContentLoaded',sivInitFilterList,false);
  
  var dialog = document.getElementById("filterListDialog");

  var grid = dialog.getElementsByTagName("grid");

  // TODO Show error notification instead of an popup...
  if (grid.length != 1)
    alert("Incompatible ");

  grid = grid.item(0);
  
  var elm = document.createElement("tabbox");
  elm.setAttribute("id","sivFilterList");
  elm.setAttribute("flex","1");
  elm.style.padding = "5px";
  elm.style.paddingBottom = "0px";
  
  grid.parentNode.insertBefore(elm,grid);
  
  var tabs = elm.appendChild(document.createElement("tabs"));
  tabs.addEventListener("select",sivTabSelected,true);
  
  tabs.appendChild(document.createElement("tab"));
  tabs.lastChild.setAttribute("label","Local Filters");
  
  tabs.appendChild(document.createElement("tab"));
  tabs.lastChild.setAttribute("label","Server side filters");
  
  var tabpanels = elm.appendChild(document.createElement("tabpanels"));
  
  tabpanels.setAttribute("flex","1");
  //tabpanels.appendChild(document.createElement("tabpanel"));
  
  tabpanels.appendChild(grid);
  
  tabpanels.appendChild(document.createElement("iframe"));
  tabpanels.lastChild.setAttribute("flex","1");
  tabpanels.lastChild.setAttribute("src","chrome://sieve/content/libs/libSieveDOM/SieveSimpleGui.html");
  tabpanels.lastChild.setAttribute("type","content");
  
  document.getElementById("serverMenu").addEventListener("command",sivFolderChange,true);
  
  // When the server Menu gets populated the first time no command event is...
  // ... fired thus we need this hack. We listen to the filter list's selection...
  // ... changes and wait until the menu is populated.  
  
  var listener = function filterListListener (event) {
    if (sivLoadAccount())
      event.currentTarget.removeEventListener('select', filterListListener, false);
  }
  
  document.getElementById("filterList").addEventListener("select", listener, false);
  
  // Ensure the first tab is selected...
  elm.selectedIndex = 0;
}


function sivTabSelected(event)
{ 
  sivLoadAccount();
}

function sivLoadAccount(server)
{   
  if (!server)
    server = document.getElementById("serverMenu").selectedItem._folder.server;
    
  if (!server)
    return false;

  if ((server.type != "imap") && (server.type != "pop3"))
  {
    document.getElementById("sivFilterList").tabs.getItemAtIndex(1).collapsed = true;    
    document.getElementById("sivFilterList").selectedIndex = 0;
    
    return true;
  }
  
  document.getElementById("sivFilterList").tabs.getItemAtIndex(1).collapsed = false;
    
  if (document.getElementById("sivFilterList").selectedIndex != 1)
    return true;  
  
  return true;
  alert("Changed"+server.prettyName);        
}

function sivFolderChange(event)
{
    
  var folder = event.target._folder;
  
  if (!folder.server)
  {
    alert("Incompatible folder");
    return;
  }
  
  sivLoadAccount(folder.server);    
}

document.addEventListener('DOMContentLoaded', sivInitFilterList, false);


//document.insertBefore(,)
  
//  document.createElement();