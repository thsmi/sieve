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
  // eslint-disable-next-line no-magic-numbers
  const LOG_GLOBAL_I18N = (1 << 3);

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
     * Renders the UI element into the dom.
     */
    async render() {
      const dialog = this.getDialog();

      const settings = dialog.querySelector(".modal-body");
      while (settings.firstChild)
        settings.removeChild(settings.firstChild);

      settings.appendChild(
        (await (new SieveTemplateLoader().load("./settings/ui/settings.debug.tpl")))[0]);

      const levels = await this.account.send("account-settings-get-debug");

      this.setAccountLogLevel(levels.account);
      this.setGlobalLogLevel(levels.global);

      dialog.querySelector(".sieve-settings-apply")
        .addEventListener("click", () => { this.save(); });

      dialog.querySelector(".siv-settings-show-advanced")
        .addEventListener("click", () => { this.showAdvanced(); });
      dialog.querySelector(".siv-settings-hide-advanced")
        .addEventListener("click", () => { this.hideAdvanced(); });

      this.hideAdvanced();

    }

    /**
     * Shows the settings dialog
     */
    async show() {

      document.querySelector("#ctx").appendChild(
        (await (new SieveTemplateLoader()).load("./settings/ui/settings.dialog.tpl"))[0]);

      await this.render();

      return await new Promise((resolve) => {

        $(this.getDialog()).modal("show")
          .on("hidden.bs.modal", () => {
            $(this.getDialog()).remove();
            resolve();
          });
      });

    }

    /**
     * Reads the currently set account log level from the dialog.
     *
     * @returns {int}
     *   the account log level as integer.
     */
    getAccountLogLevel() {
      let level = 0x00;

      if (document.querySelector("#debugClientServer").checked === true)
        level |= LOG_ACCOUNT_REQUEST;

      if (document.querySelector("#debugServerClient").checked === true)
        level |= LOG_ACCOUNT_RESPONSE;

      if (document.querySelector("#debugSessionManagement").checked === true)
        level |= LOG_ACCOUNT_SESSION_INFO;

      if (document.querySelector("#debugStateMachine").checked === true)
        level |= LOG_ACCOUNT_STATE;

      if (document.querySelector("#debugRawDump").checked === true)
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

      document.querySelector("#debugClientServer").checked = (level & LOG_ACCOUNT_REQUEST);
      document.querySelector("#debugServerClient").checked = (level & LOG_ACCOUNT_RESPONSE);
      document.querySelector("#debugSessionManagement").checked = (level & LOG_ACCOUNT_SESSION_INFO);
      document.querySelector("#debugStateMachine").checked = (level & LOG_ACCOUNT_STATE);
      document.querySelector("#debugRawDump").checked = (level & LOG_ACCOUNT_STREAM);
    }

    /**
     * Reads the currently set global log level from the dialog.
     *
     * @returns {int}
     *   the global log level as integer.
     */
    getGlobalLogLevel() {
      let level = 0x00;

      if (document.querySelector("#debugActions").checked)
        level |= LOG_GLOBAL_ACTION;

      if (document.querySelector("#debugIpcMessages").checked)
        level |= LOG_GLOBAL_IPC_MESSAGES;

      if (document.querySelector("#debugWidgets").checked)
        level |= LOG_GLOBAL_WIDGET;

      if (document.querySelector("#debugI18n").checked)
        level |= LOG_GLOBAL_I18N;

      return level;
    }

    /**
     * Sets the global log level in the dialog.
     *
     * @param {int} level
     *   the global log level as integer
     */
    setGlobalLogLevel(level) {
      document.querySelector("#debugActions").checked = (level & LOG_GLOBAL_ACTION);
      document.querySelector("#debugIpcMessages").checked = (level & LOG_GLOBAL_IPC_MESSAGES);
      document.querySelector("#debugWidgets").checked = (level & LOG_GLOBAL_WIDGET);
      document.querySelector("#debugI18n").checked = (level & LOG_GLOBAL_I18N);
    }

    /**
     * Validates and saves the setting before closing the dialog.
     * In case the settings are invalid an error message is displayed.
     */
    async save() {

      const levels = {
        account: this.getAccountLogLevel(),
        global: this.getGlobalLogLevel()
      };

      await this.account.send("account-settings-set-debug", { "levels": levels });

      // Validate and close
      $('#sieve-dialog-settings').modal('hide');
    }

    /**
     * Returns the currents dialogs UI Element.
     *
     * @returns {HTMLElement}
     *   the dialogs UI elements.
     */
    getDialog() {
      return document.querySelector("#sieve-dialog-settings");
    }

    /**
     * Shows the advanced setting
     */
    showAdvanced() {
      const parent = this.getDialog();

      parent.querySelector(".siv-settings-advanced").style.display = "";
      parent.querySelector(".siv-settings-show-advanced").style.display = "none";
      parent.querySelector(".siv-settings-hide-advanced").style.display = "";
    }

    /**
     * Hides the advanced settings
     */
    hideAdvanced() {
      const parent = this.getDialog();

      parent.querySelector(".siv-settings-advanced").style.display = "none";
      parent.querySelector(".siv-settings-show-advanced").style.display = "";
      parent.querySelector(".siv-settings-hide-advanced").style.display = "none";
    }

  }
  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveDebugSettingsUI;
  else
    exports.SieveDebugSettingsUI = SieveDebugSettingsUI;

})(this);
