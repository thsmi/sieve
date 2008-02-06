var account = null;
    
function onDialogLoad(sender)
{
	account = window.arguments[0]["SieveAccount"];
    
  // get the custom Host settings
  document.getElementById('txtHostname').value
  	= account.getHost(1).getHostname();
  document.getElementById('txtPort').value
  	= account.getHost(1).getPort();
  document.getElementById('cbxTLS').checked
  	= account.getHost(1).isTLS();

  var cbxHost = document.getElementById('cbxHost');  
  if (account.getHost().getType() == 1)
  	cbxHost.checked = true;
  else 
   	cbxHost.checked = false;   	
  enableHost(cbxHost.checked);
    
  // initalize login related elements...
  document.getElementById('txtUsername').value
  	= account.getLogin(2).getUsername();
        
  var rgLogin = document.getElementById('rgLogin');
  rgLogin.selectedIndex = account.getLogin().getType();
  enableLogin(rgLogin.selectedIndex);

  // initalize the authorization related elements...
  document.getElementById('txtAuthorization').value
    = account.getAuthorization(3).getAuthorization(); 
  
  var rgAuthorization = document.getElementById('rgAuthorization');
  rgAuthorization.selectedIndex = account.getAuthorization().getType();
  enableAuthorization(rgAuthorization.selectedIndex);

    
  document.getElementById('txtKeepAlive').value
  	= account.getSettings().getKeepAliveInterval();
    
  var cbxKeepAlive = document.getElementById('cbxKeepAlive');
  cbxKeepAlive.checked = account.getSettings().isKeepAlive();
  enableKeepAlive(cbxKeepAlive.checked);

  document.getElementById('txtCompile').value
  	= account.getSettings().getCompileDelay();
            
 	var cbxCompile = document.getElementById('cbxCompile');
  cbxCompile.checked = account.getSettings().hasCompileDelay();
  enableCompile(cbxCompile.checked);	
  
  var cbxDebugRequest = document.getElementById('cbxDebugRequest');
  cbxDebugRequest.checked = account.getSettings().hasDebugFlag(0);
  
  var cbxDebugResponse = document.getElementById('cbxDebugResponse');
  cbxDebugResponse.checked = account.getSettings().hasDebugFlag(1);  
  
  var cbxAuthMechanism = document.getElementById('cbxAuthMechanism');
  cbxAuthMechanism.checked = account.getSettings().hasForcedAuthMechanism();
  enableAuthMechanism(cbxAuthMechanism.checked);
   
  var list = document.getElementById('mlAuthMechanism');
  var items = list.getElementsByTagName('menuitem');
  
  var mechanism = account.getSettings().getForcedAuthMechanism();
  
  for (var i = 0; i < items.length; i++)
  {
    if (items[i].value != mechanism)
      continue;
    
    list.selectedItem = items[i];
    break;
  }
  
}

function onDialogAccept(sender)
{ 
	// Do nothing since there should be only valid entries...
}

function onAuthorizationSelect(sender)
{
  if (account == null)
    return;
    
  var type = 1;
  
  if (sender.selectedItem.id == "rbNoAuthorization")
    type = 0;
  else if (sender.selectedItem.id == "rbDefaultAuthorization")
    type = 1;
  else if (sender.selectedItem.id == "rbPromptAuthorization")
    type = 2;
  else if (sender.selectedItem.id == "rbCustomAuthorization")
    type = 3;

  account.setActiveAuthorization(type);        
  enableAuthorization(type);
}

// Function for the custom authentication
function onLoginSelect(sender)
{
  if (account == null)
    return;
    
  var type = 1;
  if (sender.selectedItem.id == "rbNoAuth")
  	type = 0;
  else if (sender.selectedItem.id == "rbImapAuth")
  	type = 1;
  else if (sender.selectedItem.id == "rbCustomAuth")
  	type = 2;

  account.setActiveLogin(type);        
  enableLogin(type);
}

function enableLogin(type)
{
  if (type == 2)
    document.getElementById('txtUsername').removeAttribute('disabled');
  else
    document.getElementById('txtUsername').setAttribute('disabled','true');
}

