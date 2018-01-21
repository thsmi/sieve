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
  /* global SieveIpcClient */

  /**
   * Checks for new updates and display a new message if a newer version is available
   **/
  class SieveUpdaterUI {

    /**
     * Checks for new updates and display a new message if a newer version is available
     * @returns {void}
     */
    async check() {
      let status = await SieveIpcClient.sendMessage("update-check");

      if (status !== true)
        return;

      let template = await (new SieveTemplateLoader()).load("./ui/account/update.tpl");
      template.find(".sieve-update-msg").click(() => {
        SieveIpcClient.sendMessage("update-goto-url");
      });

      $("#ctx").prepend(template);
    }
  }

  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveUpdaterUI;
  else
    exports.SieveUpdaterUI = SieveUpdaterUI;

})(this);
