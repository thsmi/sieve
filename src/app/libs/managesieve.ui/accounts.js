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

(function () {

  "use strict";

  /* global SieveAccounts */
  /* global SieveUpdaterUI */
  /* global SieveIpcClient */
  /* global SieveLogger */
  /* global SieveI18n */

  /* global SieveCreateScriptDialog */
  /* global SieveDeleteScriptDialog */
  /* global SieveRenameScriptDialog */
  /* global SieveFingerprintDialog */
  /* global SieveScriptBusyDialog */
  /* global SieveDeleteAccountDialog */
  /* global SieveErrorDialog */

  /* global SievePasswordDialog */
  /* global SieveAuthorizationDialog */

  /**
   * Shows a prompt which asks the user for the new script name.
   *
   * @returns {string}
   *   the script name or an empty string in case the dialog was canceled.
   */
  async function onCreateScript() {
    return await (new SieveCreateScriptDialog()).show();
  }

  /**
   * Shows a prompt which asks the user if the script should be deleted.
   *
   * @param {string} name
   *   the script name which should be deleted
   *
   * @returns {boolean}
   *   true in case the script shall be deleted otherwise false.
   */
  async function onDeleteScript(name) {
    return await (new SieveDeleteScriptDialog(name)).show();
  }

  /**
   * Shows a prompt which asks the user if the script should be renamed.
   *
   * @param {string} name
   *   the name which should be renamed
   *
   * @returns {string}
   *   the script name in case the dialog. In case the dialog was
   *   canceled the original name otherwise the new name.
   */
  async function onRenameScript(name) {
    return await (new SieveRenameScriptDialog(name)).show();
  }

  /**
   * Informs the user that the action can't be performed because
   * the script is currently in use.
   *
   * @param {string} name
   *   the name of the script which was busy
   */
  async function onBusy(name) {
    await (new SieveScriptBusyDialog(name)).show();
  }

  /**
   * Shows a prompt which asks the user if the given account
   * should be removed.
   *
   * @param {string} name
   *   the account name
   * @returns {boolean}
   *   true in case the account should be deleted otherwise false.
   */
  async function onDeleteAccount(name) {
    return await (new SieveDeleteAccountDialog(name)).show();
  }

  /**
   * Informs the user about a failed certificate validation.
   *
   * @param {object} secInfo
   *   the security information with more details about the validation error.
   *
   * @returns {boolean}
   *   true in case the certificate should be overwritten otherwise false.
   */
  async function onCertError(secInfo) {
    return await (new SieveFingerprintDialog(secInfo)).show();
  }

  /**
   * Informs the user about a connection error.
   *
   * @param {string} message
   *   the detailed connection error.
   */
  async function onError(message) {
    await (new SieveErrorDialog(message)).show();
  }

  /**
   * Requests the password from the user.
   *
   * @param {string} username
   *   the username for which the password is requested.
   * @param {string} displayname
   *   the account's display name.
   * @returns {string}
   *   the password as string.
   */
  async function onAuthenticate(username, displayname) {
    return await (new SievePasswordDialog(username, displayname)).show();
  }

  /**
   * Prompts for the username to be authorized.
   *
   * @param {string} displayname
   *   the accounts displayname.
   * @returns {string}
   *   the username to be authorized.
   */
  async function onAuthorize(displayname) {
    return await (new SieveAuthorizationDialog(displayname)).show();
  }

  /**
   * The main entry point for the account view
   * Called as soon as the DOM is ready.
   */
  async function main() {

    SieveLogger.getInstance().level(
      await SieveIpcClient.sendMessage("core", "settings-get-loglevel"));

    await (SieveI18n.getInstance()).load();

    const accounts = new SieveAccounts();

    SieveIpcClient.setRequestHandler("accounts", "script-show-create",
      async () => { return await onCreateScript(); });
    SieveIpcClient.setRequestHandler("accounts", "script-show-delete",
      async (msg) => { return await onDeleteScript(msg.payload); });
    SieveIpcClient.setRequestHandler("accounts", "script-show-rename",
      async (msg) => { return await onRenameScript(msg.payload); });
    SieveIpcClient.setRequestHandler("accounts", "script-show-busy",
      async (msg) => { await onBusy(msg.payload); });

    SieveIpcClient.setRequestHandler("accounts", "account-show-delete",
      async (msg) => { return await onDeleteAccount(msg.payload); });
    SieveIpcClient.setRequestHandler("accounts", "account-show-certerror",
      async (msg) => { return await onCertError(msg.payload); });
    SieveIpcClient.setRequestHandler("accounts", "account-show-error",
      async (msg) => { return await onError(msg.payload); });

    SieveIpcClient.setRequestHandler("accounts", "account-show-authentication",
      async (msg) => { return await onAuthenticate(msg.payload.username, msg.payload.displayname); });
    SieveIpcClient.setRequestHandler("accounts", "account-show-authorization",
      async (msg) => { return await onAuthorize(msg.payload.displayname); });

    accounts.render();
    (new SieveUpdaterUI()).check();
  }

  if (document.readyState !== 'loading')
    main();
  else
    document.addEventListener('DOMContentLoaded', () => { main(); }, { once: true });

})();
