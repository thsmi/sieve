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
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/libs/libManageSieve/SieveWatchDog.js"
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/libs/libManageSieve/SieveRequest.js"
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/libs/libManageSieve/SieveResponse.js"
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/SieveOverlay.js
 *   @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/editor/SieveFilterTreeView.js"
 */

const Cc = Components.classes;
const Ci = Components.interfaces;

/** @type {Sieve} */
var gSieve = null;
/** @type {int} */
var hSieve = null;

/** @type {{Components.interfaces.nsIConsoleService}}*/
var gLogger = null;
 
var sieveTreeView = null;
var closeTimeout = null;

var event = 
{	
  onAuthenticate: function(response)
  {
    sivSetStatus(3,"progress.authenticating");
    var account =  getSelectedAccount();
    
    // Without a username, we can skip the authentication 
    if (account.getLogin().hasUsername() == false)
    {
      event.onLoginResponse(null);
      return;
    }

    document.getElementById('txtSASL').value
        = response.getSasl();
    document.getElementById('txtExtensions').value    
        = response.getExtensions(); 
    document.getElementById('txtImplementation').value 
        = response.getImplementation();
    document.getElementById('txtVersion').value
        = response.getVersion();

    // We have to figure out which ist the best SASL Mechanism for the login ...
    // ... therefore we check first whether a mechanism is forced by the user ...
    // ... if no one is specified, we follow the rfc advice and use the first 
    // .... mechanism listed in the capability response we support.
    
    var mechanism = [];        
    if (account.getSettings().hasForcedAuthMechanism())
      mechanism = [account.getSettings().getForcedAuthMechanism()];      
    else
      mechanism = response.getSasl();

    // ... translate the SASL Mechanism String into an SieveSaslLogin Object ...      
    var request = null;
    while((mechanism.length > 0) && (request == null))
    {
      // remove and test the first element...
      switch (mechanism.shift().toLowerCase())
      {
        case "plain":
          request = new SieveSaslPlainRequest();
          request.addSaslPlainListener(event);      
          break;
        case "crammd5":
          request = new SieveSaslCramMd5Request();
          request.addSaslCramMd5Listener(event);
          break;          
        case "login":
          // we use SASL LOGIN only as last resort...
          // ... as suggested in the RFC.        
          if (mechanism.length > 0)
          {
            mechanism.push("login");
            break;
          }
          request = new SieveSaslLoginRequest();      
          request.addSaslLoginListener(event);
          break;
      }      
    }

    if (request == null)
    {
      sivDisconnect(2, "error.sasl");
      return;
    }
    
    request.addErrorListener(event);
    request.setUsername(account.getLogin().getUsername())
    
    var password = account.getLogin().getPassword();
    
    if (password == null)
    {
      sivDisconnect(2, "error.authentication");
      return;
    }
      
    request.setPassword(password);
    
    // check if the authentication method supports proxy authorization...
    if (request.isAuthorizable())
    {
      // ... if so retrieve the authorization identity   
      var authorization = account.getAuthorization().getAuthorization();
      if (authorization == null)
      {
        sivDisconnect(2, "error.authentication");
        return;
      }
      
      request.setAuthorization(authorization);
    }
     
    gSieve.addRequest(request);    		
    
  },
  
  onInitResponse: function(response)
  {
    // establish a secure connection if TLS ist enabled and if the Server ...
    // ... is capable of handling TLS, otherwise simply skip it and ...
    // ... use an insecure connection
    
    gSieve.setCompatibility(response.getCapabilities());
    
    if (getSelectedAccount().getHost().isTLS() && response.getTLS())
    {
      var request = new SieveStartTLSRequest();
      request.addStartTLSListener(event);
      request.addErrorListener(event);
      
      gSieve.addRequest(request);
      return;
    }
    
    event.onAuthenticate(response);
  },

  onStartTLSResponse : function(response)
  {
    
    // workaround for timsieved bug...
    var lEvent = 
    {        
      onInitResponse: function(response)
      {
        sivSetStatus(3,"progress.tls.rfc");
        
        gSieve.getWatchDogListener().setTimeoutInterval();
        event.onAuthenticate(response);
      },
      
      onError: function(response)
      {
        gSieve.getWatchDogListener().setTimeoutInterval();
        event.onError(response);
      },
      
      onTimeout: function()
      {
        sivSetStatus(3,"progress.tls.cyrus");
        
        gSieve.getWatchDogListener().setTimeoutInterval();
        var request = new SieveCapabilitiesRequest();
        request.addCapabilitiesListener(event);
        request.addErrorListener(event);	
		
        gSieve.addRequest(request);
      }    	
    }
    	  
    // after calling startTLS the server will propagate his capabilities...
    // ... like at the login, therefore we reuse the SieveInitRequest
    
    // some revision of timsieved fail to resissue the capabilities...
    // ... which causes the extension to be jammed. Therefore we have to ...
    // ... do a rather nasty workaround. The jammed extension causes a timeout,
    // ... we catch this timeout and continue as if nothing happend...
    
    var compatibility = getSelectedAccount().getSettings().getCompatibility(); 
    
    switch (compatibility.getHandshakeMode())
    {
      case 0:
        sivSetStatus(3,"progress.tls.auto");      
        var request = new SieveInitRequest();
        request.addInitListener(lEvent);
        request.addErrorListener(lEvent);
        
        gSieve.getWatchDogListener().setTimeoutInterval(compatibility.getHandshakeTimeout());
        gSieve.addRequest(request);
            
        gSieve.startTLS();   
        break;
        
      case 1:
        sivSetStatus(3,"progress.tls.rfc");
             
        var request = new SieveInitRequest();
        request.addInitListener(lEvent);
        request.addErrorListener(event);  
        gSieve.addRequest(request);
    
        // activate TLS
        gSieve.startTLS();
        
        break;
      case 2:
        sivSetStatus(3,"progress.tls.cyrus");
      
        gSieve.startTLS();
      
        var request = new SieveCapabilitiesRequest();
        request.addCapabilitiesListener(event);
        request.addErrorListener(event);  
    
        gSieve.addRequest(request);
        break;
    }
  },
	
  onSaslLoginResponse: function(response)
  {
    event.onLoginResponse(response);
  },

	
  onSaslPlainResponse: function(response)
  {
    event.onLoginResponse(response);
  },

  onSaslCramMd5Response: function(response)
  {
    event.onLoginResponse(response);
  },
   
  onLoginResponse: function(response)
  { 		
    // List all scripts as soon as we are connected
    var request = new SieveListScriptRequest();
    request.addListScriptListener(event);
    request.addErrorListener(event);

    gSieve.addRequest(request);
    
    // Show List View...
    sivSetStatus(0);
  },
	
  onLogoutResponse: function(response)
  {
    clearTimeout(closeTimeout);
    
    sivDisconnect();
    // this will close the Dialog!
    close();
  },

  onListScriptResponse: function(response)
  {
    sieveTreeView.update(response.getScripts());
    
    var tree = document.getElementById('treeImapRules');
    tree.view = sieveTreeView;
    
    // always select something
    if ((tree.currentIndex < 0) && (tree.view.rowCount > 0))
      tree.view.selection.select(0);
  },

  onSetActiveResponse: function(response)
  {
    // Always refresh the table ...
    var request = new SieveListScriptRequest();
    request.addListScriptListener(event);
    request.addErrorListener(event);
    
    gSieve.addRequest(request);
  },

  onDeleteScriptResponse:  function(response)
  {
    // Always refresh the table ...
    var request = new SieveListScriptRequest();
    request.addListScriptListener(event);
    request.addErrorListener(event);
    
    gSieve.addRequest(request);
  },
  
  onCapabilitiesResponse: function(response)
  {
    event.onAuthenticate(response);
  },

  onTimeout: function()
  {
    var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
    
    if (ioService.offline)
      sivSetStatus(6);
    else
      sivDisconnect(1,"warning.timeout");
  },
	
  onError: function(response)
  {
    var code = response.getResponseCode();

    if (code instanceof SieveResponseCodeReferral)
    {
      // close the old sieve connection
      sivDisconnect();
      
      var account = getSelectedAccount();

      sivConnect(account,code.getHostname());
      
      return;
    }

    gLogger.logStringMessage("OnError: "+response.getMessage());
    sivDisconnect(4,response.getMessage());
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
    
    gSieve.addRequest(request);
  },
  
  onIdle: function ()
  { 
    // as we send a keep alive request, we don't care
    // about the response...
    var request = null
    
    if (gSieve.getCompatibility().noop)
      request = new SieveNoopRequest();
    else
      request = new SieveCapabilitiesRequest();

    request.addErrorListener(event);
  
    gSieve.addRequest(request);
  },
    
  onWatchDogTimeout : function()
  {
    // call sieve object indirect inoder to prevent a 
    // ring reference
    gSieve.onWatchDogTimeout();
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
    if (accounts[i].isEnabled() == false)
      menuImapAccounts.appendItem(
        accounts[i].getDescription(),
        accounts[i].getKey(),"- disabled").disabled = true;
    else
      menuImapAccounts.appendItem( 
        accounts[i].getDescription(),
        accounts[i].getKey(),"").disabled = false;

    if (window.arguments.length == 0)
      continue;
    
    if (window.arguments[0].server != accounts[i].getUri())
      continue;
      
    menuImapAccounts.selectedIndex = i;      
  }
	
  sieveTreeView = new SieveTreeView(new Array(),event);	
  document.getElementById('treeImapRules').view = sieveTreeView;
	
	if (menuImapAccounts.selectedIndex == -1)
    menuImapAccounts.selectedIndex = 0;
    
  onSelectAccount();
}
   
