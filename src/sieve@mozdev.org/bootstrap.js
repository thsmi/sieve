// Enable Strict Mode
"use strict"; 

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

function startup(data, reason)
{
  if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0)
    Components.manager.addBootstrappedManifestLocation(data.installPath);
 
  // Step 1: Register XPCOM Components
  Cu.import("chrome://sieve/content/components/SieveAccountManager.js");
  SieveAccountManagerComponent.load();

  Components.utils.import("chrome://sieve/content/components/SieveProtocolHandler.js");
  SieveProtocolHandlerComponent.load();
  
  Components.utils.import("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");
  Components.utils.import("chrome://sieve/content/modules/overlays/SieveOverlay.jsm");
  SieveOverlayManager.addOverlay(SieveMailWindowOverlay,"mail:3pane");
  SieveOverlayManager.load();
  // TODO if reason ADDON_UPGRADE restore previously open tabs...
}

function shutdown(data, reason)
{
  // Speedup shutdown, we don't need to cleanup if thunderbird closes
  if (reason == APP_SHUTDOWN)
    return;    

  // TODO if reason ADDON_UPGRADE persist all open tabs...
    
  // Step 1: Unload XPCOM Componenets
  SieveAccountManagerComponent.unload();
  //delete SieveAccountManagerComponent;  
  Components.utils.unload("chrome://sieve/content/components/SieveAccountManager.js")
  
  SieveProtocolHandlerComponent.unload();
  //delete SieveProtocolHandlerComponent;
  Components.utils.unload("chrome://sieve/content/components/SieveProtocolHandler.js");

  
  //Unload modules from memory...
  //Components.utils.unload("chrome://sieve/content/modules/sieve/SieveConnectionManager.js");

  // Step 2: remove Code Injections
  SieveOverlayManager.unload();  

  Components.utils.unload("chrome://sieve/content/modules/overlays/SieveOverlay.jsm");  
  Components.utils.unload("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm"); 

  Cu.unload("chrome://sieve/content/modules/utils/SieveWindowHelper.jsm");  
  
  Cu.reportError("unload completed")
  // Remove Chrome Manifest
  Components.manager.removeBootstrappedManifestLocation(data.installPath);  
};

