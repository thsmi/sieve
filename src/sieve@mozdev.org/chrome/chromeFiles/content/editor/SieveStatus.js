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

Cu.import("resource://gre/modules/Services.jsm");

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
 
    var status = null;
    
    if (Cc["@mozilla.org/security/recentbadcerts;1"])
    {
      status = Cc["@mozilla.org/security/recentbadcerts;1"]
                   .getService(Ci.nsIRecentBadCertsService)
                   .getRecentBadCert(targetSite); 
    }
    else
    {
      status = Cc["@mozilla.org/security/x509certdb;1"]
                   .getService(Ci.nsIX509CertDB)
                   .getRecentBadCerts(false)
                   .getRecentBadCert(targetSite);
    }
    
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
    Cu.reportError(ex); 
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
 * The callback is invoced when the user wants to reconnect 
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
  // we need this array to corelate status ids and the deck's selectedIndex
  // 0:StatusWait, 1:StatusBadCert, 2:StatusDisabled, 3:StatusConnectionLost,
  // 4:StatusOffline, 5:StatusWarning, 6:StatusOutOfSync, 7:StatusError
  var mapping = { 0:null,1:5,2:7,3:0,4:7,5:1,6:4,7:null,8:2,9:3,10:6};
  
  try {
  var strings = Services.strings.createBundle("chrome://sieve/locale/locale.properties");
  
  
  switch (state)
  {   
    case 1: document.getElementById('StatusWarningMsg')
                .firstChild.nodeValue = strings.GetStringFromName(message);
            break;
    // client error            
    case 2: document.getElementById('StatusErrorMsg')
                .firstChild.nodeValue = strings.GetStringFromName(message);    
            break;
    case 3: document.getElementById('StatusWaitMsg')
                .firstChild.nodeValue = strings.GetStringFromName(message);    
            break;
    // server error
    case 4: document.getElementById('StatusErrorMsg').textContent = message;    
            break;            
    case 5: document.getElementById("btnIgnoreBadCert").setAttribute("message", message);
            document.getElementById("btnIgnoreBadCert").setAttribute("oncommand", 
              "onBadCertOverride(this.getAttribute('message'),document.getElementById('cbBadCertRemember').checked);");
              
            document.getElementById("btnAbortBadCert").setAttribute("oncommand", 
              "onStatus(1,'warning.brokencert');");
                            
            break;
    // Offline Mode
    case 6:
      break;
    // Capabilities set...
    case 7:
      return;
    // account disabled
    case 8:
      document.getElementById('sivAutoConfig').setAttribute("selectedIndex",message);
      break;
      
    case 9:
      break;
      
    case 10:
      document.getElementById("sivClientSide").value = message.local;
      document.getElementById("sivServerSide").value = message.remote;
      break;
    
    // Show the tobber as default...
    default:
      document.getElementById('StatusWaitMsg').firstChild.nodeValue = "";
      state = 0;
  }
  
  document.getElementById('StatusDeck').setAttribute("selectedIndex",""+mapping[state]);
  
  } catch (ex)
  {
    Cu.reportError(state+" || "+message +"||"+ex.toSource());
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

