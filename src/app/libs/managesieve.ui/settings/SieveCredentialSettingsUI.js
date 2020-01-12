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
  class SieveCredentialsSettingsUI {

    /**
     * Initializes the settings
     * @param {SieveAccount} account
     *   the account for which the settings edited.
     */
    constructor(account) {
      this.account = account;
    }

    /**
     * Sets the authentication type
     * @param {string} type
     *   the authentication type which should be used
     * @returns {SieveCredentialsUI}
     *   a self reference
     */
    setSaslMechanism(type) {

      const parent = this.getDialog();

      const text = parent
        .find(".sieve-settings-authentication")
        .find(".dropdown-item[data-sieve-authentication=" + type + "]")
        .text();

      parent
        .find(".sieve-settings-authentication button")
        .data("sieve-authentication", type)
        .text(text);

      return this;
    }

    /**
     * The authentication type which was selected
     *
     * @returns {string}
     *  authentication type
     */
    getSaslMechanism() {
      return this.getDialog()
        .find(".sieve-settings-authentication button")
        .data("sieve-authentication");
    }

    /**
     * Sets the username in the ui
     *
     * @param {string} username
     *   the username which should be set
     * @returns {SieveSettingsUI}
     *   a self reference
     */
    setAuthentication(username) {
      this.getDialog().find(".sieve-settings-username").val(username);
      return this;
    }

    /**
     * Gets the username from the ui.
     *
     * @returns {string}
     *   the username as string.
     */
    getAuthentication() {
      return this.getDialog().find(".sieve-settings-username").val();
    }

    setAuthorizationType(type) {
      const parent = this.getDialog();

      const text = parent
        .find(".sieve-settings-authorization")
        .find(".dropdown-item[data-sieve-authorization=" + type + "]")
        .text();

      parent
        .find(".sieve-settings-authorization button")
        .data("sieve-authorization", type)
        .text(text);

      return this;
    }

    getAuthorizationType() {
      return this.getDialog()
        .find(".sieve-settings-authorization button")
        .data("sieve-authorization");
    }

    setAuthorization(username) {
      this.getDialog().find(".sieve-settings-text-authorization-username").val(username);
      return this;
    }

    getAuthorization() {
      return this.getDialog().find(".sieve-settings-text-authorization-username").val();
    }

    /**
     * Gets the current dialog's encryption settings.
     *
     * @returns {boolean}
     *   true in case an encrypted connection should be used otherwise false.
     */
    isEncrypted() {
      const active = this.getDialog().find(".sieve-settings-encryption .active");

      if (active.hasClass("sieve-settings-encryption-disabled"))
        return false;

      return true;
    }

    /**
     * Sets the encryption settings in the current dialog.
     * @param {boolean} encrypted
     *   the encryption status to set. False in case encryption is disabled
     *   otherwise it will be enabled
     * @returns {SieveServerSettingsUI}
     *   a self reference
     */
    setEncrypted(encrypted) {
      const parent = this.getDialog();

      // reset the toggle button status...
      parent.find(".sieve-settings-encryption .active").removeClass("active");

      if (encrypted === false)
        parent.find(".sieve-settings-encryption-disabled").button('toggle');
      else
        parent.find(".sieve-settings-encryption-enabled").button('toggle');

      return this;
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
     * Shows the settings dialog
     */
    async show() {
      // TODO show should marked as async so that we can
      // wait for it and trigger
      this.render();

      return await new Promise((resolve) => {

        const dialog = this.getDialog();

        dialog.modal('show')
          .on('hidden.bs.modal', () => {
            // dialog.remove();
            resolve(false);
          })
          .find(".sieve-settings-apply").off().click(async () => {
            await this.save();
            resolve(true);
            // ... now trigger the hidden listener it will cleanup
            // it is afe to do so due to promise magics, the first
            // alway resolve wins and all subsequent calls are ignored...
            dialog.modal("hide");
          });
      });
    }

    /**
     * Validates and saves the setting before closing the dialog.
     * In case the settings are invalid an error message is displayed.
     */
    async save() {

      const settings = {
        general : {
          secure: this.isEncrypted(),
          sasl: this.getSaslMechanism()
        },
        authentication : {
          username: this.getAuthentication(),
          mechanism: 0
        },
        authorization : {
          username: this.getAuthorization(),
          mechanism: this.getAuthorizationType()
        }
      };

      await this.account.send("account-settings-set-credentials", settings);
    }

    /**
     * Retruns the currents diaogs UI Element.
     *
     * @returns {object}
     *   the dialogs UI elements.
     */
    getDialog() {
      return $("#sieve-dialog-settings");
    }

    /**
     * Renders the UI element into the dom.
     */
    async render() {
      const parent = this.getDialog();

      const loader = new SieveTemplateLoader();

      // Load all subsectionss...
      parent.find(".modal-body").empty()
        .append(await loader.load("./settings/settings.credentials.tpl"));

      const credentials = await this.account.send("account-setting-get-credentials");

      // Authentication settings
      this.setEncrypted(credentials.general.secure);
      this.setSaslMechanism(credentials.general.sasl);

      this.setAuthentication(credentials.authentication.username);

      parent.find(".sieve-settings-authentication .dropdown-item").click((event) => {
        this.getDialog()
          .find(".sieve-settings-authentication button")
          .data("sieve-authentication", $(event.target).data("sieve-authentication"))
          .text($(event.target).text());
      });

      // Authorization settings....
      this.setAuthorizationType(credentials.authorization.type);
      this.setAuthorization(credentials.authorization.username);

      parent.find(".sieve-settings-authorization .dropdown-item").click((event) => {
        this.getDialog()
          .find(".sieve-settings-authorization button")
          .data("sieve-authorization", $(event.target).data("sieve-authorization"))
          .text($(event.target).text());

        if ("" + $(event.target).data("sieve-authorization") === "3")
          this.getDialog().find(".sieve-settings-authorization-username").show();
        else
          this.getDialog().find(".sieve-settings-authorization-username").hide();

      });

      parent.find(".siv-settings-show-advanced").off().click(() => { this.showAdvanced(); });
      parent.find(".siv-settings-hide-advanced").off().click(() => { this.hideAdvanced(); });

      this.hideAdvanced();
    }
  }
  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveCredentialsSettingsUI;
  else
    exports.SieveCredentialsSettingsUI = SieveCredentialsSettingsUI;

})(this);
