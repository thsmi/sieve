/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 

function onSivTabSelected(event)
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
    
  // we initialize sieve just in time in oder to save resources...
  if (document.getElementById("sivFilterList").selectedIndex != 1)
    return true;  

  var key = ""+server.key;
  
  var iframe = document.getElementById('sivFilterListFrame');
  
  if (iframe.getAttribute("key") == key)
    return true;
    
  
  
/*  if (iframe.contentWindow)
    if (iframe.contentWindow.onCanChangeAccount(key) == false)
      return true;
      
  //'DOMContentLoaded'
  // 'DOMFrameContentLoaded'
  iframe.addEventListener('load', function iframeReady(ev) {
      
    document.getElementById('sivFilterListFrame')
      .removeEventListener('load',iframeReady,true)
      
    document.getElementById('sivFilterListFrame')      
      .contentWindow.onLoad(key);
        
    }, true);*/
    
    
  /*document.getElementById('sivFilterListFrame').src =
    document.getElementById('sivFilterListFrame').src;*/
  /*document.getElementById('sivFilterListFrame').contentDocument
    .location.reload(true);*/
    
  /*document.getElementById('sivFilterListFrame').contentWindow
    .location.reload(true);*/
  if (iframe.hasAttribute("src"))
    iframe.contentWindow.location.reload();
  else
    iframe.setAttribute("src","chrome://sieve/content/filterList/SieveFilterList.xul");
    
  iframe.setAttribute("key",key);  
  
  /*document.getElementById("sivFilterListFrame")
    .contentWindow.onAccountChange(server.key);*/
    
  return true;
}

function onSivFolderChange(event)
{
    
  var folder = event.target._folder;
  
  if (!folder.server)
  {
    alert("Incompatible folder");
    return;
  }
  
  sivLoadAccount(folder.server);    
}



// As the filter list dialog lacks of ids overlays can't be used to add ...
// ... the tabbox. So we have to do the overlay dynamically at runtime.
// 
// This stub loader waits until document is ready. It wraps the dialogs "grid"..
// ... element into a tabbox.  
//
// Finally some magic is applied to detect the currently selected account.

document.addEventListener('DOMContentLoaded', 
  function sivInitFilterList()
  {
    // cleanup event listener, we don't need it anymore...
    document.removeEventListener('DOMContentLoaded',sivInitFilterList,false);
  
    var dialog = document.getElementById("filterListDialog");

    var grid = dialog.getElementsByTagName("grid");

    // there should be exactly one grid otherwise we collided with some other...
    // ... extension. In order to avoid incompatibilies, we show an error...
    // ... message and skip ...    
    if (grid.length != 1)
    {
      
      var elm = document.createElement("hbox");
      elm.setAttribute("align","center");
      elm.style.backgroundImage = "-moz-linear-gradient(center bottom , rgb(255, 221, 102), rgb(255, 235, 125))";
      elm.style.borderTop = "1pt solid #fff1a3";
      elm.style.borderBottom = "1pt solid #c0972e";
      elm.style.margin = "0pt";
      elm.style.padding = "0.7em";
      elm.style.marginBottom = "1em";

      elm.appendChild(document.createElement("hbox"));      
      elm.lastChild.setAttribute("flex","1");
      
      elm.lastChild.appendChild(document.createElement("description"));
      elm.lastChild.lastChild.setAttribute("value","Initializing Server Side Filters failed!");
      elm.lastChild.lastChild.style.fontWeight = "bold";
 
      elm.lastChild.appendChild(document.createElement("description"));
      elm.lastChild.lastChild.setAttribute("value","Please report bug to schmid-thomas@gmx.net");
      
      dialog.insertBefore(elm,dialog.firstChild)
      
      return;      
    }
      

    grid = grid.item(0);
  
    // create the tabbox...
    var elm = document.createElement("tabbox");
    elm.setAttribute("id","sivFilterList");
    elm.setAttribute("flex","1");
    elm.style.padding = "5px";
    elm.style.paddingBottom = "0px";
  
    // ... and insert it before the grid ...
    grid.parentNode.insertBefore(elm,grid);
  
    // ... then create the tabs ...
    var tabs = elm.appendChild(document.createElement("tabs"));
    tabs.addEventListener("select",onSivTabSelected,true);
  
    tabs.appendChild(document.createElement("tab"));
    tabs.lastChild.setAttribute("label","Local Filters");
  
    tabs.appendChild(document.createElement("tab"));
    tabs.lastChild.setAttribute("label","Server side filters");
    tabs.lastChild.collapsed = true;  
  
    // ... finally the corresponding tabpanels...
    var tabpanels = elm.appendChild(document.createElement("tabpanels"));
  
    // ... the first one is the grid element, so we move this element into...
    // ... tabbox...
    tabpanels.setAttribute("flex","1");
    tabpanels.appendChild(grid);
  
    // ... then we add the iframe for our sieve scripts...
    tabpanels.appendChild(document.createElement("iframe"));
    tabpanels.lastChild.setAttribute("flex","1");
    tabpanels.lastChild.setAttribute("type","chrome");
    tabpanels.lastChild.setAttribute("id","sivFilterListFrame");
    tabpanels.lastChild.setAttribute("style",
        "overflow:auto; -moz-appearance: textfield;")
  
    document.getElementById("serverMenu").addEventListener("command",onSivFolderChange,true);
  
    // When the server Menu gets populated the first time no command event is...
    // ... fired thus we need this hack. We listen to the filter list's selection...
    // ... changes and wait until the menu is populated.  
    document.getElementById("filterList").addEventListener("select",
      function filterListListener (event) {
        if (sivLoadAccount())
          event.currentTarget.removeEventListener('select', filterListListener, false);
      }, 
      false);

    // Ensure the first tab is selected...
    elm.selectedIndex = 0;
  },
  false);