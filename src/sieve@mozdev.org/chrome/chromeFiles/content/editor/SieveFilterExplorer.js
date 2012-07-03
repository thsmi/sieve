/* 
 * 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 * Hints for Spekt IDE autocomplete, they have to be in the first comment...
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/libs/libManageSieve/SieveAccounts.js"
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/libs/libManageSieve/Sieve.js"
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/libs/libManageSieve/SieveRequest.js"
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/libs/libManageSieve/SieveResponse.js"
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/SieveOverlay.js
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/editor/SieveFilterTreeView.js"
 */

// Enable Strict Mode
"use strict";

if (typeof(Cc) == 'undefined')
  { Cc = Components.classes; }

if (typeof(Ci) == 'undefined')
  { Ci = Components.interfaces; } 

/** @type {{Components.interfaces.nsIConsoleService}}*/
var gLogger = null;

// We do it java style...
function SieveFilterExplorer()
{
  SieveAbstractClient.call(this);
  
  this._view = null;
}

SieveFilterExplorer.prototype.__proto__ = SieveAbstractClient.prototype;

// TODO muss der error listener wirklich jedes mal gesetzet werden...
// eigentlich müssete der default doch beim Objekt rauskommen...

//-- Sieve Related Events
SieveFilterExplorer.prototype.onListScriptResponse
    = function(response)
{
  // Show List View...    
  var tree = document.getElementById('treeImapRules');
  
  this._view.update(response.getScripts());
  tree.view = this._view;
    
  // always select something
  if ((tree.currentIndex < 0) && (tree.view.rowCount > 0))
    tree.view.selection.select(0);
      
  this.onStatusChange(0);
  //TODO force repainting treeview...
}

SieveFilterExplorer.prototype.onSetActiveResponse
    = function(response)
{
  // Always refresh the table ...  
  this.listScript();
}

SieveFilterExplorer.prototype.onDeleteScriptResponse
    = function(response)
{
  // Always refresh the table ...
  this.listScript();
}

SieveFilterExplorer.prototype.onChannelClosed
    = function()
{
  // a channel is usually closed when a child window is closed. Therefore
  // it is a good idea to refresh the list...
  this.listScript();
}
  
SieveFilterExplorer.prototype.onChannelReady
    = function(cid)
{
  // We observe only our channel...
  if (cid != this._cid)
    return;
      
  // List all scripts as soon as we are connected
  this.listScript();    
}
     
SieveFilterExplorer.prototype._renameScript
    = function (oldName, newName,isActive)
{
  // As we are emulating rename, the server does not check for scripts with...
  // ... conflicting names. Instead it will overwrite such a script silently...
  // ... So we try hard and double check our cached scriptnames for possible...
  // ... conflicts inoder to prevent possible dataloss.
  
  // TODO thro an error instead of retuning null...
  var tree = document.getElementById('treeImapRules');  
    for(var i = 0; i < this._view.rules.length; i++)    
      if (this._view.rules[i].script == newName)
        return alert("Script already exists");  
  
  if (typeof(isActive) == "undefined")
    isActive == tree.view.getCellValue(tree.currentIndex, tree.columns.getColumnAt(1));

  SieveAbstractClient.prototype._renameScript.call(this,oldScriptName, newScriptName, isActive);    
}

SieveFilterExplorer.prototype.connect
    = function (account)
{ 
  if (!account)
    account = getSelectedAccount();
 
  SieveAbstractClient.prototype.connect.call(this,account);    
}


SieveFilterExplorer.prototype.disconnect
    = function (state,message)
{
  disableControls(true);  
  SieveAbstractClient.prototype.disconnect.call(this,state,message);  
}

SieveFilterExplorer.prototype.onStatusChange
    = function (state, message)
{
  // Script ready
  if (state == 0)
  {
    disableControls(false);
    document.getElementById("sivExplorerStatus").setAttribute('hidden','true');    
    document.getElementById('sivExplorerTree').removeAttribute('collapsed');    
    return;
  }
  
  // Capabilities...
  if (state == 7)
  {
    document.getElementById('txtSASL').value = message.getSasl();        
    document.getElementById('txtExtensions').value = message.getExtensions(true); 
    document.getElementById('txtImplementation').value = message.getImplementation();
    document.getElementById('txtVersion').value = "v"+message.getVersion().toFixed(2);
  }
    
  // The rest has to be redirected to the status window...
  document.getElementById('sivExplorerTree').setAttribute('collapsed','true');    
  document.getElementById("sivExplorerStatus").contentWindow.onStatus(state,message)
  document.getElementById("sivExplorerStatus").removeAttribute('hidden');    
}


var gSFE = new SieveFilterExplorer();