function onWindowClose()
{
  // unbind the logger inoder to prevent xpcom memory holes
  gLogger = null;
  
  if (gSieve == null)
    return true;
  
    
  // Force disconnect in 500 MS
  closeTimeout = setTimeout(function() {sivDisconnect(); close();},250);

  var request = new SieveLogoutRequest(event)
  request.addLogoutListener(event);
  request.addErrorListener(event)
  
  gSieve.addRequest(request);

  return false;
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

function onGoOnlineClick()
{
  var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
  ioService.offline = false;  
  sivConnect();
}

function sivConnect(account,hostname)
{
  var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
  
  if (ioService.offline)
    return sivSetStatus(6); 
  
  sivSetStatus(3,"progress.connecting","status.connecting");
  
  if (account == null)
    account = getSelectedAccount();
  
  if (hostname == null)
    hostname = account.getHost().getHostname();

  var sivManager = Cc["@sieve.mozdev.org/transport-service;1"].getService();

  hSieve = sivManager.wrappedJSObject.openSession();  
  gSieve = sivManager.wrappedJSObject.getSession(hSieve);
  // TODO Replace by a real Interface...
  //sieveTransport.QueryInterface(Ci.sivITransport);

   gSieve.setDebugLevel(
            account.getSettings().getDebugFlags(),
            gLogger);                
      
   var sieveWatchDog = null;

   // TODO load Timeout interval from account settings...
   if (account.getSettings().isKeepAlive())
     sieveWatchDog = new SieveWatchDog(20000,account.getSettings().getKeepAliveInterval());
   else
     sieveWatchDog = new SieveWatchDog(20000);
     
   sieveWatchDog.addListener(event);       
   gSieve.addWatchDogListener(sieveWatchDog);
   
   var request = new SieveInitRequest();
   request.addErrorListener(event)
   request.addInitListener(event)
   gSieve.addRequest(request);   

   gSieve.connect(hostname,account.getHost().getPort(),
            account.getHost().isTLS(),
            new BadCertHandler(gLogger),
            account.getProxy().getProxyInfo());
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

function sivDisconnect(state,message)
{
  disableControls(true);
  
  if ((state) && (message))
    sivSetStatus(state,message,"status.disconnected");  
  
  if (gSieve == null)
    return;        
  
  var sivManager = Cc["@sieve.mozdev.org/transport-service;1"].getService();  
  sivManager.wrappedJSObject.closeSession(hSieve);  
  

  gSieve = null;  
}

function onSelectAccount()
{	
  // Override the response handler. We should always logout before reconnecting...
  var levent = 
  {
    onLogoutResponse: function(response)
    {
      
      sivDisconnect();
      
      // update the TreeView...
      var tree = document.getElementById('treeImapRules');
      
      tree.view.selection.clearSelection();
      
      sieveTreeView.update(new Array());
      tree.view = sieveTreeView;
      
      var account = getSelectedAccount();
      
      if (account == null)
        sivSetStatus(2,"error.noaccount");
      
      // Disable and cancel if account is not enabled
      if (account.isEnabled() == false)
      {
        sivSetStatus(1,"warning.noaccount");
        return;
      }			
      sivConnect(account);
    }
  }
  
  // Besteht das Objekt überhaupt bzw besteht eine Verbindung?
  if ((gSieve == null) || (gSieve.isAlive() == false))
  {
    // ... no sieve object, let's simulate a logout...
    setTimeout(function() {levent.onLogoutResponse("");},10);
    //levent.onLogoutResponse("");
    return;
  }
   
  var request = new SieveLogoutRequest();
  request.addLogoutListener(levent);
  request.addErrorListener(event);
  gSieve.addRequest(request);	
}

function onDeleteClick()
{
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
  
  var tree = document.getElementById('treeImapRules');
  
  if (tree.currentIndex == -1)
    return;
  
  var scriptName = new String(tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(0)));	
  
  // delete the script...
  var request = new SieveDeleteScriptRequest(scriptName);
  request.addDeleteScriptListener(event);
  request.addErrorListener(event);
  
  gSieve.addRequest(request);
}
/**
 * @param {String} scriptName
 * @param {String} scriptBody
 */
function sivOpenEditor(scriptName,scriptBody)
{
  // The scope of listners is bound to a window. This makes passing the Sieve...
  // ... object to an other window difficult. At first we have to deattach the... 
  // ... listener, then pass the object, and finally attach a new listern of...
  // ... the new window   
  var watchDogListener = gSieve.getWatchDogListener();
  gSieve.removeWatchDogListener();
  
  gSieve = null;
  
  var args = new Array();
  args["scriptName"] = scriptName;
  args["scriptBody"] = scriptBody;
  args["sieve"] = hSieve;
  args["compile"] = getSelectedAccount().getSettings().hasCompileDelay();
  args["compileDelay"] = getSelectedAccount().getSettings().getCompileDelay();
  args["idle"] = getSelectedAccount().getSettings().isKeepAlive();
  args["idleDelay"] = getSelectedAccount().getSettings().getKeepAliveInterval();

  window.openDialog("chrome://sieve/content/editor/SieveFilterEditor.xul", 
                    "SieveFilterEditor", 
                    "chrome,modal,titlebar,resizable,centerscreen", args);

  // make sure there is only one instance of the sieve object...
  var sivManager = Cc["@sieve.mozdev.org/transport-service;1"].getService();  
  gSieve = sivManager.wrappedJSObject.getSession(hSieve);  
  
  gSieve.addWatchDogListener(watchDogListener);
  
  var request = new SieveListScriptRequest();
  request.addListScriptListener(event);
  request.addErrorListener(event);
  
  gSieve.addRequest(request);
  
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
            document.getElementById("btnIgnoreBadCert").setAttribute("oncommand",
                "onBadCertOverride('"+message+"',document.getElementById('cbBadCertRemember').checked)");
            document.getElementById("btnAbortBadCert").setAttribute("oncommand",
                "sivSetStatus(1,'warning.brokencert')");            
            break;
    // Offline Mode
    case 6: document.getElementById('sivExplorerOffline').removeAttribute('hidden');
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
  
      gSieve.addRequest(request);            
    }
  }
  
  var request = new SieveRenameScriptRequest(oldName, newName);
  request.addRenameScriptListener(lEvent)
  request.addErrorListener(event);
    
  gSieve.addRequest(request)
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
      request.addErrorListener(event)
      gSieve.addRequest(request);  
    },    
    onPutScriptResponse: function(response)
    {
      
      if (lEvent.isActive == true)
      {
        var request = new SieveSetActiveRequest(lEvent.newScriptName)
      
        request.addSetActiveListener(lEvent);
        request.addErrorListener(event);
    
        gSieve.addRequest(request);
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
      gSieve.addRequest(request);
    }     
  }
  
  lEvent.oldScriptName  = oldName;
  lEvent.newScriptName  = newName;
  lEvent.isActive =  (isActive=="true"?true:false);
      
  // first get the script and redirect the event to a local event...
  // ... in order to put it up under its new name an then finally delete it
  var request = new SieveGetScriptRequest(lEvent.oldScriptName);

  request.addGetScriptListener(lEvent);
  request.addErrorListener(event);

  gSieve.addRequest(request);   
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

  if (gSieve.getCompatibility().renamescript)
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
                  | ((status.isNotVaildAtThisTime)? overrideService.ERROR_TIME : 0);      

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
    gLogger.logStringMessage(ex); 
  }
                                           
  
}



