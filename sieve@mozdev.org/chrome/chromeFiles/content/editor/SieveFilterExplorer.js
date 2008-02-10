
  // TODO make sure that the scripts are imported only once.
  // TODO place imports in the corresponding files like the header import in c...
  
  // Load all the Libraries we need...
  var jsLoader = Components
                   .classes["@mozilla.org/moz/jssubscript-loader;1"]
                   .getService(Components.interfaces.mozIJSSubScriptLoader);
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveAccounts.js");
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/Sieve.js");
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveRequest.js");
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveResponse.js");    
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveResponseParser.js");        
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveResponseCodes.js");
  jsLoader
    .loadSubScript("chrome://sieve/content/editor/SieveFiltersTreeView.js");

  // we are done importing script, so free ... 
  // ... the loader inorder to prevent XPCOM leaks
  jsLoader = null;


var gSieve = null;

// contains a [@mozilla.org/consoleservice;1] interface
var gLogger = null; 
 
var sieveTreeView = null;
var closeTimeout = null;
var accounts = new Array();

var gSieveWatchDog =
{
  timeout         : null,
  timeoutInterval : null,
  
  idle            : null,
  idleInterval    : null,
    
  onAttach : function(timeoutInterval, idleInterval)
  {
    gSieveWatchDog.timeoutInterval = timeoutInterval;
    gSieveWatchDog.idleInterval = idleInterval;
  },
  
  onDeattach : function()
  {
    if (gSieveWatchDog == null)
      return;
      
    if (gSieveWatchDog.timeout != null)
      clearTimeout(gSieveWatchDog.timeout);
    
    if (gSieveWatchDog.idle != null)
      clearTimeout(gSieveWatchDog.idle);
    
    return;
  },  
  
  onStart: function()
  {    
    gSieveWatchDog.timeout 
      = setTimeout(function() {gSieveWatchDog.onTimeout();},
                   gSieveWatchDog.timeoutInterval);
    
    return;    
  },
  
  onStop: function()
  {
    clearTimeout(gSieveWatchDog.timeout);
    gSieveWatchDog.timeout = null;
    
    if (gSieveWatchDog.idleInterval == null)
      return;
      
    if (gSieveWatchDog.idle != null)
      clearTimeout(gSieveWatchDog.idle);
    
    gSieveWatchDog.idle 
      = setTimeout(function() {gSieveWatchDog.onIdle();},
                   gSieveWatchDog.idleInterval);
    
    return;
  },
  
  onIdle: function ()
  {
    //alert('onIdle');
    // we simply do notihng in case of an error...
    var lEvent = 
    {
      onCapabilitiesResponse: function() {},
      onTimeout: function() { alert('Timeout2');},
      onError: function() {alert('Error2');}
    }
    
    if (gSieveWatchDog.idle != null)
      clearTimeout(gSieveWatchDog.idle);
          
    gSieveWatchDog.idle = null;
    
    var request = new SieveCapabilitiesRequest();
    request.addCapabilitiesListener(lEvent);
    request.addErrorListener(lEvent);
  
    // create a sieve request without an eventhandler...
    gSieve.addRequest(request);
  },
  
  onTimeout: function()
  {
    gSieveWatchDog.timeout = null;
    gSieve.onWatchDogTimeout();
  }  
}

