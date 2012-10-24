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
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

function install(data, reason)
{
}

function startup(data, reason)
{
  if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0)
    Components.manager.addBootstrappedManifestLocation(data.installPath);
 
  // Step 1: Register XPCOM Components
  Cu.import("chrome://sieve/content/components/SieveAccountManager.js");
  SieveAccountManagerComponent.load();

  Cu.import("chrome://sieve/content/components/SieveProtocolHandler.js");
  SieveProtocolHandlerComponent.load();
  
  Cu.import("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");
  Cu.import("chrome://sieve/content/modules/overlays/SieveOverlay.jsm");
  
  SieveOverlayManager.addOverlay(
      SieveMailWindowOverlay,"chrome://messenger/content/messenger.xul");
  SieveOverlayManager.addOverlay(
      SieveFilterListOverlay,"chrome://messenger/content/FilterListDialog.xul");

  SieveOverlayManager.addOverlay(
      SieveToolbarOverlay, "chrome://global/content/customizeToolbar.xul");
  
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
  Cu.unload("chrome://sieve/content/components/SieveAccountManager.js")
  
  SieveProtocolHandlerComponent.unload();
  //delete SieveProtocolHandlerComponent;
  Cu.unload("chrome://sieve/content/components/SieveProtocolHandler.js");


  // Step 2: remove Code Injections
  SieveOverlayManager.unload();  

  Cu.unload("chrome://sieve/content/modules/overlays/SieveOverlay.jsm");  
  Cu.unload("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm"); 

  Cu.unload("chrome://sieve/content/modules/utils/SieveWindowHelper.jsm");  
  
  // Remove Chrome Manifest
  Components.manager.removeBootstrappedManifestLocation(data.installPath);  
};