function onWindowLoad()
{

//	var actList = document.getElementById("conImapAcct");
//	var actpopup = document.createElement("menupopup");
//	actList.appendChild(actpopup);

  // now create a logger session...
  if (gLogger == null)
    gLogger = Cc["@mozilla.org/consoleservice;1"]
                    .getService(Ci.nsIConsoleService);

  var menuImapAccounts = document.getElementById("menuImapAccounts");

  var accounts = (new SieveAccounts()).getAccounts();
  

  for (var i = 0; i < accounts.length; i++)
  {   
    menuImapAccounts.appendItem( 
      accounts[i].getDescription(),
      accounts[i].getKey(),"").disabled = false;

    if (window.arguments.length == 0)
      continue;
    
    if (window.arguments[0].wrappedJSObject.server != accounts[i].getUri())
      continue;
      
    menuImapAccounts.selectedIndex = i;      
  }
  
  gSFE._view = new SieveTreeView(new Array(), onCycleCell);
  document.getElementById('treeImapRules').view = gSFE._view;
	
	if (menuImapAccounts.selectedIndex == -1)
    menuImapAccounts.selectedIndex = 0;
    
  onSelectAccount();
  

}
   
function onWindowClose()
{
  // Don't forget to close this channel...
  if (gSFE)
    gSFE.disconnect();  

  document.getElementById("sivExplorerStatus").contentWindow.onDetach();
    
  return true;
}

/**
 * @return {SieveAccount}
 */
function getSelectedAccount()
{
  var selectedItem = document.getElementById("menuImapAccounts").selectedItem; 
    
  if (!selectedItem)
    return null;
    
  return (new SieveAccounts()).getAccount(selectedItem.value); 
}


function onSelectAccount()
{
  document.getElementById("sivExplorerStatus").contentWindow.onDetach();  
    
  gSFE.disconnect();
  
  // update the TreeView...
  var tree = document.getElementById('treeImapRules');
      
  tree.view.selection.clearSelection();
  
  gSFE._view.update(new Array());
  tree.view = gSFE._view;
      
  var account = getSelectedAccount();
  
  document.getElementById("sivExplorerStatus").contentWindow
    .onAttach(account,function() { gSFE.connect() });
      
  if (account == null)
    return gSFE.onStatusChange(2,"error.noaccount");
      
  // Disable and cancel if account is not enabled
  if ((!account.isEnabled()) || account.isFirstRun())
  {
    account.setFirstRun();
    return gSFE.onStatusChange(8);
  }
    
 // TODO wait for timeout or session close before calling connect again
 // otherwise we might endup using a closing channel. An isClosing function
 // and the follwoing code migh help to detect this...
 
/*  if (isClosing)
  setTimeout(function(){sivDisconnect(force=true); sivConnect(account)}, 1000);*/
    
  gSFE.connect(account);
}

function onDeleteClick()
{
  var tree = document.getElementById('treeImapRules');  
  if (tree.currentIndex < 0)
    return;
    
  var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                  .getService(Ci.nsIPromptService);
  	
  var check = {value: false};                  // default the checkbox to false
 
  var flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_YES +
              prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_NO;

  // The checkbox will be hidden, and button will contain the index of the button pressed,
  // 0, 1, or 2.

  var button = prompts.confirmEx(null, "Confirm Delete", "Do you want to delete the selected script?",
                               flags, "", "", "", null, check);
  
  if (button != 0)
    return;
  
  var scriptName = new String(tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(0)));	
  
  gSFE.deleteScript(scriptName)
}
/**
 * @param {String} scriptName
 * @param {String} scriptBody
 */
function sivOpenEditor(scriptName,scriptBody)
{  
  /*var wm = Cc["@mozilla.org/appshell/window-mediator;1"]  
             .getService(Ci.nsIWindowMediator);
             
  var enumerator = wm.getEnumerator("Sieve:FilterEditor");  
  while(enumerator.hasMoreElements())
  {  
    var win = enumerator.getNext(); 
    
    if (win.name != "x-sieve:"+sid+"/"+scriptName)
      continue
    
    if (win.closed)
      continue;
      
    win.focus();    
    return;
  }     */

  var args = new Array();
  
  args["scriptName"] = scriptName;
  if (scriptBody)
    args["scriptBody"] = scriptBody;
    
  args["sieve"] = gSFE._sid;
  args["uri"] = "x-sieve:"+gSFE._sid+"/"+scriptName;
  args["account"] = getSelectedAccount().imapKey;
  
  // This is a hack from DEVMO
  args.wrappedJSObject = args;  
  
  
  /*Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher)
      .openWindow(null,"chrome://sieve/content/editor/SieveFilterEditor.xul",
          "x-sieve:"+sid+"/"+scriptName, 
          "chrome,titlebar,resizable,centerscreen,all", args);*/

  // Every script needs to be open in a unique tab...
  // ... so we have to crawl through all windows through ... 
  // ... looking for a tabmail component and test there if ...
  // ... the script is already open.
  var mediator = Components
          .classes["@mozilla.org/appshell/window-mediator;1"]
          .getService(Components.interfaces.nsIWindowMediator);
    
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
  
      //if (childDoc.location.href == "chrome://sieve/content/editor/SieveFilterExplorer.xul")
       
      if (childDoc.location.href != "chrome://messenger/content/messenger.xul")
        continue;
         
      var tabmail = childDoc.getElementById("tabmail");
       
      if (!tabmail)
        continue;
    
      if (!tabmail.tabModes.SieveEditorTab)
        continue;

      if (!tabmail.tabModes.SieveEditorTab.tabs.length)
        continue;
      
      for (var i = 0; i < tabmail.tabModes.SieveEditorTab.tabs.length ; i++)
      {
        if (tabmail.tabModes.SieveEditorTab.tabs[i].uri != args["uri"])
          continue;

        tabmail.switchToTab(tabmail.tabModes.SieveEditorTab.tabs[i]);
        childDoc.defaultView.QueryInterface(Ci.nsIDOMWindow).focus();
        
        return;
      } 
    }
  }
  
  window.tabmail.openTab("SieveEditorTab", args);
  return;  
}


