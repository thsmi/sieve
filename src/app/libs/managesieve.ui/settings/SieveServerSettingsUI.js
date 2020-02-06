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
  const ONE_MINUTE = 60 * 1000;

  /**
   * A UI renderer for the sieve settings dialog
   */
  class SieveServerSettingsUI {

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
     * @param {string} name
     *   the name which should be set.
     * @returns {SieveServerSettingsUI}
     *  a self reference
     */
    setDisplayName(name) {
      this.getDialog().find(".sieve-settings-displayname").val(name);
      return this;
    }

    /**
     * Gets the account's human readable display name
     * @returns {string}
     *   the display name
     */
    getDisplayName() {
      return this.getDialog().find(".sieve-settings-displayname").val();
    }

    /**
     * Sets the server's hostname.
     *
     * @param {string} hostname
     *   the hostname as string.
     * @returns {SieveServerSettingsUI}
     *  a self reference
     */
    setHostname(hostname) {
      this.getDialog().find(".sieve-settings-hostname").val(hostname);
      return this;
    }

    /**
     * Gets the server's hostname.
     *
     * @returns {string}
     *   the hostname
     */
    getHostname() {
      return this.getDialog().find(".sieve-settings-hostname").val();
    }

    /**
     * Populates the server's port in the dialog
     *
     * @param {string} port
     *   the port
     */
    setPort(port) {
      this.getDialog().find(".sieve-settings-port").val(port);
    }

    /**
     * Gets the server's port.
     *
     * @returns {string}
     *   the port as string.
     */
    getPort() {
      return this.getDialog().find(".sieve-settings-port").val();
    }

    /**
     * Sets the server's certificate fingerpint in the ui.
     * The fingerprint is normally a sha checksum.
     *
     * @param {string} fingerprint
     *   the fingerprint.
     * @returns {SieveServerSettingsUI}
     *  a self reference
     */
    setFingerprint(fingerprint) {
      this.getDialog().find(".sieve-settings-fingerprint").val(fingerprint);
      return this;
    }

    /**
     * Gets the server's fingerpint from the setting ui.
     * @returns {string}
     *   the certificate fingerpint
     */
    getFingerprint() {
      return this.getDialog().find(".sieve-settings-fingerprint").val();
    }

    /**
     * Enabled or disables th keep alive button in the ui
     *
     * @param {boolean} enabled
     *   set to true in case the keep alive is enabled otherwise set to false
     * @returns {SieveServerSettingsUI}
     *   a self reference
     */
    setKeepAliveEnabled(enabled) {
      const parent = this.getDialog();

      // reset the toggle button status...
      parent.find(".sieve-settings-keepalive .active").removeClass("active");

      if (enabled === false)
        parent.find(".sieve-settings-keepalive-disabled").button('toggle');
      else
        parent.find(".sieve-settings-keepalive-enabled").button('toggle');

      return this;
    }

    /**
     * Returns the keep alive status
     * @returns {boolean}
     *   true in case keep alive is enabled otherwise false.
     */
    isKeepAliveEnabled() {
      const active = this.getDialog().find(".sieve-settings-keepalive .active");

      if (active.hasClass("sieve-settings-keepalive-disabled"))
        return false;

      return true;
    }

    /**
     * Sets the keep alive interval
     * @param {int} interval
     *  the keep alive interval in ms
     * @returns {SieveServerSettingsUI}
     *   a self reference
     */
    setKeepAliveInterval(interval) {
      // convert to seconds
      interval = interval / ONE_MINUTE;
      this.getDialog().find(".sieve-settings-keepalive-interval").val(interval);
      return this;
    }

    /**
     * Gets the keep alive interval
     *
     * @returns {int}
     *   the keep alive interval
     */
    getKeepAliveInterval() {
      const interval = this.getDialog().find(".sieve-settings-keepalive-interval").val();
      return interval * ONE_MINUTE;
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
     * @returns {Promise<boolean>}
     *   false in case the dialog was dismissed otherwise true.
     */
    async show() {

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
     *
     */
    async save() {

      const server = {
        displayName: this.getDisplayName(),
        hostname: this.getHostname(),
        port: this.getPort(),
        fingerprint: this.getFingerprint()
      };

      await this.account.send("account-set-server", server);

      const general = {
        keepAliveEnabled: this.isKeepAliveEnabled(),
        keepAliveInterval: this.getKeepAliveInterval()
      };

      await this.account.send("account-set-general", general);

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
        .append(await loader.load("./settings/settings.server.tpl"));

      const server = await this.account.send("account-get-server");

      this.setDisplayName(server.displayName);
      this.setHostname(server.hostname);
      this.setPort(server.port);
      this.setFingerprint(server.fingerprint);

      const general = await this.account.send("account-get-general");
      this.setKeepAliveEnabled(general.keepAliveEnabled);
      this.setKeepAliveInterval(general.keepAliveInterval);

      parent.find(".siv-settings-show-advanced").off().click(() => { this.showAdvanced(); });
      parent.find(".siv-settings-hide-advanced").off().click(() => { this.hideAdvanced(); });

      this.hideAdvanced();
    }
  }
  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveServerSettingsUI;
  else
    exports.SieveServerSettingsUI = SieveServerSettingsUI;

})(this);
