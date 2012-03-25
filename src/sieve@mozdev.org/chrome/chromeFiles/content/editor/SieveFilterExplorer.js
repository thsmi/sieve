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

var sid = null;
var gCid = null;

/** @type {{Components.interfaces.nsIConsoleService}}*/
var gLogger = null;
 
var sieveTreeView = null;

var event = 
{	
  onListScriptResponse: function(response)
  {
    // Show List View...
    sivSetStatus(0);
    
    sieveTreeView.update(response.getScripts());
    
    var tree = document.getElementById('treeImapRules');
    tree.view = sieveTreeView;
    
    // always select something
    if ((tree.currentIndex < 0) && (tree.view.rowCount > 0))
      tree.view.selection.select(0);
      
    //TODO force repainting treeview...
  },

  onSetActiveResponse: function(response)
  {
    // Always refresh the table ...
    var request = new SieveListScriptRequest();
    request.addListScriptListener(event);
    request.addErrorListener(event);
     
    sivSendRequest(sid,gCid,request);
  },

  onDeleteScriptResponse:  function(response)
  {
    // Always refresh the table ...
    var request = new SieveListScriptRequest();
    request.addListScriptListener(event);
    request.addErrorListener(event);
    
    sivSendRequest(sid,gCid,request);
  },

  onOffline: function()
  {
    sivDisconnect(6);
  },
  
  onTimeout: function()
  {
    gLogger.logStringMessage("SivFilterExplorer.js\nOnTimeout");
    
    
    sivDisconnect(1,"warning.timeout");
  },
	
  onError: function(response)
  {
    gLogger.logStringMessage("SivFilerExplorer.OnError: "+response.getMessage());
    sivDisconnect(4,response.getMessage());
  },
  
  onDisconnect: function()
  {
    sivDisconnect(9);
  },
  
  onCycleCell: function(row,col,script,active)
  {
  	var request = null;
    if (active == true)
      request = new SieveSetActiveRequest();
    else
      request = new SieveSetActiveRequest(script)
      
    request.addSetActiveListener(event);
    request.addErrorListener(event);

    sivSendRequest(sid,gCid,request);
  },
      
  onChannelClosed : function()
  {
    // a channel is usually closed when a child window is closed. Therefore
    // it is a good idea to refresh the list...
          
    var request = new SieveListScriptRequest();
    request.addListScriptListener(event);
    request.addErrorListener(event);

    sivSendRequest(sid,gCid,request);
  },
  
  onChannelCreated : function(sieve)
  {
    event.onChannelReady(gCid);
  },
  
  onChannelReady : function(cid)
  {
    // We observe only our channel...
    if (gCid != cid)
      return;
      
    // List all scripts as soon as we are connected
    var request = new SieveListScriptRequest();
    request.addListScriptListener(event);
    request.addErrorListener(event);

    sivSendRequest(sid,gCid,request);
  },
  
  onChannelStatus : function(id,text,statusbar)
  {
    sivSetStatus(id,text,statusbar);
  },
  
  onBadCert : function(targetSite)
  {
    sivDisconnect(5,targetSite);
  },
  
  observe : function(aSubject, aTopic, aData)
  {
    if (aTopic != "network:offline-status-changed")
      return;
    
    if (aData == "offline")
      event.onOffline();
    
    if (aData == "online")
      sivConnect();    
  }
}

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
	
  sieveTreeView = new SieveTreeView(new Array(),event);	
  document.getElementById('treeImapRules').view = sieveTreeView;
	
	if (menuImapAccounts.selectedIndex == -1)
    menuImapAccounts.selectedIndex = 0;
    
  onSelectAccount();
  
  Cc["@mozilla.org/observer-service;1"]
      .getService (Ci.nsIObserverService)
      .addObserver(event,"network:offline-status-changed", false);  
}
   
