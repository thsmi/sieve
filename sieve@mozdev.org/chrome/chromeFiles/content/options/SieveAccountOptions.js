/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

//  @include "/sieve/src/sieve@mozdev.org/chrome/chromeFiles/content/libs/libManageSieve/SieveAccounts.js"

    
/** @type SieveAccount */
var account;
account = null;

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
  
  var element = null;
            
  element = document.getElementById('cbxCompile');
  element.checked = account.getSettings().hasCompileDelay();
  enableCompile(element.checked);	
   
  document.getElementById('cbxDebugRequest').checked 
      = account.getSettings().hasDebugFlag(0);
   
  document.getElementById('cbxDebugResponse').checked 
      = account.getSettings().hasDebugFlag(1);
  
  document.getElementById('cbxDebugExceptions').checked 
      = account.getSettings().hasDebugFlag(2);

  document.getElementById('cbxDebugStream').checked 
      = account.getSettings().hasDebugFlag(3);
      
  element = document.getElementById('cbxAuthMechanism');
  element.checked = account.getSettings().hasForcedAuthMechanism();
  enableAuthMechanism(element.checked);
   
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

  // initalize login related elements...
  document.getElementById('txtHandshakeTimeout').value
    = account.getSettings().getCompatibility().getHandshakeTimeout();
        
  element = document.getElementById('rgHandshake');
  element.selectedIndex = account.getSettings().getCompatibility().getHandshakeMode();
  enableHandshakeTimeout(element.selectedIndex);  
  
  
  // Proxy Configuration...
  
  document.getElementById('txtSocks4Host').value
    = account.getProxy(2).getHost();
  document.getElementById('txtSocks4Port').value
    = account.getProxy(2).getPort();
    
  document.getElementById('txtSocks5Host').value
    = account.getProxy(3).getHost();
  document.getElementById('txtSocks5Port').value
    = account.getProxy(3).getPort();  
  document.getElementById('cbxSocks5RemoteDNS').checked
    = account.getProxy(3).usesRemoteDNS();

  var rgSocksProxy = document.getElementById('rgSocksProxy');
  rgSocksProxy.selectedIndex = account.getProxy().getType();    
  enableProxy(rgSocksProxy.selectedIndex);
  
}

function onDialogAccept(sender)
{
  // Do nothing since there should be only valid entries...
}

function onHandshakeSelect(sender)
{ 
  if (account == null)
    return;

  var type = 0;
  
  if (sender.selectedItem.id == "rbAutoHandshake")
    type = 0;
  else if (sender.selectedItem.id == "rbStrictHandshake")
    type = 1;
  else if (sender.selectedItem.id == "rbCyrusHandshake")
    type = 2;
  
  account.getSettings().getCompatibility().setHandshakeMode(type);
  enableHandshakeTimeout(type);
}


function enableHandshakeTimeout(type)
{
  if (type == 0)
    document.getElementById('txtHandshakeTimeout').removeAttribute('disabled');
  else
    document.getElementById('txtHandshakeTimeout').setAttribute('disabled','true');
}

function onHandshakeTimeoutChange(sender)
{
  if (account == null)
    return;
    
  account.getSettings().getCompatibility()
    .setHandshakeTimeout(document.getElementById('txtHandshakeTimeout').value);
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
     
  account.getSettings().enableCompileDelay(sender.checked); 
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

function onDebugFlagCommand(sender,bit)
{
  if (account == null)
    return;
  
  account.getSettings().setDebugFlag(bit,sender.checked);
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
/**
 * Opens the password manager dialog of thunderbird.
 * 
 * The dialog call might me non modal.
 */
function onShowPassword()
{
  
  var winName = "Toolkit:PasswordManager"
  var uri = "chrome://passwordmgr/content/passwordManager.xul"
  
  if ("@mozilla.org/passwordmanager;1" in Components.classes) 
  {
    // Password Manager exists so this is not Thunderbird 3 
    winName = "Toolkit:PasswordManager"
    uri = "chrome://messenger/content/preferences/viewpasswords.xul"
  }

  var w = Components
    .classes["@mozilla.org/appshell/window-mediator;1"]
    .getService(Components.interfaces.nsIWindowMediator)
    .getMostRecentWindow(winName);

  if (w)
    w.focus();
  else
    window.openDialog(uri,winName, "");    
  /*else
    Components
      .classes["@mozilla.org/embedcomp/window-watcher;1"]
      .getService(Components.interfaces.nsIWindowWatcher)
      .openWindow(null, uri, name, "chrome,resizable", null);*/  
}

function onShowErrorConsole()
{
  var name = "global:console"
  var uri = "chrome://global/content/console.xul"

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
      .openWindow(null, uri, name, "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar", null);
      
    //window.open(uri, "_blank", "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar");          
}

function enableProxy(type)
{
  document.getElementById('txtSocks4Port').setAttribute('disabled','true');    
  document.getElementById('txtSocks4Host').setAttribute('disabled','true');  
  document.getElementById('txtSocks5Port').setAttribute('disabled','true');    
  document.getElementById('txtSocks5Host').setAttribute('disabled','true');
  document.getElementById('cbxSocks5RemoteDNS').setAttribute('disabled','true');
  
  switch (type)
  {
    case 2:
      document.getElementById('txtSocks4Port').removeAttribute('disabled');
      document.getElementById('txtSocks4Host').removeAttribute('disabled');
      break;
    case 3:
      document.getElementById('txtSocks5Port').removeAttribute('disabled');
      document.getElementById('txtSocks5Host').removeAttribute('disabled');  
      document.getElementById('cbxSocks5RemoteDNS').removeAttribute('disabled');
      break;
  }   
}

function onSocks5RemoteDNSCommand(sender)
{
  if (account == null)
    return;
  
  account.getProxy(3).setRemoteDNS(sender.checked);
}

function onSocks5HostChange(sender)
{
  if (account == null)
    return;
  
  account.getProxy(3).setHost(sender.value);
}

function onSocks5PortChange(sender)
{
  if (account == null)
    return;
  
  account.getProxy(3).setPort(sender.value)
}

function onSocks4HostChange(sender)
{
  if (account == null)
    return;
  
  account.getProxy(2).setHost(sender.value);
}

function onSocks4PortChange(sender)
{
  if (account == null)
    return;
  
  account.getProxy(2).setPort(sender.value)
}

function onProxySelect(sender)
{ 
  if (account == null)
    return;

  var type = 1;
  
  if (sender.selectedItem.id == "rbProxyDirect")
    type = 0;
  else if (sender.selectedItem.id == "rbProxyDefault")
    type = 1;
  else if (sender.selectedItem.id == "rbProxySocks4")
    type = 2;
  else if (sender.selectedItem.id == "rbProxySocks5")
    type = 3;
  
  account.setProxy(type);
  enableProxy(type);
}
