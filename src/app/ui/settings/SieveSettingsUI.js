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
  class SieveSettingsUI {

    /**
     * Initializes the settings
     * @param {SieveAccount} account
     *   the account for which the settings edited.
     */
    constructor(account) {
      this.account = account;
    }

    /**
     * Sets the account's human readable display name
     * @param {String} name
     *   the name which should be set.
     * @returns {SieveSettingsUI}
     *  a self reference
     */
    setDisplayName(name) {
      this.getDialog().find(".sieve-settings-display").val(name);
      return this;
    }

    /**
     * Gets the account'S human readable display name
     * @returns {SieveSettingsUI}
     *   a self reference
     */
    getDisplayName() {
      return this.getDialog().find(".sieve-settings-displayname").val();
    }

    setHostname(hostname) {
      this.getDialog().find(".sieve-settings-hostname").val(hostname);
    }

    getHostname() {
      return this.getDialog().find(".sieve-settings-hostname").val()
    }

    setPort(port) {
      this.getDialog().find(".sieve-settings-port").val(port);
    }

    getPort() {
      return this.getDialog().find(".sieve-settings-port").val()
    }

    /**
     * Gets the current dialog's encryption settings.
     *
     * @returns {boolean}
     *   true in case an encrypted connection should be used otherwise false.
     */
    isEncrypted() {
      let active = this.getDialog().find(".sieve-settings-encryption .active");

      if (active.hasClass("sieve-settings-encryption-disabled"))
        return false;

      return true;
    }

    /**
     * Sets the encryption settings in the current dialog.
     * @param {boolean} encrypted
     *   the encryption status to set. False in case encryption is disabled
     *   otherwise it will be enabled
     * @returns {SieveSettingsUI}
     *   a self reference
     */
    setEncrypted(encrypted) {
      let parent = this.getDialog();

      // reset the toggle button status...
      parent.find(".sieve-settings-encryption .active").removeClass("active");

      if (encrypted === false)
        parent.find(".sieve-settings-encryption-disabled").button('toggle');
      else
        parent.find(".sieve-settings-encryption-enabled").button('toggle');

      return this;
    }

    /**
     * Sets the authentication type
     * @param {String} type
     *   the authentication type which should be used
     * @returns {SieveSettingsUI}
     *   a self reference
     */
    setAuthentication(type) {

      let parent = this.getDialog();

      let text = parent
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
     * @returns {String}
     *  authentication type
     */
    getAuthentication() {
      return this.getDialog()
        .find(".sieve-settings-authentication button")
        .data("sieve-authentication");
    }

    /**
     * Sets the username in the ui
     *
     * @param {String} username
     *   the username which should be set
     * @returns {SieveSettingsUI}
     *   a self reference
     */
    setUsername(username) {
      this.getDialog().find(".sieve-settings-username").val(username);
      return this;
    }

    getUsername() {
      return this.getDialog().find(".sieve-settings-username").val()
    }

    /**
     * Shows the advanced setting
     * @returns {void}
     */
    showAdvanced() {
      let parent = this.getDialog();

      parent.find(".siv-settings-advanced").show();
      parent.find(".siv-settings-show-advanced").hide();
      parent.find(".siv-settings-hide-advanced").show();
    }

    /**
     * Hides the advanced settings
     * @returns {void}
     */
    hideAdvanced() {
      let parent = this.getDialog();

      parent.find(".siv-settings-advanced").hide();
      parent.find(".siv-settings-show-advanced").show();
      parent.find(".siv-settings-hide-advanced").hide();
    }

    /**
     * Shows the settings dialog
     * @returns {void}
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
     * @return {void}
     */
    async save() {

      let server = {
        displayName : this.getDisplayName(),
        hostname: this.getHostname(),
        port: this.getPort(),
        secure: this.isEncrypted(),
      };

      await this.account.send("account-set-server", server);

      let authentication = {
        username: this.getUsername(),
        mechanism: this.getAuthentication()
      };

      await this.account.send("account-set-authentication", authentication);

      // Validate and close
      $('#sieve-dialog-settings').modal('hide');

      await this.account.connect();
    }

    /**
     * Retruns the currents diaogs UI Element.
     *
     * @return {Object}
     *   the dialogs UI elements.
     */
    getDialog() {
      return $("#sieve-dialog-settings");
    }

    /**
     * Renders the UI element into the dom.
     * @returns {void}
     */
    async render() {
      let parent = this.getDialog();

      let loader = new SieveTemplateLoader();

      let item = await loader.load("./ui/settings/settings.tpl");

      // Load all subsectionss...
      item.find(".siv-settings-server-tpl").append(
        await loader.load("./ui/settings/settings.server.tpl"));
      item.find(".siv-settings-authentification-tpl").append(
        await loader.load("./ui/settings/settings.authentification.tpl"));
      item.find(".siv-settings-authorization-tpl").append(
        await loader.load("./ui/settings/settings.authorization.tpl"));
      item.find(".siv-settings-general-tpl").append(
        await loader.load("./ui/settings/settings.general.tpl"));
      item.find(".siv-settings-debug-tpl").append(
        await loader.load("./ui/settings/settings.debug.tpl"));

      parent.find(".modal-body").empty().append(item);

      let server = await this.account.send("account-get-server");

      this.setDisplayName(server.displayName);
      this.setHostname(server.hostname);
      this.setPort(server.port);
      this.setEncrypted(server.secure);

      let authentication = await this.account.send("account-get-authentication");

      this.setAuthentication(authentication.mechanism);
      this.setUsername(authentication.username);

      parent.find(".sieve-settings-authentication .dropdown-item").click((event) => {
        this.getDialog()
          .find(".sieve-settings-authentication button")
          .data("sieve-authentication", $(event.target).data("sieve-authentication"))
          .text($(event.target).text());
      });


      parent.find(".sieve-settings-apply").off().click(() => { this.save(); });

      parent.find(".siv-settings-show-advanced").off().click(() => { this.showAdvanced(); });
      parent.find(".siv-settings-hide-advanced").off().click(() => { this.hideAdvanced(); });

      this.hideAdvanced();
    }
  }
  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveSettingsUI;
  else
    exports.SieveSettingsUI = SieveSettingsUI;

})(this);