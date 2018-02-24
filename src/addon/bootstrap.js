/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

/* global Components */
/* global Services */
/* global SieveOverlayManager */
/* global SieveAccountManagerComponent */
/* global SieveProtocolHandlerComponent */
/* global SieveMailWindowOverlay */
/* global SieveToolbarOverlay */

// Enable Strict Mode
"use strict";

const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

/**
 * Called when the addon is installed.
 * It will be also called in case of an update.
 *
 * @param {*} data
 *   informations about the addon which should be installed
 * @param {*} reason
 *   the reason why the addon should be installed.
 * @returns {void}
 */
function install(data, reason)
{
}

/**
 * Called when the addon is uninstalled.
 * It can be used to remove preferences and passwords etc.
 * It will be also called in case of an update.
 *
 * @param {*} data
 *   informations about the addon which should be uninstalled
 * @param {*} reason
 *   the reason why the addon should be uninstalled.
 * @returns {void}
 */
function uninstall(data, reason) {
}

/**
 * Called when the addon should inject the bootstrap code into thunderbird.
 *
 * @param {*} data
 *   the startup information provided by thunderbird.
 * @param {*} reason
 *   the reason why the addon should be activated.
 * @returns {void}
 */
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
    SieveMailWindowOverlay, "chrome://messenger/content/messenger.xul");
  /* SieveOverlayManager.addOverlay(
      SieveFilterListOverlay,"chrome://messenger/content/FilterListDialog.xul");*/

  SieveOverlayManager.addOverlay(
    SieveToolbarOverlay, "chrome://global/content/customizeToolbar.xul");

  SieveOverlayManager.load();

  // TODO if reason ADDON_UPGRADE restore previously open tabs...
}

/**
 * Called by thunderbird when the addon should unload.
 * This is either when the addon gets deactivated, uninstalled or on shutdown.
 *
 * @param {*} data
 *   the startup information provided by thunderbird.
 * @param {*} reason
 *   the reason why the addon should be unloaded.
 * @returns {void}
 */
function shutdown(data, reason)
{
  // Speedup shutdown, we don't need to cleanup if thunderbird closes
  if (reason === APP_SHUTDOWN)
    return;

  // TODO if reason ADDON_UPGRADE persist all open tabs...

  // Step 1: Unload XPCOM Componenets
  SieveAccountManagerComponent.unload();
  // delete SieveAccountManagerComponent;
  Cu.unload("chrome://sieve/content/components/SieveAccountManager.js");

  SieveProtocolHandlerComponent.unload();
  // delete SieveProtocolHandlerComponent;
  Cu.unload("chrome://sieve/content/components/SieveProtocolHandler.js");

  // Step 2: remove Code Injections
  SieveOverlayManager.unload();

  Cu.unload("chrome://sieve/content/modules/overlays/SieveOverlay.jsm");
  Cu.unload("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");

  Cu.unload("chrome://sieve/content/modules/utils/SieveWindowHelper.jsm");

  // Remove Chrome Manifest
  Components.manager.removeBootstrappedManifestLocation(data.installPath);
}

