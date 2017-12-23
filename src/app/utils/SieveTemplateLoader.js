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

// Require defines an exports object, while standard js does not
// we ues this magic to glue both world together.
if (typeof (exports) === "undefined" || exports === null)
  exports = this;

(function (exports) {

    "use strict";

    /* global $ */

    /**
     * Loads an html fragment from a file or url.
     */
    class SieveTemplateLoader {

      /**
       * Initializes the template loader
       */
      constructor() {
        this.templates = {};
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

        return await new Promise((resolve) => {

          // TODO add an error handler.

          $("<template />").load(tpl, function () {
            resolve($(this.content.children));
          });
        });
      }
    }

    exports.SieveTemplateLoader = SieveTemplateLoader;

})(exports);