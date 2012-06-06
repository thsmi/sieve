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

/*
 *  Auto Config
 */ 

var gAutoConfig = null;
var gAccount = null;
var gEvents = null;

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
  gEvents.onReconnect();
}

function onReconnectClick()
{
  gEvents.onReconnect();   
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
      
    gEvents.onReconnect();
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
}

function onAttach(account, handler)
{  
  if (gAutoConfig)
  {
    gAutoConfig.cancel();
    gAutoConfig = null;
  }
  
  gAccount = account;   
  gEvents = handler;
}

function onStatus(state, message)
{
  
  var strbundle = document.getElementById("strings");
  
  document.getElementById('sivExplorerWarning').setAttribute('hidden','true');
  document.getElementById('sivExplorerError').setAttribute('hidden','true');
  document.getElementById('sivExplorerWait').setAttribute('hidden','true');
  document.getElementById('sivExplorerBadCert').setAttribute('hidden','true');
  document.getElementById('sivExplorerOffline').setAttribute('hidden','true');
  document.getElementById('sivExplorerDisabled').setAttribute('hidden','true');
  document.getElementById('sivExplorerConnectionLost').setAttribute('hidden','true');
  
  
  switch (state)
  {   
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
              "onStatus(1,'warning.brokencert');");
                            
            break;
    // Offline Mode
    case 6: document.getElementById('sivExplorerOffline').removeAttribute('hidden');
            break;
  /*  // Capabilities set...
    case 7: document.getElementById('sivExplorerWait').removeAttribute('hidden');
            break;*/
    // account disabled
    case 8: document.getElementById('sivExplorerDisabled').removeAttribute('hidden');
            document.getElementById('sivAutoConfig').selectedIndex = message;
            break;  
    case 9: document.getElementById('sivExplorerConnectionLost').removeAttribute('hidden');
            break;
      
    // Show the tobber as default...
    default:
      document.getElementById('sivExplorerWait').removeAttribute('hidden');
  }
}

function onSettingsClick()
{
  var server = Cc['@mozilla.org/messenger/account-manager;1']
                   .getService(Ci.nsIMsgAccountManager)
                   .getIncomingServer(gAccount.imapKey);
  
  gSivExtUtils.OpenSettings(server);
}


// ChannelCreated
// ChannelClosed
// ChannelReady
// ChannelStatus

// Events Account Switch
// Status Change
