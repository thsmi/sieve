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

  const KEY_RETURN = 13;

  const DIALOG_CANCELED = 0;
  const DIALOG_ACCEPTED = 1;
  const DIALOG_DISCARDED = 2;

  /* global bootstrap */
  const { SieveTemplate } = require("./../utils/SieveTemplate.js");
  const { SieveUniqueId } = require("./../utils/SieveUniqueId.js");

  /**
   * Displays a simple dialog with an action button.
   */
  class SieveDialog {

    /**
     * The path to the html template which should be used for this dialog
     * @abstract
     *
     * @returns {string}
     *   the path to the html template.
     */
    getTemplate() {
      throw new Error("Implement getTemplate");
    }

    /**
     * Get the current dialogs root element
     *
     * @returns {HTMLElement}
     *   the dialogs root element.
     */
    getDialog() {
      return document.querySelector(`#${this.id}`);
    }

    /**
     * Called when the dialog is initialized.
     * It is used to populate it with html elements.
     *
     * You can use getDialog to retrieve the dialogs root element.
     * E.g. when adding new elements.
     *
     */
    onInit() {
      throw new Error("Implement on Init");
    }

    /**
     * Called when the user clicks the accept button.
     * Which is any button marked with the "sieve-dialog-resolve" class.
     *
     * The result should be typically true for simple dialogs or
     * with more complex dialogs just return the desired value.
     *
     * @returns {object}
     *   returns true or the accept value
     *
     */
    onAccept() {
      return true;
    }

    /**
     * Called when the user clicks the cancel button.
     * Which is any button marked with the "sieve-dialog-reject" class.
     *
     * The result should be false for simple dialogs or a default value for
     * more complex dialogs. In case there is no default value, the best strategy
     * is to throw an exception.
     *
     * @returns {object}
     *   returns false or the reject result.
     */
    onCancel() {
      return false;
    }

    /**
     * Called when the dialog is shown.
     * This can be used e.g. to move the focus to the desired text box.
     */
    onShown() {
    }

    /**
     * Generates an if made of alphanumerical characters and dashes.
     * @returns {string}
     *   a string with an html compatible unique id
     */
    generateId() {
      return (new SieveUniqueId()).generate();
    }

    /**
     * Removes the dialog window from the UI.
     */
    destroy() {
      const elm = this.getDialog();
      elm.parentNode.removeChild(elm);
    }

    /**
     * Shows the dialog.
     *
     * @returns {object}
     *   the value returned from the dialog.
     */
    async show() {

      this.id = this.generateId();

      const dialog = await (new SieveTemplate()).load(this.getTemplate());
      dialog.id = this.id;
      document.querySelector("#ctx").appendChild(dialog);

      this.onInit();

      return await new Promise((resolve, reject) => {

        const modal = new bootstrap.Modal(this.getDialog());

        const buttons = this.getDialog()
          .querySelectorAll(".sieve-dialog-resolve");

        for (const button of buttons) {
          button.addEventListener("click", async () => {
            try {
              resolve(await this.onAccept(event.target));
            } catch (ex) {
              reject(ex);
            }

            modal.hide();
          });
        }


        modal.show();

        this.getDialog().addEventListener('hidden.bs.modal', async () => {

          this.destroy();

          try {
            resolve(await this.onCancel());
          } catch (ex) {
            reject(ex);
          }
        });

        this.getDialog().addEventListener('shown.bs.modal', () => {
          this.onShown();
        });
      });
    }
  }

  /**
   * Prompts if the given account shall be deleted.
   */
  class SieveDeleteAccountDialog extends SieveDialog {

    /**
     * Creates a new dialog instance
     *
     * @param {string} displayName
     *   the accounts display name
     */
    constructor(displayName) {
      super();
      this.displayName = displayName;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./dialogs/dialog.account.delete.tpl";
    }

    /**
     * @inheritdoc
     */
    onInit() {
      this.getDialog()
        .querySelector("#sieve-dialog-account-remove-name")
        .textContent = this.displayName;
    }
  }

  /**
   * Shows the dialog asking for the server's fingerprint.
   */
  class SieveFingerprintDialog extends SieveDialog {

    /**
     * Creates a new instance
     *
     * @param {object} secInfo
     *   the security info object with details about the validation error.
     */
    constructor(secInfo) {
      super();
      this.fingerprint = secInfo.fingerprint;
      this.error = secInfo.message;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./dialogs/dialog.account.cert.tpl";
    }

    /**
     * @inheritdoc
     */
    onInit() {
      this.getDialog()
        .querySelector(".sieve-dialog-fingerprint")
        .textContent = this.fingerprint;

      this.getDialog()
        .querySelector(".sieve-dialog-certerror")
        .textContent = this.error;
    }
  }

  /**
   * Aks if the given script should be deleted or not.
   */
  class SieveDeleteScriptDialog extends SieveDialog {

    /**
     * Create a new delete script dialog instance.
     *
     * @param {string} name
     *   the script name as string
     */
    constructor(name) {
      super();
      this.name = name;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./dialogs/dialog.script.delete.tpl";
    }

    /**
     * @inheritdoc
     */
    onInit() {
      this.getDialog()
        .querySelector('.sieve-delete-dialog-name')
        .textContent = this.name;
    }
  }

  /**
   * Asks for a name, which should be used to create the new script.
   */
  class SieveCreateScriptDialog extends SieveDialog {

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./dialogs/dialog.script.create.tpl";
    }

    /**
     * @inheritdoc
     */
    onInit() {
      this.getDialog().querySelector('.sieve-create-dialog-name').addEventListener("keypress", (e) => {
        if (e.which === KEY_RETURN) {
          const event = document.createEvent('HTMLEvents');
          event.initEvent('click', true, false);
          this.getDialog().querySelector(".sieve-dialog-resolve").dispatchEvent(event);
        }
      });
    }

    /**
     * @inheritdoc
     */
    onShown() {
      this.getDialog().querySelector('.sieve-create-dialog-name').focus();
    }

    /**
     * @inheritdoc
     */
    onAccept() {
      return this.getDialog().querySelector('.sieve-create-dialog-name').value;
    }

    /**
     * @inheritdoc
     */
    onCancel() {
      return "";
    }
  }

  /**
   * Asks for a scripts new name
   */
  class SieveRenameScriptDialog extends SieveDialog {

    /**
     * Create a rename script dialog instance.
     * @param {string} name
     *   the scripts old name
     */
    constructor(name) {
      super();
      this.name = name;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./dialogs/dialog.script.rename.tpl";
    }

    /**
     * @inheritdoc
     */
    onInit() {
      this.getDialog().querySelector('.sieve-rename-dialog-newname').addEventListener("keypress", (e) => {
        if (e.which === KEY_RETURN) {
          const event = document.createEvent('HTMLEvents');
          event.initEvent('click', true, false);
          this.getDialog().querySelector(".sieve-dialog-resolve").dispatchEvent(event);
        }
      });

      this.getDialog()
        .querySelector(".sieve-rename-dialog-newname").value = this.name;
    }

    /**
     * @inheritdoc
     */
    onShown() {
      this.getDialog().querySelector('.sieve-rename-dialog-newname').focus();
    }

    /**
     * @inheritdoc
     */
    onAccept() {
      return this.getDialog()
        .querySelector(".sieve-rename-dialog-newname").value;
    }

    /**
     * @inheritdoc
     */
    onCancel() {
      return this.name;
    }
  }

  /**
   * Asks for a password.
   * The show method returns null or the authorization.
   */
  class SievePasswordDialog extends SieveDialog {

    /**
     * Creates a password dialog.
     *
     * @param {string} username
     *   the username for which the password is requested
     * @param {string} displayName
     *   the accounts display name.
     * @param {{ remember : boolean }} [options]
     *   extended additional options.
     *   In case "remember" is set to true a switch will be rendered which allows
     *   the user to select if the password should be stored.
     */
    constructor(username, displayName, options) {
      super();
      this.username = username;
      this.displayName = displayName;

      if (typeof(options) === "undefined" || options === null)
        options = {};

      this.options = options;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./dialogs/dialog.account.password.tpl";
    }

    /**
     * @inheritdoc
     */
    onInit() {
      const dialog = this.getDialog();

      if (!this.options.remember)
        dialog.querySelector(".sieve-password-remember").style.display = "none";

      dialog.querySelector(".sieve-username").textContent = this.username;
      dialog.querySelector(".sieve-displayname").textContent = this.displayName;

      this.getDialog().querySelector('.sieve-password').addEventListener("keypress", (e) => {
        if (e.which === KEY_RETURN) {
          const event = document.createEvent('HTMLEvents');
          event.initEvent('click', true, false);
          this.getDialog().querySelector(".sieve-dialog-resolve").dispatchEvent(event);
        }
      });
    }

    /**
     * @inheritdoc
     */
    onShown() {
      this.getDialog().querySelector('.sieve-password').focus();
    }

    /**
     * @inheritdoc
     */
    onAccept() {
      return {
        "username" : this.username,
        "password" : this.getDialog().querySelector(".sieve-password").value,
        "remember" : document.querySelector("#sieve-password-remember").checked
      };
    }

    /**
     * @inheritdoc
     */
    onCancel() {
      return {};
    }
  }

  /**
   * Asks for a authorization.
   * The show method returns null or the authorization.
   */
  class SieveAuthorizationDialog extends SieveDialog {

    /**
     * Creates a authorization request dialog.
     *
     * @param {string} displayName
     *   the account's display name.
     */
    constructor(displayName) {
      super();
      this.displayName = displayName;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./dialogs/dialog.account.authorization.tpl";
    }

    /**
     * @inheritdoc
     */
    onInit() {
      const dialog = this.getDialog();

      dialog.querySelector(".sieve-displayname").textContent = this.displayName;

      dialog.querySelector('.sieve-authorization').addEventListener("keypress", (e) => {
        if (e.which === KEY_RETURN) {
          const event = document.createEvent('HTMLEvents');
          event.initEvent('click', true, false);
          this.getDialog().querySelector(".sieve-dialog-resolve").dispatchEvent(event);
        }
      });
    }

    /**
     * @inheritdoc
     */
    onShown() {
      this.getDialog().querySelector('.sieve-authorization').focus();
    }

    /**
     * @inheritdoc
     */
    onAccept() {
      return this.getDialog().querySelector(".sieve-authorization").value;
    }

    /**
     * @inheritdoc
     */
    onCancel() {
      return null;
    }
  }

  /**
   * An info dialog indicating the current script is busy.
   */
  class SieveScriptBusyDialog extends SieveDialog {

    /**
     * Create a new script busy dialog.
     * @param {string} name
     *   the scripts name.
     */
    constructor(name) {
      super();
      this.name = name;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./dialogs/dialog.script.busy.tpl";
    }

    /**
     * @inheritdoc
     */
    onInit() {
      this.getDialog()
        .querySelector(".sieve-busy-dialog-scriptname").textContent = this.name;
    }
  }

  // TODO should be extracted an stored next to the editor
  /**
   * Asks is a changed script should be saved
   */
  class SieveScriptSaveDialog extends SieveDialog {

    /**
     * Create a rename script dialog instance.
     * @param {string} name
     *   the scripts old name
     */
    constructor(name) {
      super();
      this.name = name;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./dialogs/dialog.script.save.tpl";
    }

    /**
     * @inheritdoc
     */
    onInit() {
      this.getDialog()
        .querySelector(".sieve-save-dialog-scriptname").textContent = this.name;
    }

    /**
     * @inheritdoc
     */
    onAccept(element) {
      if (element.classList.contains("sieve-save-dialog-discard"))
        return DIALOG_DISCARDED;

      if (element.classList.contains("sieve-save-dialog-save"))
        return DIALOG_ACCEPTED;

      throw new Error("Unknown button pressed");
    }

    /**
     * Checks if the dialogs return value was a discard
     * @param {int} value
     *  the value to be checked.
     * @returns {boolean}
     *   true in case the dialog was discarded.
     */
    static isDiscarded(value) {
      return value === DIALOG_DISCARDED;
    }

    /**
     * Checks if the dialogs return value was a cancel
     * @param {int} value
     *   the value to be checked.
     * @returns {boolean}
     *   true in case the dialog was canceled
     */
    static isCanceled(value) {
      return value === DIALOG_CANCELED;
    }

    /**
     * Checks if the dialogs return value was an accept
     * @param {int} value
     *   the value to be checked.
     * @returns {boolean}
     *   true in case the dialog was accepted.
     */
    static isAccepted(value) {
      return value === DIALOG_ACCEPTED;
    }

    /**
     * @inheritdoc
     */
    onCancel() {
      return DIALOG_CANCELED;
    }
  }

  /**
   * An info dialog indicating the current script is busy.
   */
  class SieveErrorDialog extends SieveDialog {

    /**
     * Create a new script busy dialog.
     * @param {string} description
     *   the scripts name.
     */
    constructor(description) {
      super();
      this.description = description;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./dialogs/dialog.error.tpl";
    }

    /**
     * @inheritdoc
     */
    onInit() {
      this.getDialog()
        .querySelector(".sieve-error-dialog-description")
        .textContent = this.description;
    }
  }


  if (typeof (module) !== "undefined" && module && module.exports) {
    module.exports.SievePasswordDialog = SievePasswordDialog;
    module.exports.SieveRenameScriptDialog = SieveRenameScriptDialog;
    module.exports.SieveCreateScriptDialog = SieveCreateScriptDialog;
    module.exports.SieveDeleteScriptDialog = SieveDeleteScriptDialog;
    module.exports.SieveFingerprintDialog = SieveFingerprintDialog;
    module.exports.SieveDeleteAccountDialog = SieveDeleteAccountDialog;
    module.exports.SieveAuthorizationDialog = SieveAuthorizationDialog;
    module.exports.SieveScriptBusyDialog = SieveScriptBusyDialog;
    module.exports.SieveScriptSaveDialog = SieveScriptSaveDialog;
    module.exports.SieveErrorDialog = SieveErrorDialog;
  }
  else {
    exports.SievePasswordDialog = SievePasswordDialog;
    exports.SieveRenameScriptDialog = SieveRenameScriptDialog;
    exports.SieveCreateScriptDialog = SieveCreateScriptDialog;
    exports.SieveDeleteScriptDialog = SieveDeleteScriptDialog;
    exports.SieveFingerprintDialog = SieveFingerprintDialog;
    exports.SieveDeleteAccountDialog = SieveDeleteAccountDialog;
    exports.SieveAuthorizationDialog = SieveAuthorizationDialog;
    exports.SieveScriptBusyDialog = SieveScriptBusyDialog;
    exports.SieveScriptSaveDialog = SieveScriptSaveDialog;
    exports.SieveErrorDialog = SieveErrorDialog;
  }

})(this);
