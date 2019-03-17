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

(function (exports) {

  "use strict";

  /* global Components */
  /* global Services */
  /* global SieveOverlayManager */
  /* global SieveAccountManagerComponent */
  /* global SieveProtocolHandlerComponent */
  /* global SieveMailWindowOverlay */
  /* global SieveToolbarOverlay */

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
   *
   */
  function install(data, reason) {
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
   *
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
   *
   */
  function startup(data, reason) {

    try {
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

      // fixme this is incompatible with newer thunderbirds
      SieveOverlayManager.addOverlay(
        SieveToolbarOverlay, "chrome://global/content/customizeToolbar.xul");

      SieveOverlayManager.load();


      let chromeURL = Services.io.newURI("chrome://sieve/content/libs/");
      const chromeRegistry = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
        .getService(Components.interfaces.nsIChromeRegistry);

      let url = chromeRegistry.convertChromeURL(chromeURL);

      // register  resource protocol
      Services.io
        .getProtocolHandler('resource')
        .QueryInterface(Components.interfaces.nsIResProtocolHandler)
        .setSubstitution('sieve-addon', url);
    }
    catch (ex) {
      Cu.reportError(ex);
    }

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
   *
   */
  function shutdown(data, reason) {
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

    // unregister the resource protocol
    Services.io
      .getProtocolHandler('resource')
      .QueryInterface(Components.interfaces.nsIResProtocolHandler)
      .setSubstitution('sieve-addon', null);

    // Remove Chrome Manifest
    if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0)
      Components.manager.removeBootstrappedManifestLocation(data.installPath);
  }

  exports.install = install;
  exports.uninstall = uninstall;
  exports.startup = startup;
  exports.shutdown = shutdown;

})(this);
