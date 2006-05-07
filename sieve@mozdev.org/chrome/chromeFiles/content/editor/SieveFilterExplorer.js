
var sieve = null;
var sieveTreeView = null;
var closeTimeout = null;
var keepAliveInterval = null;
var accounts = new Array();

var event = 
{	
	onInitResponse: function(response)
	{

    	var login = getSelectedAccount().getLogin();
    	
    	// is the Server TLS capable?
    	if (getSelectedAccount().getHost().isTLS() && response.getTLS())
    	{
    	  var request = new SieveStartTLSRequest(event);
    	  request.addStartTLSListener(event);
    	  request.addErrorListener(event);

   		  sieve.addRequest(request);
    	}
    	  
    	else
    	{
      if (login.hasUsername() == false)
      {
        event.onPlainLoginResponse(null);
        return;
      }
           	
    	if (login.hasPassword())
    	{
          var request = new SievePlainLoginRequest(login.getUsername(), login.getPassword());
	      request.addPlainLoginListener(event);
	      request.addErrorListener(event);
    		
        sieve.addRequest(request);    		
    	}
      else
      {
        var password = promptPassword();
        if (password == null)
    	    return;
    	    
	      var request = new SievePlainLoginRequest(login.getUsername(), password);
	      request.addPlainLoginListener(event);
	      request.addErrorListener(event);
    		
        sieve.addRequest(request);    	            
      }
    }
	},
	
	onStartTLSResponse : function(response)
	{	        
	    // activate TLS
	    sieve.startTLS();
	    
	    // and login	    
       	var login = getSelectedAccount().getLogin();
       	
       	if (login.hasUsername() == false)
       	{
       	    event.onPlainLoginResponse(null);
       	    return;
       	}
       	

    	if (login.hasPassword())
    	{
	      var request = new SievePlainLoginRequest(login.getUsername(), login.getPassword());
	      request.addPlainLoginListener(event);
	      request.addErrorListener(event);
    		
        sieve.addRequest(request);
    	}
      else
      {
        var password = promptPassword();
        if (password == null)
    	    return;

	      var request = new SievePlainLoginRequest(login.getUsername(), password);
	      request.addPlainLoginListener(event);
	      request.addErrorListener(event);
    		
        sieve.addRequest(request);
    	}      	
	},
	
  onPlainLoginResponse: function(response)
  {
    // enable the disabled controls....
    document.getElementById('newButton').removeAttribute('disabled');
    document.getElementById('editButton').removeAttribute('disabled');
    document.getElementById('deleteButton').removeAttribute('disabled');
    document.getElementById('capabilites').removeAttribute('disabled');
    document.getElementById('treeImapRules').removeAttribute('disabled');
    postStatus("Connected");
		
    // List all scripts as soon as we are connected
    var request = new SieveListScriptRequest();
    request.addListScriptListener(event);
    request.addErrorListener(event);

    sieve.addRequest(request);
  },
	
	onLogoutResponse: function(response)
	{
		if (sieve.isAlive())
			sieve.disconnect();
		clearTimeout(closeTimeout);
		
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
		
		sieve.addRequest(request);
	},
	
	onDeleteScriptResponse:  function(response)
	{
		if (response.hasError())
			alert("Command \"DELETESCRIPT\" failed\n"+response.getMessage());

		// Always refresh the table ...
		var request = new SieveListScriptRequest();
		request.addListScriptListener(event);
		request.addErrorListener(event);
		
		sieve.addRequest(request);
	},
	
	onCapabilitiesResponse: function(response)
	{
    if (response.hasError())
	  {
	    alert("Command \"CAPABILITY\" failed");
	    return
	  }
	    
    var args = new Array();
    args["implementation"] = response.getImplementation();
    args["extensions"] = response.getExtensions();
    args["sasl"] = response.getSasl();

    window.openDialog("chrome://sieve/content/editor/SieveCapabilities.xul", "FilterEditor", "chrome,modal,titlebar,centerscreen", args);
	},	
	
  onError: function(response)
  {
    var code = response.getResponseCode();

    if (code instanceof SieveRespCodeReferral)
    {
      postStatus("Referral aktiv...")
      alert("Server referral to: "+code.getSieveUrl())

      var account = getSelectedAccount();
      sieve = new Sieve(code.getHostname(),account.getHost().getPort());		  
  
      var request = new SieveInitRequest();
      request.addErrorListener(event)
      request.addInitListener(event)
      sieve.addRequest(request);
		    
      sieve.connect();
      return
    }

    alert("SERVER ERROR:"+response.getMessage());
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
    
    sieve.addRequest(request);
  }
}

function onKeepAlive()
{
  // create a sieve request without an eventhandler...
  sieve.addRequest(new SieveCapabilitiesRequest())
}

function onWindowLoad()
{
  // Load all the Libraries we need...
  var jsLoader = Components
                   .classes["@mozilla.org/moz/jssubscript-loader;1"]
                   .getService(Components.interfaces.mozIJSSubScriptLoader);
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/sievelib/SieveAccounts.js");
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/sievelib/Sieve.js");
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/sievelib/SieveRequest.js");
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/sievelib/SieveResponse.js");    
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/sievelib/SieveResponseParser.js");        
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/sievelib/SieveResponseCodes.js");
  jsLoader
    .loadSubScript("chrome://sieve/content/editor/SieveFiltersTreeView.js");
//	var actList = document.getElementById("conImapAcct");
//	var actpopup = document.createElement("menupopup");
//	actList.appendChild(actpopup);

  var menuImapAccounts = document.getElementById("menuImapAccounts");

  accounts = (new SieveAccounts()).getAccounts();

  for (var i = 0; i < accounts.length; i++)
  {   
    if (accounts[i].isEnabled() == false)
      menuImapAccounts.appendItem( accounts[i].getDescription(),"","- disabled").disabled = true;
    else
      menuImapAccounts.appendItem( accounts[i].getDescription(),"","").disabled = false;
  }
	
  sieveTreeView = new SieveTreeView(new Array(),event);	
  document.getElementById('treeImapRules').view = sieveTreeView;
	
  menuImapAccounts.selectedIndex = 0;
  onSelectAccount();
}
   