function onWindowClose()
{
  // Don't forget to close this channel...
  sivDisconnect();
  
  Cc["@mozilla.org/observer-service;1"]
      .getService (Ci.nsIObserverService)
      .removeObserver(event,"network:offline-status-changed");  
 
  if (gAutoConfig)
  {
    gAutoConfig.cancel();
    gAutoConfig = null;
  }
    
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

function onActivateClick()
{
  var tree = document.getElementById('treeImapRules');  
  if (tree.currentIndex < 0)
    return;

  // imitate click in the treeview
  tree.view.cycleCell(tree.currentIndex,tree.columns.getColumnAt(1));
    
  return;
}

function onReconnectClick()
{
  sivConnect();   
}

function onGoOnlineClick()
{
  var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
  ioService.offline = false;  
 // sivConnect(null,true);
}

function sivConnect(account)
{
  var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
  
  if (ioService.offline)
    return sivSetStatus(6); 
  
  sivSetStatus(3,"progress.connecting","status.connecting");
  
  // Ensure that Sieve Object is null...
  var sivManager = Cc["@sieve.mozdev.org/transport-service;1"]
            .getService().wrappedJSObject;
  
  if (!account)
    account = getSelectedAccount();
 
  sid = sivManager.createSession(account.getKey());
  sivManager.addSessionListener(sid,event);
  
  gCid = sivManager.createChannel(sid);
  
  sivManager.openChannel(sid,gCid);
}

function sivSendRequest(sid,cid,request)
{
  // we do not send requests while in offline mode...
  var ioService = Cc["@mozilla.org/network/io-service;1"]
                      .getService(Ci.nsIIOService);  
    
  if (ioService.offline)
  {
    sivDisconnect(6);
    return;
  }
  
  // ... we are not so let's try. If the channel was closed...
  // ... getChannel will throw an exception.
  try
  {
    Cc["@sieve.mozdev.org/transport-service;1"]
        .getService().wrappedJSObject
        .getChannel(sid,cid)
        .addRequest(request);  
  }
  catch (e)
  {
    // most likely getChannel caused this exception, but anyway we should ...
    // ... display error message. If we do not catch the exception a timeout ...
    // ... would accure, so let's display the timeout message directly.
    
    gLogger.logStringMessage("SivFilerExplorer.sivSendRequest:");
    sivDisconnect(1,"warning.timeout");    
  }
}

function sivDisconnect(state,message)
{
  disableControls(true);
  
  if (state)
    sivSetStatus(state,message,"status.disconnected");  
  
  if ((!sid) || (!gCid))
    return;
    
  var sivManager = Cc["@sieve.mozdev.org/transport-service;1"]
                       .getService().wrappedJSObject;
  sivManager.removeSessionListener(sid, event);
  sivManager.closeChannel(sid,gCid);    
}

function onSelectAccount()
{
  if (gAutoConfig)
  {
    gAutoConfig.cancel();
    gAutoConfig = null;
  }
    
  sivDisconnect();
  
  // update the TreeView...
  var tree = document.getElementById('treeImapRules');
      
  tree.view.selection.clearSelection();
      
  sieveTreeView.update(new Array());
  tree.view = sieveTreeView;
      
  var account = getSelectedAccount();
      
  if (account == null)
    return sivSetStatus(2,"error.noaccount");
      
  // Disable and cancel if account is not enabled
  if ((!account.isEnabled()) || account.isFirstRun())
  {
    account.setFirstRun();
    return sivSetStatus(8);
  }
    
 // TODO wait for timeout or session close before calling connect again
 // otherwise we might endup using a closing channel. An isClosing function
 // and the follwoing code migh help to detect this...
 
/*  if (isClosing)
  setTimeout(function(){sivDisconnect(force=true); sivConnect(account)}, 1000);*/
    
  sivConnect(account);
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
  
  // delete the script...
  var request = new SieveDeleteScriptRequest(scriptName);
  request.addDeleteScriptListener(event);
  request.addErrorListener(event);
  
  sivSendRequest(sid,gCid,request);
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
    
  args["sieve"] = sid;
  args["uri"] = "x-sieve:"+sid+"/"+scriptName;
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



function sivSetStatus(state, message, statusbar)
{
  var strbundle = document.getElementById("strings");
  
  document.getElementById('sivExplorerWarning').setAttribute('hidden','true');
  document.getElementById('sivExplorerError').setAttribute('hidden','true');
  document.getElementById('sivExplorerWait').setAttribute('hidden','true');
  document.getElementById('sivExplorerBadCert').setAttribute('hidden','true');
  document.getElementById('sivExplorerOffline').setAttribute('hidden','true');
  document.getElementById('sivExplorerDisabled').setAttribute('hidden','true');
  document.getElementById('sivExplorerConnectionLost').setAttribute('hidden','true');
  
  document.getElementById('sivExplorerTree').setAttribute('collapsed','true');

  if (statusbar)
    document.getElementById('sbStatus').label = strbundle.getString(statusbar);  
  
  switch (state)
  {
    case 0: disableControls(false);            
            document.getElementById('sbStatus').label = strbundle.getString("status.connected");
            document.getElementById('sivExplorerTree').removeAttribute('collapsed');
            break;    
    case 1: document.getElementById('sivExplorerWarning').removeAttribute('hidden');
            document.getElementById('sivExplorerWarningMsg')
                .firstChild.nodeValue = strbundle.getString(message);
            break;
    // client error            
    case 2: document.getElementById('sivExplorerError').removeAttribute('hidden');
            document.getElementById('sivExplorerErrorMsg')
                .firstChild.nodeValue = strbundle.getString(message);    
            break;
    case 3: document.getElementById('sivExplorerWait').removeAttribute('hidden');
            document.getElementById('sivExplorerWaitMsg')
                .firstChild.nodeValue = strbundle.getString(message);    
            break;
    // server error
    case 4: document.getElementById('sivExplorerError').removeAttribute('hidden');
            document.getElementById('sivExplorerErrorMsg')
                .firstChild.nodeValue = message;    
            break;            
    case 5: document.getElementById('sivExplorerBadCert').removeAttribute('hidden');

            document.getElementById("btnIgnoreBadCert").setAttribute("message", message);
            document.getElementById("btnIgnoreBadCert").setAttribute("oncommand", 
              "onBadCertOverride(this.getAttribute('message'),document.getElementById('cbBadCertRemember').checked);");
              
            document.getElementById("btnAbortBadCert").setAttribute("oncommand", 
              "sivSetStatus(1,'warning.brokencert');");
                            
            break;
    // Offline Mode
    case 6: document.getElementById('sivExplorerOffline').removeAttribute('hidden');
            break;
    case 7: document.getElementById('txtSASL').value = message.getSasl();        
            document.getElementById('txtExtensions').value = message.getExtensions(true); 
            document.getElementById('txtImplementation').value = message.getImplementation();
            document.getElementById('txtVersion').value = "v"+message.getVersion().toFixed(2);
            document.getElementById('sivExplorerWait').removeAttribute('hidden');
            break;
    // account disabled
    case 8: document.getElementById('sivExplorerDisabled').removeAttribute('hidden');
            document.getElementById('sivAutoConfig').selectedIndex = message;
            break;  
    case 9: document.getElementById('sivExplorerConnectionLost').removeAttribute('hidden');
            break;
  }
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

function sivRename2(oldName, newName)
{
  var lEvent = 
  {    
    onRenameScriptResponse: function(response)
    {
      var request = new SieveListScriptRequest();
      request.addListScriptListener(event);
      request.addErrorListener(event);
  
      sivSendRequest(sid,gCid,request);           
    },
    onTimeout: function()
    {
      event.onTimeout();
    },
    onError: function(response)
    {
      //TODO Display notification instead of an popup box.
      alert(response.getMessage());
    }
  }
  
  var request = new SieveRenameScriptRequest(oldName, newName);
  request.addRenameScriptListener(lEvent)
  request.addErrorListener(lEvent);
    
  sivSendRequest(sid,gCid,request);
}

function sivRename(oldName, newName, isActive)
{
  var lEvent = 
  {
    oldScriptName  : null,    
    newScriptName  : null,
    isActive       : null,
    
    onGetScriptResponse: function(response)
    {
      var request = new SievePutScriptRequest(
                      new String(lEvent.newScriptName),
                      new String(response.getScriptBody()));

      request.addPutScriptListener(lEvent)
      request.addErrorListener(lEvent)
      
      sivSendRequest(sid,gCid,request);
    },    
    onPutScriptResponse: function(response)
    {
      
      if (lEvent.isActive == true)
      {
        var request = new SieveSetActiveRequest(lEvent.newScriptName)
      
        request.addSetActiveListener(lEvent);
        request.addErrorListener(event);
    
        sivSendRequest(sid,gCid,request);
      }
      else
        lEvent.onSetActiveResponse(null);
    },
    onSetActiveResponse: function(response)
    {
      // we redirect this request to event not lEvent!
      // because event.onDeleteScript is doing exactly what we want!
      var request = new SieveDeleteScriptRequest(lEvent.oldScriptName);
      request.addDeleteScriptListener(event);
      request.addErrorListener(event);
      
      sivSendRequest(sid,gCid,request);
    },
    onTimeout: function()
    {
      event.onTimeout();
    },
    onError: function(response)
    {
      //TODO Display notification instead of an popup box.
      alert("Renaming\r\n"+response.getMessage());
    }    
  }
  
  // As we are emulating rename, the server does not check for scripts with...
  // ... conflicting names. Instead it will overwrite such a script silently...
  // ... So we try hard and double check our cached scriptnames for possible...
  // ... conflicts inoder to prevent possible dataloss. 
  for(var i = 0; i < this.sieveTreeView.rules.length; i++)    
    if (this.sieveTreeView.rules[i].script == newName)
      return alert("Script already exists");
  
  lEvent.oldScriptName  = oldName;
  lEvent.newScriptName  = newName;
  lEvent.isActive =  (isActive=="true"?true:false);
      
  // first get the script and redirect the event to a local event...
  // ... in order to put it up under its new name an then finally delete it
  var request = new SieveGetScriptRequest(lEvent.oldScriptName);

  request.addGetScriptListener(lEvent);
  request.addErrorListener(event);

  sivSendRequest(sid,gCid,request);
  
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

  var canRename = Cc["@sieve.mozdev.org/transport-service;1"]
                    .getService().wrappedJSObject
                    .getChannel(sid,gCid)
                    .getCompatibility().renamescript  
    
    
  if (canRename)
   sivRename2(oldScriptName, input.value);
  else
   sivRename(oldScriptName, input.value, 
     tree.view.getCellValue(tree.currentIndex, tree.columns.getColumnAt(1)));   
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


function onBadCertOverride(targetSite,permanent)
{
  try
  {
    var overrideService = Cc["@mozilla.org/security/certoverride;1"]
                            .getService(Ci.nsICertOverrideService);

    var recentCertsSvc = Cc["@mozilla.org/security/recentbadcerts;1"]
                             .getService(Ci.nsIRecentBadCertsService);
                             
    var status = recentCertsSvc.getRecentBadCert(targetSite);    
    if (!status)
      throw "No certificate stored for taget Site..."

    var flags = ((status.isUntrusted)? overrideService.ERROR_UNTRUSTED : 0)
                  | ((status.isDomainMismatch)? overrideService.ERROR_MISMATCH : 0)
                  | ((status.isNotValidAtThisTime)? overrideService.ERROR_TIME : 0);      

    var cert = status.QueryInterface(Ci.nsISSLStatus).serverCert;
    if (!cert)
      throw "Status does not contain a certificate..."
                                                         
    overrideService.rememberValidityOverride(
      targetSite.split(":")[0], // Host Name with port (host:port)
      targetSite.split(":")[1],
      cert, 
      flags,
      !permanent);
      
    sivConnect();
  }
  catch (ex)
  {
    sivSetStatus(2,"error.brokencert");
    gLogger.logStringMessage("onBadCertOverride:"+ex); 
  }
 
}

/*
 *  Auto Config
 */ 

var gAutoConfig = null;

var gAutoConfigEvent =
{
  onSuccess : function(host,port,proxy)
  {
    sivSetStatus(8,2);
    
    getSelectedAccount().setActiveHost(0);
    getSelectedAccount().getHost().setPort(port);
    getSelectedAccount().setEnabled(true);
    
    gAutoConfig = null;
  },

  onError : function()
  {
    sivSetStatus(8,3);
    gAutoConfig = null;
  }
}

function onAutoConfigRunClick()
{
  if (gAutoConfig)
    gAutoConfig.cancel();
        
  gAutoConfig = new SieveAutoConfig();
  
  gAutoConfig.addHost(
    getSelectedAccount().getHost(0).getHostname(),
    4190,
    getSelectedAccount().getProxy().getProxyInfo());
    
  gAutoConfig.addHost(
    getSelectedAccount().getHost(0).getHostname(),
    2000,
    getSelectedAccount().getProxy().getProxyInfo());
  
  gAutoConfig.run(gAutoConfigEvent);
  
  sivSetStatus(8,1);
}

function onAutoConfigCancelClick()
{
  gAutoConfig.cancel();
  gAutoConfig = null;
  
  sivSetStatus(8,3);
}

function onAutoConfigFinishedClick()
{
  sivConnect();
}