function enableAuthorization(type)
{
  if (type == 3)
    document.getElementById('txtAuthorization').removeAttribute('disabled');
  else
    document.getElementById('txtAuthorization').setAttribute('disabled','true');
}


function onUsernameChange(sender)
{
  if (account == null)
    return;
    
  account.getLogin(2).setUsername(document.getElementById('txtUsername').value);
}

function onAuthorizationChange(sender)
{
  if (account == null)
    return;
    
  account.getAuthorization(3)
      .setAuthorization(document.getElementById('txtAuthorization').value);
}

// Function for the custom server settings
function onHostCommand(sender)
{
  if (account == null)
    return;

  if (sender.checked)
    account.setActiveHost(true);
  else
    account.setActiveHost(false);    
     
  enableHost(sender.checked);
}

function enableHost(enabled)
{
  if (enabled)
  {
    document.getElementById('txtHostname').removeAttribute('disabled');
    document.getElementById('txtPort').removeAttribute('disabled');
    document.getElementById('cbxTLS').removeAttribute('disabled');
  }
  else
  {
    document.getElementById('txtHostname').setAttribute('disabled','true');    
    document.getElementById('txtPort').setAttribute('disabled','true');        
    document.getElementById('cbxTLS').setAttribute('disabled','true');        
  }
}

function onHostnameChange(sender)
{
  if (account == null)
    return;
  
  account.getHost(1).setHostname(sender.value);
}

function onPortChange(sender)
{
  if (account == null)
    return;
  
	account.getHost(1).setPort(sender.value)
}

function onTLSCommand(sender)
{
  if (account == null)
    return;
  
  account.getHost(1).setTLS(sender.checked);        
}

// Function for the general Settings...
function onKeepAliveCommand(sender)
{
  if (account == null)
    return;
    
  account.getSettings().enableKeepAlive(sender.checked);
  enableKeepAlive(sender.checked);    
}

function enableKeepAlive(enabled)
{
  if (enabled)
    document.getElementById('txtKeepAlive').removeAttribute('disabled');
  else
    document.getElementById('txtKeepAlive').setAttribute('disabled','true'); 
}

function onKeepAliveChange(sender)
{
  if (account == null)
    return;
  
  account.getSettings().setKeepAliveInterval(sender.value)    
}

function onCompileCommand(sender)
{
  if (account == null)
    return;
     
  account.getSettings().enableCompile(sender.checked); 
  enableCompile(sender.checked);    
}

function enableCompile(enabled)
{
  if (enabled)
    document.getElementById('txtCompile').removeAttribute('disabled');
  else
    document.getElementById('txtCompile').setAttribute('disabled','true'); 
}

function onCompileChange(sender)
{
  if (account == null)
    return;
  
  account.getSettings().setCompileDelay(sender.value)    
}

function onDebugRequestCommand(sender)
{
  if (account == null)
    return;
  
  account.getSettings().setDebugFlag(0,sender.checked);
}

function onDebugResponseCommand(sender)
{
  if (account == null)
    return;
     
  account.getSettings().setDebugFlag(1,sender.checked);
} 

function onAuthMechanismCommand(sender)
{
  if (account == null)
    return;
  
  account.getSettings().enableForcedAuthMechanism(sender.checked);
  enableAuthMechanism(sender.checked);
}

function enableAuthMechanism(enabled)
{
  if (enabled)
    document.getElementById('mlAuthMechanism').removeAttribute('disabled');
  else
    document.getElementById('mlAuthMechanism').setAttribute('disabled','true'); 
}

function onAuthMechanismSelect(sender)
{
  if (account == null)
    return;
  
  account.getSettings().setForcedAuthMechanism(sender.selectedItem.value);
}

function onShowPassword()
{  

  var name = "Toolkit:PasswordManager"
  var uri = "chrome://messenger/content/preferences/viewpasswords.xul"

  var w = Components
    .classes["@mozilla.org/appshell/window-mediator;1"]
    .getService(Components.interfaces.nsIWindowMediator)
    .getMostRecentWindow(name);

  if (w)
    w.focus();
  else
    Components
      .classes["@mozilla.org/embedcomp/window-watcher;1"]
      .getService(Components.interfaces.nsIWindowWatcher)
      .openWindow(null, uri, name, "chrome,resizable", null);  
}