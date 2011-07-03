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
var gAccount = null;

// === Server Sheet ===========================================================
function onServerSheetLoad(account)
{
  var rbHost = document.getElementById('rgHost');
  rbHost.selectedIndex = account.getHost().getType();
  enableHost(rbHost.selectedIndex);
    
  // get the custom Host settings
  document.getElementById('txtHostname').value
    = account.getHost(1).getHostname();

  var rbPort = document.getElementById('rgPort');

  // Load custom port settings
  var port = account.getHost().getPort(2);
    
  if ((port==2000) || (port=4190))
    port = "";
    
  document.getElementById('txtPort').value = port;    
    
  // Load port
  port = account.getHost().getPort();
  
  if (port == 4190)
    rbPort.selectedIndex = 0;
  else if (port == 2000)
    rbPort.selectedIndex = 1;
  else
  {
    rbPort.selectedIndex = 2;
    document.getElementById('txtPort').value = port;    
  }
  
  enablePort(rbPort.selectedIndex);
  
  document.getElementById('cbxTLS').checked
    = account.getHost().isTLS();
}

function enableHost(type)
{
  if (type == 1)
    document.getElementById('txtHostname').removeAttribute('disabled');
  else
    document.getElementById('txtHostname').setAttribute('disabled','true');                   
}

function onHostSelect(idx)
{
  if (!gAccount)
    return;
    
  gAccount.setActiveHost(idx);
  enableHost(idx);  
}

function onHostnameChange(value)
{
  if (!gAccount)
    return;
    
  gAccount.getHost(1).setHostname(value);
}

function enablePort(type)
{
  if (type == 2)
    document.getElementById('txtPort').removeAttribute('disabled');
  else
    document.getElementById('txtPort').setAttribute('disabled','true');
}

function onPortSelect(idx)
{
  if (!gAccount)
    return;
    
  if (idx == 0)
    gAccount.getHost().setPort(4190);
  else if (idx == 1) 
    gAccount.getHost().setPort(2000);
  else
    onPortChange(document.getElementById('txtPort').value);
  
  enablePort(idx);
}

function onPortChange(value)
{
  if (!gAccount)
    return;
    
  gAccount.getHost().setPort(value,true)
}

// === Security Sheet =========================================================
function onSecuritySheetLoad(account)
{
  // initalize login related elements...
  document.getElementById('txtUsername').value
    = account.getLogin(2).getUsername();
        
  var rgLogin = document.getElementById('rgLogin');
  rgLogin.selectedIndex = account.getLogin().getType();
  enableLogin(rgLogin.selectedIndex);
}

function onTLSCommand(checked)
{
  if (!gAccount)
    return;
    
  gAccount.getHost().setTLS(checked);        
}

function onLoginSelect(idx)
{
  if (!gAccount)
    return;
    
  gAccount.setActiveLogin(idx);        
  enableLogin(idx);
}

function enableLogin(type)
{
  if (type == 2)
    document.getElementById('txtUsername').removeAttribute('disabled');
  else
    document.getElementById('txtUsername').setAttribute('disabled','true');
}

function onUsernameChange(value)
{
  if (!gAccount)
    return;
    
  gAccount.getLogin(2).setUsername(value);
}

// === General Sheet ==========================================================
function onGeneralSheetLoad(account)
{
  document.getElementById('txtKeepAlive').value
    = account.getSettings().getKeepAliveInterval() / (1000*60);
    
  var cbxKeepAlive = document.getElementById('cbxKeepAlive');
  cbxKeepAlive.checked = account.getSettings().isKeepAlive();
  enableKeepAlive(cbxKeepAlive.checked);

  document.getElementById('txtCompile').value
    = account.getSettings().getCompileDelay();
  
  var element = null;
            
  element = document.getElementById('cbxCompile');
  element.checked = account.getSettings().hasCompileDelay();
  enableCompile(element.checked);     
}