/******************************************************************************/
// Helper class to override the "bad cert" dialog...
// see nsIBadCertListener for details

/* This object implements nsIBadCertListener2
 * The idea is to suppress the default UI's alert box
 * and allow the exception to propagate normally
 */

function BadCertHandler(logger) 
{
  this.logger = logger;
}
 
BadCertHandler.prototype.getInterface =
  function (aIID)
{
     return this.QueryInterface(aIID);
}
 
BadCertHandler.prototype.QueryInterface =
  function badcert_queryinterface(aIID)
{
  if (aIID.equals(Ci.nsIBadCertListener2) ||
      aIID.equals(Ci.nsIBadCertListener) || // TB2 compatibility  
      aIID.equals(Ci.nsISSLErrorListener) ||
      aIID.equals(Ci.nsIInterfaceRequestor) ||
      aIID.equals(Ci.nsISupports))
      {
        return this;
      }
 
     throw Components.results.NS_ERROR_NO_INTERFACE;
 }

// nsIBadCertListener implementation for Thunderbird 2...
/**
 * @deprecated removed from Thunderbird 3
 * @param {} socketInfo
 * @param {} cert
 * @param {} certAddType
 * @return {Boolean}
 */
BadCertHandler.prototype.confirmUnknownIssuer
    = function(socketInfo, cert, certAddType) 
{ 
  if (this.logger != null)
    this.logger.logStringMessage("Sieve BadCertHandler: Unknown issuer");
      
  return true;
}