function onNewClick()
{
  // Instead of prompting for the scriptname, setting the scriptname to an 
  // unused scriptname (eg. unnamed+000]) would offer a better workflow...
  // Also put a template script would be good...

  var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                  .getService(Ci.nsIPromptService);

  var input = {value:"unnamed"};
  var check = {value:false};

  var result
       = prompts.prompt(
           window,
           "Create a new Script",
           "Enter the name for your new Sieve script (existing scripts will be overwritten)",
           input, null, check);

  // Did the User cancel the dialog?
  if (result != true)
    return;

  var date = new Date();
  var script = "#\r\n# "+date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+"\r\n#\r\n";
  sivOpenEditor(input.value,script);	
}

function onEditClick()
{
  var tree = document.getElementById('treeImapRules');	
  if (tree.currentIndex < 0)
    return;

  var scriptName = new String(tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(0)));
   
  sivOpenEditor(scriptName);
    
  return;
}




function disableControls(disabled)
{
  if (disabled)
  {    
    document.getElementById('newButton').setAttribute('disabled','true');
    document.getElementById('editButton').setAttribute('disabled','true');
    document.getElementById('deleteButton').setAttribute('disabled','true');
    document.getElementById('renameButton').setAttribute('disabled','true');   
    document.getElementById('btnActivateScript').setAttribute('disabled','true');
    document.getElementById('treeImapRules').setAttribute('disabled','true');
    document.getElementById('btnServerDetails').setAttribute('disabled','true');
    document.getElementById('vbServerDetails').setAttribute('hidden','true');
  }
  else
  {    
    document.getElementById('newButton').removeAttribute('disabled');
    document.getElementById('editButton').removeAttribute('disabled');
    document.getElementById('deleteButton').removeAttribute('disabled');
    document.getElementById('btnActivateScript').removeAttribute('disabled');
    document.getElementById('renameButton').removeAttribute('disabled');
    document.getElementById('treeImapRules').removeAttribute('disabled');
    document.getElementById('btnServerDetails').removeAttribute('disabled');      
  }
}



function onRenameClick()
{
  
  var tree = document.getElementById('treeImapRules');

  if (tree.currentIndex == -1)
    return;
   
  var oldScriptName = new String(tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(0)));
  
  var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                  .getService(Ci.nsIPromptService);

  var input = {value:oldScriptName};
  var check = {value:false};

  var result
       = prompts.prompt(
           window,
           "Rename Sieve Script",
           "Enter the new name for your Sieve script ",
           input, null, check);

  // Did the User cancel the dialog?
  if (result != true)
    return;
  
  // it the old name equals the new name, ignore the request.
  if (input.value.toLowerCase() == oldScriptName.toLowerCase())
    return;
    
  gSFE.renameScript(oldScriptName, input.value);
}

function onServerDetails()
{
  var el = document.getElementById("vbServerDetails");  
  var img = document.getElementById("imgServerDetails");
    
  if (el.hasAttribute('hidden'))
  {
    img.setAttribute('src','chrome://global/skin/tree/twisty-open.png'); 
    el.removeAttribute('hidden');       
  }
  else
  {
    el.setAttribute('hidden','true');
    img.setAttribute('src','chrome://global/skin/tree/twisty-clsd.png');
  }  
}

function onSettingsClick()
{
  var server = Cc['@mozilla.org/messenger/account-manager;1']
                   .getService(Ci.nsIMsgAccountManager)
                   .getIncomingServer(getSelectedAccount().imapKey);
  
  gSivExtUtils.OpenSettings(server);
}

function onActivateClick()
{
  var tree = document.getElementById('treeImapRules');  
  if (tree.currentIndex < 0)
    return;

  // imitate click in the treeview
  tree.view.cycleCell(tree.currentIndex,tree.columns.getColumnAt(1));
    
  return;
}

function onCycleCell(row,col,script,active)
{
  gSFE.setActiveScript((active?null:script))
}
