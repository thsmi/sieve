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

  /* global $ */
  const { SieveLogger } = require("./SieveLogger.js");

  /**
   * Loads an html fragment from a file or url.
   */
  class SieveTemplateLoader {

    /**
     * Gets an instance to the logger.
     *
     * @returns {SieveLogger}
     *   an reference to the logger instance.
     **/
    getLogger() {
      return SieveLogger.getInstance();
    }


    /**
     * Loads an html fragment from file or url
     *
     * @param {string} tpl
     *   the path tho the template file
     * @returns {Promise<HTMLElement>}
     *   the template which should be loaded.
     */
    async load(tpl) {

      // ensure we bypass any caching...
      tpl += "?_=" + (new Date().getTime());

      this.getLogger().logWidget(`Load template ${tpl}`);

      return await new Promise((resolve, reject) => {

        const onError = (status, text) => {
          this.getLogger().logWidget(`Loading template ${tpl} failed\n ${status} ${text}`);

          reject(new Error(`Failed to load resource. ${tpl}`));
        };

        const onSuccess = (content) => {
          this.getLogger().logWidget(`Template ${tpl} loaded`);
          resolve($(content.children));
        };

        $("<template />").load(tpl,
          function (response, status, xhr) {
            if (status === "error") {
              onError(xhr.status, xhr.statusText);
              return;
            }

            onSuccess(this.content);
          });
      });
    }
  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveTemplateLoader = SieveTemplateLoader;
  else
    exports.SieveTemplateLoader = SieveTemplateLoader;

})(this);