/**
 * @deprecated removed from Thunderbird 3
 * @param {} socketInfo
 * @param {} targetURL
 * @param {} cert
 * @return {Boolean}
 */

BadCertHandler.prototype.confirmMismatchDomain
    = function(socketInfo, targetURL, cert) 
{
  if (this.logger != null)
    this.logger.logStringMessage("Sieve BadCertHandler: Mismatched domain");

  return true;
}

/**
 * @deprecated removed from Thunderbird 3
 * @param {} socketInfo
 * @param {} cert
 * @return {Boolean}
 */
BadCertHandler.prototype.confirmCertExpired
    = function(socketInfo, cert) 
{
  if (this.logger != null)
    this.logger.logStringMessage("Sieve BadCertHandler: Expired certificate");

  return true;
}

/**
 * @deprecated removed from Thunderbird 3
 * @param {} socketInfo
 * @param {String} targetURL
 * @param {} cert
 */
BadCertHandler.prototype.notifyCrlNextupdate
   = function(socketInfo, targetURL, cert) 
{
  if (this.logger != null)
    this.logger.logStringMessage("Sieve BadCertHandler: notifyCrlNextupdate");
}
 

// nsIBadCertListener2 implementation for Thunderbird 3...

 /* Returning true in the following two callbacks
  * means suppress default the error UI (modal alert).
  */
 /**
  * @param {} socketInfo
  * @param {} sslStatus
  * @param {String} targetSite
  * @return {Boolean}
  */
 BadCertHandler.prototype.notifyCertProblem
     = function (socketInfo, sslStatus, targetSite)
 {
   this.logger.logStringMessage("Sieve BadCertHandler: notifyCertProblem");
       
   sivDisconnect(5,targetSite);
  
   return true;
 }

 BadCertHandler.prototype.notifySSLError =
 function badcert_notifySSLError(socketInfo, error, targetSite)
 {
   this.logger.logStringMessage("Sieve BadCertHandler: notifySSLError");
   return true;
 }