var event = 
{	
  onAuthenticate: function(response)
  {
    
    var account =  getSelectedAccount();
    
    // Without a username, we can skip the authentication 
    if (account.getLogin().hasUsername() == false)
    {
      event.onLoginResponse(null);
      return;
    }


    // We have to figure out which ist the best SASL Mechanism for the login ...
    // ... therefore we check first whether a mechanism is forced by the user ...
    // ... if no one is specified, we follow the rfc advice and use the first 
    // .... mechanism listed in the capability response.
    var mechanism = null;        
    if (account.getSettings().hasForcedAuthMechanism())
      mechanism = account.getSettings().getForcedAuthMechanism();
    else
      mechanism = response.getSasl()[0];

    document.getElementById('txtSASL').value
        = response.getSasl();
    document.getElementById('txtExtensions').value    
        = response.getExtensions(); 
    document.getElementById('txtImplementation').value 
        = response.getImplementation();
          
    // ... translate the SASL Mechanism String into an SieveSaslLogin Object ...
    var request = null;  
    switch (mechanism.toLowerCase())
    {
      case "login":
        request = new SieveSaslLoginRequest();      
  	    request.addSaslLoginListener(event);
        break;
      case "plain":
      default: // plain is always the fallback...
        request = new SieveSaslPlainRequest();
   	    request.addSaslPlainListener(event); 	    
        break;        
    }

    request.addErrorListener(event);
    request.setUsername(account.getLogin().getUsername())
    
    var password = account.getLogin().getPassword();
    
    // TODO: terminate connection in case of an invalid password
    // and notify the user
    if (password == null)
    {
      sivSetStatus(2, "Error: Unable to retrieve Authentication information.");
      return;
    }
      
    request.setPassword(password);
    
    var authorization = account.getAuthorization().getAuthorization();
    // TODO: terminate connection an notify that authorization settings
    // are invalid...
    if (authorization == null)
    {
      sivSetStatus(2, "Error: Unable to retrieve Authorization information");
      return;
    }
      
    request.setAuthorization(authorization);
    
    gSieve.addRequest(request);    		
    
  },
  
  onInitResponse: function(response)
	{    	
    	// establish a secure connection if TLS ist enabled and if the Server ...
    	// ... is capable of handling TLS, otherwise simply skip it and ...
    	// ... use an insecure connection
    	
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
        event.onAuthenticate(response);
      },
      
      onError: function(response)
      {
        event.onError(response);
      },
      
      onTimeout: function()
      {
        var request = new SieveCapabilitiesRequest();
        request.addCapabilitiesListener(event);
        request.addErrorListener(event);	
		
        gSieve.addRequest(request)
      }    	
    }
    	  
    // after calling startTLS the server will propagate his capabilities...
    // ... like at the login, therefore we reuse the SieveInitRequest
    
    // some revision of timsieved fail to resissue the capabilities...
    // ... which causes the extension to be jammed. Therefore we have to ...
    // ... do a rather nasty workaround. The jammed extension causes a timeout,
    // ... we catch this timeout and continue as if nothing happend...
    
	  var request = new SieveInitRequest();
	  request.addInitListener(lEvent);
	  request.addErrorListener(lEvent);
	  	  
	  gSieve.addRequest(request);
	  
    // activate TLS
	  gSieve.startTLS(true);
	},
	
  onSaslLoginResponse: function(response)
  {
    event.onLoginResponse(response);
  },

	
  onSaslPlainResponse: function(response)
  {
    event.onLoginResponse(response);
  },
	
	onLoginResponse: function(response)
	{
    // enable the disabled controls....
    disableControls(false);
    postStatus("Connected");
		
    // List all scripts as soon as we are connected
    var request = new SieveListScriptRequest();
    request.addListScriptListener(event);
    request.addErrorListener(event);

    gSieve.addRequest(request);	  	  
    disableControls(false);
    sivSetStatus(4);
	},
	
	onLogoutResponse: function(response)
	{
	  clearTimeout(closeTimeout);
	  
		if (gSieve.isAlive())
			gSieve.disconnect();
		
		// this will close the Dialog!
		close();		
	},
	
	onListScriptResponse: function(response)
	{
		if (response.hasError())
		{
			alert("Command \"Listscripts\" failed");
			return
		}
		
		sieveTreeView.update(response.getScripts());

		var tree = document.getElementById('treeImapRules');
		tree.view = sieveTreeView;
		
		// allways select something
		if ((tree.currentIndex == -1) && (tree.view.rowCount > 0))
			tree.view.selection.select(0);
	},
	
	onSetActiveResponse: function(response)
	{
		if (response.hasError())
			alert("Command \"setActive\" failed");
		
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
	  disableControls(true);
	  if (gSieve.isAlive())
			gSieve.disconnect();

    alert("Timeout...");
    sivSetStatus(1, "The connection has timed out, the Server is not responding...");
	},
	
  onError: function(response)
  {
    var code = response.getResponseCode();

    if (code instanceof SieveRespCodeReferral)
    {
      disableControls(true);
      // close the old sieve connection
      gSieve.disconnect();
        
      postStatus("Referral to "+code.getHostname()+" ...");
      
      var account = getSelectedAccount();

      gSieve = new Sieve(
                    code.getHostname(),
                    account.getHost().getPort(),
                    account.getHost().isTLS(),
                    (account.getSettings().isKeepAlive() ?
                        account.getSettings().getKeepAliveInterval():
                        null));
                                                   
      gSieve.setDebugLevel(
               account.getSettings().getDebugFlags(),
               gLogger);
                      
      var request = new SieveInitRequest();
      request.addErrorListener(event)
      request.addInitListener(event)
      gSieve.addRequest(request);

      gSieve.addWatchDogListener(gSieveWatchDog);		    
      gSieve.connect();
      
      return;
    }

   alert("Error:"+response.getMessage());
    sivSetStatus(2, "Action failed server reported an error...\n"+response.getMessage());
  },
  
  onCycleCell: function(row,col,script,active)
  {
  	var request = null;
    if (active == true)
      request = new SieveSetActiveRequest();
    else
      request = new SieveSetActiveRequest(script)
      
    request.addSetScriptListener(event);
    request.addErrorListener(event);
    
    gSieve.addRequest(request);
  }
  
}

