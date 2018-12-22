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
     * A UI renderer for the sieve settings dialog
     */
  class SieveAdvancedSettingsUI {

    /**
     * Initializes the settings
     * @param {SieveAccount} account
     *   the account for which the settings edited.
     */
    constructor(account) {
      this.account = account;
    }

    /**
     * Shows the settings dialog
     */
    show() {
      // TODO show should marked as async so that we can
      // wait for it and trigger
      this.render();
      this.getDialog().modal('show');
    }

    /**
     * Validates and saves the setting before closing the dialog.
     * In case the settings are invalid an error message is displayed.
     */
    async save() {

      // Validate and close
      $('#sieve-dialog-settings').modal('hide');
    }

    /**
     * Retruns the currents diaogs UI Element.
     *
     * @returns {Object}
     *   the dialogs UI elements.
     */
    getDialog() {
      return $("#sieve-dialog-settings");
    }

    /**
     * Renders the UI element into the dom.
     *
     */
    async render() {
      let parent = this.getDialog();

      let loader = new SieveTemplateLoader();

      parent.find(".modal-body").empty()
        .append(await loader.load("./ui/settings/settings.advanced.tpl"));


      parent.find(".sieve-settings-apply").off().click(() => { this.save(); });

      parent.find(".siv-settings-show-advanced").off().click(() => { this.showAdvanced(); });
      parent.find(".siv-settings-hide-advanced").off().click(() => { this.hideAdvanced(); });

      this.hideAdvanced();
    }
  }
  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveAdvancedSettingsUI;
  else
    exports.SieveAdvancedSettingsUI = SieveAdvancedSettingsUI;

})(this);
