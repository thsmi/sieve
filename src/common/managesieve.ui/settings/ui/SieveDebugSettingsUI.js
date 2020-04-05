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

  // eslint-disable-next-line no-magic-numbers
  const LOG_ACCOUNT_REQUEST = (1 << 0);
  // eslint-disable-next-line no-magic-numbers
  const LOG_ACCOUNT_RESPONSE = (1 << 1);
  // eslint-disable-next-line no-magic-numbers
  const LOG_ACCOUNT_STATE = (1 << 2);
  // eslint-disable-next-line no-magic-numbers
  const LOG_ACCOUNT_STREAM = (1 << 3);
  // eslint-disable-next-line no-magic-numbers
  const LOG_ACCOUNT_SESSION_INFO = (1 << 4);

  // eslint-disable-next-line no-magic-numbers
  const LOG_GLOBAL_IPC_MESSAGES = (1 << 0);
  // eslint-disable-next-line no-magic-numbers
  const LOG_GLOBAL_ACTION = (1 << 1);
  // eslint-disable-next-line no-magic-numbers
  const LOG_GLOBAL_WIDGET = (1 << 2);

  /**
   * A UI renderer for the sieve debug settings dialog
   */
  class SieveDebugSettingsUI {

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
      this.render();
      this.getDialog().modal('show');
    }

    /**
     * Reads the currently set account log level from the dialog.
     *
     * @returns {int}
     *   the account log level as integer.
     */
    getAccountLogLevel() {
      let level = 0x00;

      if ($("#debugClientServer").prop("checked"))
        level |= LOG_ACCOUNT_REQUEST;

      if ($("#debugServerClient").prop("checked"))
        level |= LOG_ACCOUNT_RESPONSE;

      if ($("#debugSessionManagement").prop("checked"))
        level |= LOG_ACCOUNT_SESSION_INFO;

      if ($("#debugStateMachine").prop("checked"))
        level |= LOG_ACCOUNT_STATE;

      if ($("#debugRawDump").prop("checked"))
        level |= LOG_ACCOUNT_STREAM;

      return level;
    }

    /**
     * Sets the account log level in the dialog.
     *
     * @param {int} level
     *   the account log level as integer
     */
    setAccountLogLevel(level) {

      $("#debugClientServer").prop( "checked", (level & LOG_ACCOUNT_REQUEST) );
      $("#debugServerClient").prop( "checked", (level & LOG_ACCOUNT_RESPONSE) );
      $("#debugSessionManagement").prop( "checked", (level & LOG_ACCOUNT_SESSION_INFO) );
      $("#debugStateMachine").prop( "checked", (level & LOG_ACCOUNT_STATE) );
      $("#debugRawDump").prop( "checked", (level & LOG_ACCOUNT_STREAM) );
    }

    /**
     * Reads the currently set global log level from the dialog.
     *
     * @returns {int}
     *   the global log level as integer.
     */
    getGlobalLogLevel() {
      let level = 0x00;

      if ($("#debugActions").prop( "checked"))
        level |= LOG_GLOBAL_ACTION;

      if ($("#debugIpcMessages").prop( "checked"))
        level |= LOG_GLOBAL_IPC_MESSAGES;

      if ($("#debugWidgets").prop( "checked"))
        level |= LOG_GLOBAL_WIDGET;

      return level;
    }

    /**
     * Sets the global log level in the dialog.
     *
     * @param {int} level
     *   the global log level as integer
     */
    setGlobalLogLevel(level) {
      $("#debugActions").prop( "checked", (level & LOG_GLOBAL_ACTION) );
      $("#debugIpcMessages").prop( "checked", (level & LOG_GLOBAL_IPC_MESSAGES) );
      $("#debugWidgets").prop( "checked", (level & LOG_GLOBAL_WIDGET) );
    }

    /**
     * Validates and saves the setting before closing the dialog.
     * In case the settings are invalid an error message is displayed.
     */
    async save() {

      const levels = {
        account  : this.getAccountLogLevel(),
        global : this.getGlobalLogLevel()
      };

      await this.account.send("account-settings-set-debug", {"levels" : levels});

      // Validate and close
      $('#sieve-dialog-settings').modal('hide');
    }

    /**
     * Returns the currents dialogs UI Element.
     *
     * @returns {object}
     *   the dialogs UI elements.
     */
    getDialog() {
      return $("#sieve-dialog-settings");
    }

    /**
     * Shows the advanced setting
     *
     */
    showAdvanced() {
      const parent = this.getDialog();

      parent.find(".siv-settings-advanced").show();
      parent.find(".siv-settings-show-advanced").hide();
      parent.find(".siv-settings-hide-advanced").show();
    }

    /**
     * Hides the advanced settings
     *
     */
    hideAdvanced() {
      const parent = this.getDialog();

      parent.find(".siv-settings-advanced").hide();
      parent.find(".siv-settings-show-advanced").show();
      parent.find(".siv-settings-hide-advanced").hide();
    }

    /**
     * Renders the UI element into the dom.
     *
     */
    async render() {
      const parent = this.getDialog();

      parent.find(".modal-body").empty()
        .append(await (new SieveTemplateLoader().load("./settings/ui/settings.debug.tpl")));

      const levels = await this.account.send("account-settings-get-debug");

      this.setAccountLogLevel(levels.account);
      this.setGlobalLogLevel(levels.global);

      parent.find(".sieve-settings-apply").off().click(() => { this.save(); });

      parent.find(".siv-settings-show-advanced").off().click(() => { this.showAdvanced(); });
      parent.find(".siv-settings-hide-advanced").off().click(() => { this.hideAdvanced(); });

      this.hideAdvanced();
    }
  }
  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveDebugSettingsUI;
  else
    exports.SieveDebugSettingsUI = SieveDebugSettingsUI;

})(this);