function onWindowLoad()
{

//	var actList = document.getElementById("conImapAcct");
//	var actpopup = document.createElement("menupopup");
//	actList.appendChild(actpopup);

  // now create a logger session...
  gLogger = Components.classes["@mozilla.org/consoleservice;1"]
                    .getService(Components.interfaces.nsIConsoleService);  
  
  var menuImapAccounts = document.getElementById("menuImapAccounts");

  accounts = (new SieveAccounts()).getAccounts();

  for (var i = 0; i < accounts.length; i++)
  {   
    if (accounts[i].isEnabled() == false)
      menuImapAccounts.appendItem( accounts[i].getDescription(),"","- disabled").disabled = true;
    else
      menuImapAccounts.appendItem( accounts[i].getDescription(),"","").disabled = false;

    if ((window.arguments[0] instanceof Components.interfaces.nsIDialogParamBlock)
           && (window.arguments[0].GetString(0) == accounts[i].getUri()))
    {
      menuImapAccounts.selectedIndex = i;
    }
      
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
  closeTimeout = setTimeout("gSieve.disconnect(); close();",250);

  var request = new SieveLogoutRequest(event)
  request.addLogoutListener(event);
  request.addErrorListener(event)
  
  gSieve.addRequest(request);

  return false;
}   

function getSelectedAccount()
{
    var menu = document.getElementById("menuImapAccounts")
    return accounts[menu.selectedIndex];
}

function onSelectAccount()
{
	var logoutTimeout = null;	
	// Override the unsual request handler because we have to logout first
	var levent = 
	{
		onLogoutResponse: function(response)
		{
			clearTimeout(logoutTimeout);
			if ((gSieve != null) && (gSieve.isAlive()))
				gSieve.disconnect();

      // always clear the TreeView
      var tree = document.getElementById('treeImapRules');
   		tree.currentIndex = -1;
     	sieveTreeView.update(new Array());
	    tree.view = sieveTreeView;

      var account = getSelectedAccount();
		
		  disableControls(true);
			// Disable and cancel if account is not enabled
			if (account.isEnabled() == false)
			{			    
				postStatus("Not connected! Goto 'Tools -> Sieve Settings' to activate this account")
				return;
			}			

			postStatus("Connecting...");
			sivSetStatus(3);

      // when pathing this lines always keep refferal code in sync
      gSieve = new Sieve(
                    account.getHost().getHostname(),
                    account.getHost().getPort(),
                    account.getHost().isTLS(),
                    (account.getSettings().isKeepAlive() ?
                        account.getSettings().getKeepAliveInterval():
                        null));

      gSieve.setDebugLevel(
               account.getSettings().getDebugFlags(),
               gLogger);                

      var request = new SieveInitRequest();
      request.addErrorListener(event)
      request.addInitListener(event)
      gSieve.addRequest(request);
  
      gSieve.addWatchDogListener(gSieveWatchDog);	
      gSieve.connect();
    }
  }

	// Besteht das Objekt überhaupt bzw besteht eine Verbindung?
	if ((gSieve == null) || (gSieve.isAlive() == false))
	{
		// beides schein nicht zu existieren, daher connect direkt aufrufen...
		levent.onLogoutResponse("");
		return
	}
	
	// hier haben wir etwas weniger Zeit ...
	logoutTimeout = setTimeout("levent.onLogoutResponse(\"\")",250);
	
    /*if (keepAliveInterval != null)
    {
    	clearInterval(keepAliveInterval);
    	keepAliveInterval = null;
    }*/
  var request = new SieveLogoutRequest();
  request.addLogoutListener(levent);
  request.addErrorListener(event);
	gSieve.addRequest(request);	
}

function onDeleteClick()
{
  var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                  .getService(Components.interfaces.nsIPromptService);
  	
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

function sivOpenEditor(scriptName,scriptBody)
{
  // The listner is bound to a window object. This makes passing the Sieve...
  // ... object to an other window difficult. At first we have to deattach the 
  // listener then pass the object, and finally attach a new listern of the new
  // window   
  gSieve.removeWatchDogListener();
  
  var args = new Array();
  args["scriptName"] = scriptName;
  args["scriptBody"] = scriptBody;
  args["sieve"] = gSieve;
  args["compile"] = getSelectedAccount().getSettings().hasCompileDelay();
  args["compileDelay"] = getSelectedAccount().getSettings().getCompileDelay();

  window.openDialog("chrome://sieve/content/editor/SieveFilterEditor.xul", 
                    "SieveFilterEditor", 
                    "chrome,modal,titlebar,resizable,centerscreen", args);

  gSieve.addWatchDogListener(gSieveWatchDog);
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

  var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                  .getService(Components.interfaces.nsIPromptService);

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
  if (tree.currentIndex == -1)
    return;

  var scriptName = new String(tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(0)));
  
  sivOpenEditor(scriptName);
    
  return;
}

function sivSetStatus(state, message)
{
  document.getElementById('sivExplorerWarning').setAttribute('hidden','true');
  document.getElementById('sivExplorerError').setAttribute('hidden','true');
  document.getElementById('sivExplorerWait').setAttribute('hidden','true');
  document.getElementById('sivExplorerTree').setAttribute('collapsed','true');
  
  switch (state)
  {
    case 1: document.getElementById('sivExplorerWarning').removeAttribute('hidden');
            document.getElementById('sivExplorerWarningMsg').value = message;
            break;
    case 2: document.getElementById('sivExplorerError').removeAttribute('hidden');
            document.getElementById('sivExplorerWarningMsg').value = message;    
            break;
    case 3: document.getElementById('sivExplorerWait').removeAttribute('hidden');
            break;
    case 4: document.getElementById('sivExplorerTree').removeAttribute('collapsed');
            break
  }
  
}

function postStatus(message)
{
  document.getElementById('sbStatus').label = message;
}

function disableControls(disabled)
{
  if (disabled)
  {    
    document.getElementById('newButton').setAttribute('disabled','true');
    document.getElementById('editButton').setAttribute('disabled','true');
    document.getElementById('deleteButton').setAttribute('disabled','true');
    document.getElementById('renameButton').setAttribute('disabled','true');   
    document.getElementById('treeImapRules').setAttribute('disabled','true');
    document.getElementById('btnServerDetails').setAttribute('disabled','true');
    document.getElementById('vbServerDetails').setAttribute('hidden','true');
  }
  else
  {    
    document.getElementById('newButton').removeAttribute('disabled');
    document.getElementById('editButton').removeAttribute('disabled');
    document.getElementById('deleteButton').removeAttribute('disabled');
    document.getElementById('renameButton').removeAttribute('disabled');
    document.getElementById('treeImapRules').removeAttribute('disabled');
    document.getElementById('btnServerDetails').removeAttribute('disabled');      
  }
}

function onRenameClick()
{
  
  var lEvent = 
  {
    oldScriptName : null,    
    newScriptName : null,
    
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
      // we redirect this request to event not lEvent!
      // because event.onDeleteScript is doing exactly what we want!
      var request = new SieveDeleteScriptRequest(lEvent.oldScriptName);
      request.addDeleteScriptListener(event);
      request.addErrorListener(event);
      gSieve.addRequest(request);
    }    	
  }

  var tree = document.getElementById('treeImapRules');

  if (tree.currentIndex == -1)
    return;


  lEvent.oldScriptName = new String(tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(0)));
  
  // TODO remember if the Script is active

  var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                  .getService(Components.interfaces.nsIPromptService);

  input = {value:lEvent.oldScriptName};
  check = {value:false};

  var result
       = prompts.prompt(
           window,
           "Rename Sieve Script",
           "Enter the new name for your Sieve script ",
           input, null, check);

  // Did the User cancel the dialog?
  if (result != true)
    return;

  lEvent.newScriptName = input.value;
  
  // it the old name equals the new name, ignore the request.
  if (lEvent.newScriptName.toLowerCase() == lEvent.oldScriptName.toLowerCase())
    return;   

  // first get the script and redirect the event to a local event...
  // ... in order to put it up under its new name an then finally delete it
  var request = new SieveGetScriptRequest(lEvent.oldScriptName);

  request.addGetScriptListener(lEvent);
  request.addErrorListener(event);

  gSieve.addRequest(request);	
}

function onServerDetails()
{
  var el = document.getElementById("vbServerDetails");  
  var img = document.getElementById("imgServerDetails");
    
  if (el.hidden == true)
  {    
    el.removeAttribute('hidden');
    img.setAttribute('src','chrome://global/skin/tree/twisty-clsd.png');
  }
  else
  {
    el.setAttribute('hidden','true');
    img.setAttribute('src','chrome://global/skin/tree/twisty-open.png');
  }  
}
