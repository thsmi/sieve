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
  /* global SieveTemplate */

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
     *   a self reference
     */
    setDisplayName(name) {
      this.getDialog()
        .querySelector(".sieve-settings-displayname").value = name;

      return this;
    }

    /**
     * Gets the account's human readable display name
     * @returns {string}
     *   the display name
     */
    getDisplayName() {
      return this.getDialog()
        .querySelector(".sieve-settings-displayname").value;
    }

    /**
     * Sets the server's hostname.
     *
     * @param {string} hostname
     *   the hostname as string.
     * @returns {SieveServerSettingsUI}
     *   a self reference
     */
    setHostname(hostname) {
      this.getDialog()
        .querySelector(".sieve-settings-hostname").value = hostname;

      return this;
    }

    /**
     * Gets the server's hostname.
     *
     * @returns {string}
     *   the hostname
     */
    getHostname() {
      return this.getDialog()
        .querySelector(".sieve-settings-hostname").value;
    }

    /**
     * Populates the server's port in the dialog
     *
     * @param {string} port
     *   the port
     * @returns {SieveServerSettingsUI}
     *   a self reference
     */
    setPort(port) {
      this.getDialog()
        .querySelector(".sieve-settings-port").value = port;

      return this;
    }

    /**
     * Gets the server's port.
     *
     * @returns {string}
     *   the port as string.
     */
    getPort() {
      return this.getDialog()
        .querySelector(".sieve-settings-port").value;
    }

    /**
     * Sets the server's certificate fingerprint in the ui.
     * The fingerprint is normally a sha checksum.
     *
     * @param {string} fingerprint
     *   the fingerprint.
     * @returns {SieveServerSettingsUI}
     *   a self reference
     */
    setFingerprint(fingerprint) {
      this.getDialog()
        .querySelector(".sieve-settings-fingerprint").value = fingerprint;

      return this;
    }

    /**
     * Gets the server's fingerprint from the setting ui.
     *
     * @returns {string}
     *   the certificate fingerprint
     */
    getFingerprint() {
      return this.getDialog()
        .querySelector(".sieve-settings-fingerprint").value;
    }


    /**
     * Sets the keep alive interval.
     *
     * @param {int} interval
     *   the keep alive interval in ms
     * @returns {SieveServerSettingsUI}
     *   a self reference
     */
    setKeepAlive(interval) {
      // convert to seconds
      interval = interval / ONE_MINUTE;
      this.getDialog()
        .querySelector(".sieve-settings-keepalive-interval").value = interval;

      return this;
    }

    /**
     * Gets the keep alive interval
     *
     * @returns {int}
     *   the keep alive interval
     */
    getKeepAlive() {
      const interval = this.getDialog()
        .querySelector(".sieve-settings-keepalive-interval").value;

      return interval * ONE_MINUTE;
    }

    /**
     * Shows the advanced setting
     *
     */
    showAdvanced() {
      const parent = this.getDialog();

      parent.querySelector(".siv-settings-advanced").classList.remove("d-none");
      parent.querySelector(".siv-settings-show-advanced").classList.add("d-none");
      parent.querySelector(".siv-settings-hide-advanced").classList.remove("d-none");
    }

    /**
     * Hides the advanced settings
     *
     */
    hideAdvanced() {
      const parent = this.getDialog();

      parent.querySelector(".siv-settings-advanced").classList.add("d-none");
      parent.querySelector(".siv-settings-show-advanced").classList.remove("d-none");
      parent.querySelector(".siv-settings-hide-advanced").classList.add("d-none");
    }


    /**
     * Renders the UI element into the dom.
     */
    async render() {
      const parent = this.getDialog();

      // Load all subsections...
      const settings = parent.querySelector(".modal-body");
      while (settings.firstChild)
        settings.removeChild(settings.firstChild);

      settings.appendChild(
        await (new SieveTemplate()).load("./settings/ui/settings.server.tpl"));

      const server = await this.account.send("account-get-server");

      this.setDisplayName(server.displayName);
      this.setHostname(server.hostname);
      this.setPort(server.port);
      this.setFingerprint(server.fingerprint);

      this.setKeepAlive(server.keepAlive);

      parent.querySelector(".siv-settings-show-advanced")
        .addEventListener("click", () => { this.showAdvanced(); });
      parent.querySelector(".siv-settings-hide-advanced")
        .addEventListener("click", () => { this.hideAdvanced(); });

      this.hideAdvanced();
    }

    /**
     * Shows the settings dialog
     * @returns {Promise<boolean>}
     *   false in case the dialog was dismissed otherwise true.
     */
    async show() {

      document.querySelector("#ctx").appendChild(
        await (new SieveTemplate()).load("./settings/ui/settings.dialog.tpl"));

      await this.render();

      return await new Promise((resolve) => {

        $(this.getDialog()).modal('show')
          .on('hidden.bs.modal', () => {
            this.getDialog().parentNode.removeChild(this.getDialog());
            resolve(false);
          });

        this.getDialog()
          .querySelector(".sieve-settings-apply")
          .addEventListener("click", async () => {
            await this.save();
            resolve(true);

            // ... now trigger the hidden listener it will cleanup
            // it is afe to do so due to promise magics, the first
            // alway resolve wins and all subsequent calls are ignored...
            $(this.getDialog()).modal('hide');
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
        displayName: await this.getDisplayName(),
        hostname: await this.getHostname(),
        port: await this.getPort(),
        fingerprint: await this.getFingerprint(),
        keepAlive: await this.getKeepAlive()
      };

      await this.account.send("account-set-server", server);
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

  }
  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveServerSettingsUI;
  else
    exports.SieveServerSettingsUI = SieveServerSettingsUI;

})(this);