function onWindowClose()
{
  if (keepAliveInterval != null)
  {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
  
  if (sieve == null)
    return true;
  // Force disconnect in 500 MS
  closeTimeout = setTimeout("sieve.disconnect(); close();",250);

  var request = new SieveLogoutRequest(event)
  request.addLogoutListener(event);
  request.addErrorListener(event)
  
  sieve.addRequest(request);

  return false;
}   

function getSelectedAccount()
{
    var menu = document.getElementById("menuImapAccounts")
    return accounts[menu.selectedIndex];
}

function promptPassword()
{
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                        .getService(Components.interfaces.nsIPromptService);
                        
    input = {value:null};
    check = {value:false}; 
    var result = prompts.promptPassword(window,"Password", "Please enter the password for your Sieve account", input, null, check);
    
    if (result)
        return input.value;

    return null;
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
			if ((sieve != null) && (sieve.isAlive()))
				sieve.disconnect();

      // always clear the TreeView
      var tree = document.getElementById('treeImapRules');
   		tree.currentIndex = -1;
     	sieveTreeView.update(new Array());
	    tree.view = sieveTreeView;

      var account = getSelectedAccount();
		
			// Disable and cancel if account is not enabled
			if (account.isEnabled() == false)
			{
				document.getElementById('newButton').setAttribute('disabled','true');
				document.getElementById('editButton').setAttribute('disabled','true');
				document.getElementById('deleteButton').setAttribute('disabled','true');
				document.getElementById('capabilites').setAttribute('disabled','true');
				document.getElementById('treeImapRules').setAttribute('disabled','true');
				postStatus("Not connected - go to Tool -> Sieve Settings to activate this account")
				return;
			}			

			postStatus("Connecting...");
			if (account.getSettings().isKeepAlive())
			    keepAliveInterval = setInterval("onKeepAlive()",account.getSettings().getKeepAliveInterval());

		    sieve = new Sieve(account.getHost().getHostname(),account.getHost().getPort());
		    
		    var request = new SieveInitRequest();
		    request.addErrorListener(event)
		    request.addInitListener(event)
		    sieve.addRequest(request);
		    
		    sieve.connect();
		}
	}

	// Besteht das Objekt überhaupt bzw besteht eine Verbindung?
	if ((sieve == null) || (sieve.isAlive() == false))
	{
		// beides schein nicht zu existieren, daher connect direkt aufrufen...
		levent.onLogoutResponse("");
		return
	}
	
	// hier haben wir etwas weniger Zeit ...
	logoutTimeout = setTimeout("levent.onLogoutResponse(\"\")",250);
	
    if (keepAliveInterval != null)
    {
    	clearInterval(keepAliveInterval);
    	keepAliveInterval = null;
    }
  var request = new SieveLogoutRequest();
  request.addLogoutListener(levent);
  request.addErrorListener(event);
	sieve.addRequest(request);	
}

function onDeleteClick()
{	
	var tree = document.getElementById('treeImapRules');	
	
	if (tree.currentIndex == -1)
		return;

	var scriptName = new String(tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(0)));	
		
	// delete the script...
	var request = new SieveDeleteScriptRequest(scriptName);
	request.addDeleteScriptListener(event);
	request.addErrorListener(event);
	
	sieve.addRequest(request);
}

function onNewClick()
{
	var args = new Array();
	args["sieve"] = sieve;
	args["compile"] = getSelectedAccount().getSettings().isCompile();
	args["compileDelay"] = getSelectedAccount().getSettings().getCompileDelay();
		
	window.openDialog("chrome://sieve/content/editor/SieveFilterEditor.xul", "FilterEditor", "chrome,modal,titlebar,resizable,centerscreen", args);

	var request = new SieveListScriptRequest();
	request.addListScriptListener(event);
	request.addErrorListener(event);
	
	sieve.addRequest(request);	
}

function onEditClick()
{
  var tree = document.getElementById('treeImapRules');	
  if (tree.currentIndex == -1)
    return;

  var scriptName = new String(tree.view.getCellText(tree.currentIndex, tree.columns.getColumnAt(0)));	

  var args = new Array();
  args["scriptName"] = scriptName;
  args["sieve"] = sieve;
  args["compile"] = getSelectedAccount().getSettings().isCompile();
  args["compileDelay"] = getSelectedAccount().getSettings().getCompileDelay();

  window.openDialog("chrome://sieve/content/editor/SieveFilterEditor.xul", "FilterEditor", "chrome,modal,titlebar,resizable,centerscreen", args);

  var request = new SieveListScriptRequest();
  request.addListScriptListener(event);
  request.addErrorListener(event);
    			
  sieve.addRequest(request);
}

function onCapabilitesClick()
{
  var request = new SieveCapabilitiesRequest();
  request.addCapabilitiesListener(event);
  request.addErrorListener(event);	
	
  sieve.addRequest(request);
}

function onSettingsClick()
{
  window.openDialog("chrome://sieve/content/options/SieveOptions.xul", "FilterEditor", "chrome,modal,titlebar,resizable,centerscreen");
}

function postStatus(progress)
{
  document.getElementById('logger').value = progress;
}