// === Proxy Sheet ============================================================
function onProxySheetLoad(account)
{
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

function onProxySelect(type)
{ 
  if (gAccount == null)
    return;

  if ((type == null) ||(type > 3))
    type = 1;
    
  gAccount.setProxy(type);
  enableProxy(type);
}

// === Advanced Sheet ==========================================================

function onAdvancedSheetLoad(account)
{
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
  
  // initalize the authorization related elements...
  document.getElementById('txtAuthorization').value
    = account.getAuthorization(3).getAuthorization(); 
  
  var rgAuthorization = document.getElementById('rgAuthorization');
  rgAuthorization.selectedIndex = account.getAuthorization().getType();
  enableAuthorization(rgAuthorization.selectedIndex);  
}

function onAuthorizationSelect(type)
{
  if (gAccount == null)
    return;
    
  if ((type == null) || (type > 3))
    type = 1;

  gAccount.setActiveAuthorization(type);        
  enableAuthorization(type);
}

// Function for the custom authentication
function enableAuthorization(type)
{
  if (type == 3)
    document.getElementById('txtAuthorization').removeAttribute('disabled');
  else
    document.getElementById('txtAuthorization').setAttribute('disabled','true');
}

function onAuthorizationChange(value)
{
  if (gAccount == null)
    return;
  
  gAccount.getAuthorization(3).setAuthorization(value);
}

// === Debug Sheet =============================================================

function onDebugSheetLoad(account)
{
  document.getElementById('cbxDebugRequest').checked 
      = account.getSettings().hasDebugFlag(0);
   
  document.getElementById('cbxDebugResponse').checked 
      = account.getSettings().hasDebugFlag(1);
  
  document.getElementById('cbxDebugExceptions').checked 
      = account.getSettings().hasDebugFlag(2);

  document.getElementById('cbxDebugStream').checked 
      = account.getSettings().hasDebugFlag(3);
      
  document.getElementById('cbxDebugSession').checked 
      = account.getSettings().hasDebugFlag(4);  
}



function onDialogLoad()
{
  gAccount = window.arguments[0]["SieveAccount"];
  onServerSheetLoad(gAccount);
  onSecuritySheetLoad(gAccount);
  onProxySheetLoad(gAccount);
  onGeneralSheetLoad(gAccount);
  onAdvancedSheetLoad(gAccount);
  onDebugSheetLoad(gAccount); 
}

function onDialogAccept()
{
  return true;
  // Do nothing since there should be only valid entries...
}




// Function for the general Settings...
function onKeepAliveCommand(sender)
{
  if (gAccount == null)
    return;
    
  gAccount.getSettings().enableKeepAlive(sender.checked);
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
  if (gAccount == null)
    return;
  
  gAccount.getSettings().setKeepAliveInterval(sender.value*1000*60)    
}

function onCompileCommand(sender)
{
  if (gAccount == null)
    return;
     
  gAccount.getSettings().enableCompileDelay(sender.checked); 
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
  if (gAccount == null)
    return;
  
  gAccount.getSettings().setCompileDelay(sender.value)    
}

function onDebugFlagCommand(sender,bit)
{
  if (gAccount == null)
    return;
  
  account.getSettings().setDebugFlag(bit,sender.checked);
}

function onAuthMechanismCommand(sender)
{
  if (gAccount == null)
    return;
  
  gAccount.getSettings().enableForcedAuthMechanism(sender.checked);
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
  if (gAccount == null)
    return;
  
  gAccount.getSettings().setForcedAuthMechanism(sender.selectedItem.value);
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
  if (gAccount == null)
    return;
  
  gAccount.getProxy(3).setRemoteDNS(sender.checked);
}

function onSocks5HostChange(sender)
{
  if (gAccount == null)
    return;
  
  gAccount.getProxy(3).setHost(sender.value);
}

function onSocks5PortChange(sender)
{
  if (gAccount == null)
    return;
  
  gAccount.getProxy(3).setPort(sender.value)
}

function onSocks4HostChange(sender)
{
  if (gAccount == null)
    return;
  
  gAccount.getProxy(2).setHost(sender.value);
}

function onSocks4PortChange(sender)
{
  if (gAccount == null)
    return;
  
  gAccount.getProxy(2).setPort(sender.value)
}
