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
  /* global SieveTemplateLoader */

  /**
   * Implements a dialog which displays the accounts capabilities.
   */
  class SieveCapabilities {

    /**
     * Shows the capability dialog.
     *
     * @param {object} capabilities
     *   the server's capabilities.
     */
    async show(capabilities) {

      const dialog = await (new SieveTemplateLoader()).load("./accounts/account.capabilities.tpl");
      $("#ctx").append(dialog);

      $('#sieve-dialog-capabilities').modal('show');

      $("#sieve-capabilities-server").text(capabilities.implementation);
      $("#sieve-capabilities-version").text(capabilities.version);
      $("#sieve-capabilities-sasl").text(
        Object.values(capabilities.sasl).join(" "));
      $("#sieve-capabilities-extensions").text(
        Object.keys(capabilities.extensions).join(" "));
      $("#sieve-capabilities-language").text(capabilities.language);

      return await new Promise((resolve) => {

        $('#sieve-dialog-capabilities').modal("show")
          .on("hidden.bs.modal", () => {
            $('#sieve-dialog-capabilities').remove();
            resolve();
          });
      });

    }
  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveCapabilities = SieveCapabilities;
  else
    exports.SieveCapabilities = SieveCapabilities;

})(this);
