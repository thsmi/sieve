/*
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

(function (exports) {

  "use strict";

  /* global ExtensionCommon */
  /* global Components */
  /* global ChromeUtils */

  const Cu = Components.utils;

  /**
   * Implements a webextension api for sieve session and connection management.
   */
  class SieveMenuApi extends ExtensionCommon.ExtensionAPI {
    /**
     * @inheritdoc
     */
    getAPI(context) {

      const url = context.extension.getURL();

      // TODO Add SieveOverlayManager into this class

      const subScript = {};
      Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
        .getService(Components.interfaces.mozIJSSubScriptLoader)
        .loadSubScript(`${url}/SieveRequire.jsm`, subScript);

      const { require } = subScript.loadRequire(`${url}/api/sieve/`);

      const { SieveOverlayManager } = require("./SieveOverlayManager.js");

      return {
        sieve: {
          menu: {

            onCommand: new ExtensionCommon.EventManager({
              context,
              name: "sieve.session.onCommand",
              register: (fire) => {

                const callback = async () => {
                  return await fire.async();
                };

                SieveOverlayManager.on("command", callback);

                return () => {
                  SieveOverlayManager.on("command");
                };
              }
            }).api(),

            async addMenuItem(id, options) {
              // TODO make implementation more generic

         /*     type : label || separator
              label : text
              accesskey : key
              insert: before || after || first || last
              sibling : id*/
            },

            async addAppViewItem(id, options) {

              // TODO make implementation more generic

              /*type: label || separator
              label: text
              accesskey: key
              view: "appMenu-filtersView"
              insert: before || after || first || last
              sibling: id*/

            },

            async load() {
              try {
                await SieveOverlayManager.addOverlay2().load();
              } catch (ex) {
                console.error("Load failed " + ex);
                throw ex;
              }
            },

            async unload() {
              console.warn("Menu API unload called");
              // Step 2: remove Code Injections
              SieveOverlayManager.unload();

              // FIXME: this doesn't work...
              Cu.unload("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");
            }
          }
        }
      };
    }
  }

  exports.SieveMenuApi = SieveMenuApi;

})(this);
