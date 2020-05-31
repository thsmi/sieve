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
     *
     * @param {string} type
     *   the authentication type which should be used
     * @returns {SieveCredentialsUI}
     *   a self reference
     */
    setSaslMechanism(type) {

      const parent = this.getDialog();

      const text = parent
        .querySelector(".sieve-settings-authentication")
        .querySelector(`.dropdown-item[data-sieve-authentication="${type}"]`)
        .textContent;

      parent
        .querySelector(".sieve-settings-authentication button")
        .dataset.sieveAuthentication = type;

      parent
        .querySelector(".sieve-settings-authentication button")
        .textContent = text;

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
        .querySelector(".sieve-settings-authentication button")
        .dataset.sieveAuthentication;
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
      this.getDialog()
        .querySelector(".sieve-settings-username").value = username;

      return this;
    }

    /**
     * Gets the username from the ui.
     *
     * @returns {string}
     *   the username as string.
     */
    getAuthentication() {
      return this.getDialog()
        .querySelector(".sieve-settings-username").value;
    }

    /**
     * Selects the given authorization type in the dropdown control.
     *
     * @param {int|string} type
     *   the authorization type to be activated.
     * @returns {SieveCredentialsSettingsUI}
     *   a self reference.
     */
    setAuthorizationType(type) {
      const dialog = this.getDialog();

      const text = dialog
        .querySelector(".sieve-settings-authorization")
        .querySelector(`.dropdown-item[data-sieve-authorization="${type}"]`)
        .textContent;

      dialog
        .querySelector(".sieve-settings-authorization button")
        .dataset.sieveAuthorization = type;

      dialog
        .querySelector(".sieve-settings-authorization button")
        .textContent = text;

      if (`${type}` === "3")
        dialog.querySelector(".sieve-settings-authorization-username").style.display = "";
      else
        dialog.querySelector(".sieve-settings-authorization-username").style.display = "none";

      return this;
    }

    /**
     * Gets the current authorization type set in the dropdown menu.
     *
     * @returns {string}
     *   the authorization type as string.
     */
    getAuthorizationType() {
      return this.getDialog()
        .querySelector(".sieve-settings-authorization button")
        .dataset.sieveAuthorization;
    }

    /**
     * Sets the authorization name.
     * Authorization allows an authenticated user (normally admin)
     * to access an other users sieve account.
     *
     * @param {string} username
     *   the username as which the current user should authorized
     * @returns {SieveSettingsUI}
     *   a self reference
     */
    setAuthorization(username) {
      this.getDialog()
        .querySelector(".sieve-settings-text-authorization-username").value = username;

      return this;
    }

    /**
     * Gets the authorization name from the ui.
     *
     * @returns {string}
     *   the authorized username.
     */
    getAuthorization() {
      return this.getDialog()
        .querySelector(".sieve-settings-text-authorization-username").value;
    }

    /**
     * Gets the current dialogs encryption settings.
     *
     * @returns {boolean}
     *   true in case an encrypted connection should be used otherwise false.
     */
    isEncrypted() {
      const active = this.getDialog().querySelector(".sieve-settings-encryption .active");

      if (active.classList.contains("sieve-settings-encryption-disabled"))
        return false;

      return true;
    }

    /**
     * Sets the encryption settings in the current dialog.
     *
     * @param {boolean} encrypted
     *   the encryption status to set. False in case encryption is disabled
     *   otherwise it will be enabled
     * @returns {SieveServerSettingsUI}
     *   a self reference
     */
    setEncrypted(encrypted) {
      const parent = this.getDialog();

      // reset the toggle button status...
      parent
        .querySelectorAll(".sieve-settings-encryption .active")
        .forEach((item) => { item.classList.remove("active"); });

      if (encrypted === false)
        $(parent.querySelector(".sieve-settings-encryption-disabled")).button('toggle');
      else
        $(parent.querySelector(".sieve-settings-encryption-enabled")).button('toggle');

      return this;
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

    /**
     * Shows the settings dialog
     *
     * @returns {boolean}
     *   true in case new settings where applied.
     *   false in case the dialog was canceled.
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
            $(this.getDialog()).modal("hide");
          });
      });
    }

    /**
     * Validates and saves the setting before closing the dialog.
     * In case the settings are invalid an error message is displayed.
     */
    async save() {

      const settings = {
        general: {
          secure: this.isEncrypted(),
          sasl: this.getSaslMechanism()
        },
        authentication: {
          username: this.getAuthentication(),
          mechanism: 0
        },
        authorization: {
          username: this.getAuthorization(),
          mechanism: this.getAuthorizationType()
        }
      };

      await this.account.send("account-settings-set-credentials", settings);
    }

    /**
     * Returns the currents dialogs UI Element.
     *
     * @returns {object}
     *   the dialogs UI elements.
     */
    getDialog() {
      return document.querySelector("#sieve-dialog-settings");
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
        await new SieveTemplate().load("./settings/ui/settings.credentials.tpl"));

      const credentials = await this.account.send("account-setting-get-credentials");

      // Authentication settings
      this.setEncrypted(credentials.general.secure);
      this.setSaslMechanism(credentials.general.sasl);

      this.setAuthentication(credentials.authentication.username);

      parent
        .querySelectorAll(".sieve-settings-authentication .dropdown-item")
        .forEach((item) => {
          item.addEventListener("click", (event) => {
            this.setSaslMechanism(event.target.dataset.sieveAuthentication);
          });
        });

      // Show the forget password button only when a password is stored.
      if (credentials.authentication.stored)
        parent.querySelector(".sieve-settings-forget-password").style.display = "";
      else
        parent.querySelector(".sieve-settings-forget-password").style.display = "none";

      parent
        .querySelector(".sieve-settings-forget-password button")
        .addEventListener("click", async () => {
          await this.account.send("account-settings-forget-credentials");

          this.getDialog()
            .querySelector(".sieve-settings-forget-password").style.display = "none";
        });

      // Authorization settings....
      this.setAuthorizationType(credentials.authorization.type);
      this.setAuthorization(credentials.authorization.username);

      parent
        .querySelectorAll(".sieve-settings-authorization .dropdown-item")
        .forEach((item) => {
          item.addEventListener("click", (event) => {
            this.setAuthorizationType(event.target.dataset.sieveAuthorization);
          });
        });

      parent
        .querySelector(".siv-settings-show-advanced")
        .addEventListener("click", () => { this.showAdvanced(); });

      parent
        .querySelector(".siv-settings-hide-advanced")
        .addEventListener("click", () => { this.hideAdvanced(); });

      this.hideAdvanced();
    }
  }
  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveCredentialsSettingsUI;
  else
    exports.SieveCredentialsSettingsUI = SieveCredentialsSettingsUI;

})(this);
