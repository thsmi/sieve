/*
 * The content of this file is licenced. You may obtain a copy of the license
 * at http://sieve.mozdev.org or request it via email from the author. 
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *      
 */

// Enable Strict Mode
"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");
Cu.import("chrome://sieve/content/modules/utils/SieveWindowHelper.jsm");
SieveOverlayManager.require("/sieve/SieveAutoConfig.js",this,window);    

/*
 *  Auto Config
 */ 

var gAutoConfig = null;
var gAccount = null;
var gCallback = null;
var gCallbacks = null;


var gAutoConfigEvent =
{
  onSuccess : function(host,port,proxy)
  {
    onStatus(8,2);
    
    gAccount.setActiveHost(0);
    gAccount.getHost().setPort(port);
    gAccount.setEnabled(true);
    
    gAutoConfig = null;
  },

  onError : function()
  {
    onStatus(8,3);
    gAutoConfig = null;
  }
}

function onAutoConfigRunClick()
{ 
  if (gAutoConfig)
    gAutoConfig.cancel();
  
  gAutoConfig = new SieveAutoConfig();
  
  gAutoConfig.addHost(
    gAccount.getHost(0).getHostname(),
    4190,
    gAccount.getProxy().getProxyInfo());
    
  gAutoConfig.addHost(
    gAccount.getHost(0).getHostname(),
    2000,
    gAccount.getProxy().getProxyInfo());
  
  gAutoConfig.run(gAutoConfigEvent);
  
  onStatus(8,1);
}

function onAutoConfigCancelClick()
{
  gAutoConfig.cancel();
  gAutoConfig = null;
  
  onStatus(8,3);
}

function onAutoConfigFinishedClick()
{
  gCallback();
}

function onReconnectClick()
{
  gCallback();   
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
     
    gCallback();
  }
  catch (ex)
  {
    onStatus(2,"error.brokencert");
    gLogger.logStringMessage("onBadCertOverride:"+ex); 
  }
 
}

function onDetach()
{
  if (gAutoConfig)
  {
    gAutoConfig.cancel();
    gAutoConfig = null;
  }    
  
  gCallback = null;
  gCallbacks = null;
}

/**
 * The callback is invoced inf the user wants to reconnect 
 * 
 * @param {} account
 * @param {} callback
 *   
 */
function onAttach(account, callback,callbacks)
{  
  if (gAutoConfig)
  {
    gAutoConfig.cancel();
    gAutoConfig = null;
  }
  
  gAccount = account;   
  gCallback = callback;
  if (callbacks)
    gCallbacks = callbacks;
}

function onStatus(state, message)
{
  try {
  var strbundle = document.getElementById("strings");
  
  // TODO use a for loop...
  document.getElementById('StatusWarning').setAttribute('hidden','true');
  document.getElementById('StatusError').setAttribute('hidden','true');
  document.getElementById('StatusWait').setAttribute('hidden','true');
  document.getElementById('StatusBadCert').setAttribute('hidden','true');
  document.getElementById('StatusOffline').setAttribute('hidden','true');
  document.getElementById('StatusDisabled').setAttribute('hidden','true');
  document.getElementById('StatusConnectionLost').setAttribute('hidden','true');
  document.getElementById("StatusOutOfSync").setAttribute('hidden','true');
  
  
  switch (state)
  {   
    case 1: document.getElementById('StatusWarning').removeAttribute('hidden');
            document.getElementById('StatusWarningMsg')
                .firstChild.nodeValue = strbundle.getString(message);
            break;
    // client error            
    case 2: document.getElementById('StatusError').removeAttribute('hidden');
            document.getElementById('StatusErrorMsg')
                .firstChild.nodeValue = strbundle.getString(message);    
            break;
    case 3: document.getElementById('StatusWait').removeAttribute('hidden');
            document.getElementById('StatusWaitMsg')
                .firstChild.nodeValue = strbundle.getString(message);    
            break;
    // server error
    case 4: document.getElementById('StatusError').removeAttribute('hidden');
            document.getElementById('StatusErrorMsg').textContent = message;    
            break;            
    case 5: document.getElementById('StatusBadCert').removeAttribute('hidden');

            document.getElementById("btnIgnoreBadCert").setAttribute("message", message);
            document.getElementById("btnIgnoreBadCert").setAttribute("oncommand", 
              "onBadCertOverride(this.getAttribute('message'),document.getElementById('cbBadCertRemember').checked);");
              
            document.getElementById("btnAbortBadCert").setAttribute("oncommand", 
              "onStatus(1,'warning.brokencert');");
                            
            break;
    // Offline Mode
    case 6: document.getElementById('StatusOffline').removeAttribute('hidden');
            break;
  /*  // Capabilities set...
    case 7: document.getElementById('StatusWait').removeAttribute('hidden');
            break;*/
    // account disabled
    case 8:
      document.getElementById('StatusDisabled').removeAttribute('hidden');
      document.getElementById('sivAutoConfig').selectedIndex = message;
      break;  
    case 9:
      document.getElementById('StatusConnectionLost').removeAttribute('hidden');
      break;
    case 10:
      document.getElementById("StatusOutOfSync").removeAttribute('hidden');
      document.getElementById("sivClientSide").value = message.local;
      document.getElementById("sivServerSide").value = message.remote;
      break;
    
    // Show the tobber as default...
    default:
      document.getElementById('StatusWait').removeAttribute('hidden');
  }
  
  } catch (ex)
  {
    alert(state+" || "+message +"||"+ex);
  }
}

function onSettingsClick()
{
  var server = Cc['@mozilla.org/messenger/account-manager;1']
                   .getService(Ci.nsIMsgAccountManager)
                   .getIncomingServer(gAccount.imapKey);
  
  SieveUtils.OpenSettings(window,server); 
}


function onGoOnlineClick()
{
  var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
  ioService.offline = false; 
  
  gCallback();
}


function onKeepLocal()
{
  gCallbacks.onKeepLocal();
}

function onUseRemote()
{
  gCallbacks.onUseRemote(document.getElementById("sivServerSide").value);
}

// ChannelCreated
// ChannelClosed
// ChannelReady
// ChannelStatus

// Events Account Switch
// Status Change
