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

import { SieveLogger } from "./utils/SieveLogger.mjs";
import { SieveIpcClient } from "./utils/SieveIpcClient.mjs";
import { SieveI18n } from "./utils/SieveI18n.mjs";

import { SieveAbstractAccounts as SieveAccounts } from "./accounts/SieveAbstractAccounts.mjs";
import {
  SieveCreateScriptDialog,
  SieveDeleteScriptDialog,
  SieveRenameScriptDialog,
  SieveFingerprintDialog,
  SieveScriptBusyDialog,
  SieveErrorDialog
} from "./dialogs/SieveDialogUI.mjs";

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
 * The main entry point for the account view
 */
async function main() {

  // TODO move to editor
  /*    window.onbeforeunload = (e) => {
    // if changed...
    e.preventDefault();
  };*/
  try {

    SieveLogger.getInstance().level(
      await SieveIpcClient.sendMessage("core", "settings-get-loglevel"));

    // Enable dark mode if the system's color-scheme is dark
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }

    await (SieveI18n.getInstance()).load();

    try {
      document.title = SieveI18n.getInstance().getString("title.accounts");
    } catch {
      document.title = "Sieve Message Filters";
    }

    const accounts = new SieveAccounts();
    accounts.render();

    SieveIpcClient.setRequestHandler("accounts", "script-show-create",
      async () => { return await onCreateScript(); });
    SieveIpcClient.setRequestHandler("accounts", "script-show-delete",
      async (msg) => { return await onDeleteScript(msg.payload); });
    SieveIpcClient.setRequestHandler("accounts", "script-show-rename",
      async (msg) => { return await onRenameScript(msg.payload); });
    SieveIpcClient.setRequestHandler("accounts", "script-show-busy",
      async (msg) => { await onBusy(msg.payload); });
    SieveIpcClient.setRequestHandler("accounts", "account-show-certerror",
      async (msg) => { return await onCertError(msg.payload); });
    SieveIpcClient.setRequestHandler("accounts", "account-show-error",
      async (msg) => { return await onError(msg.payload); });

    SieveIpcClient.setRequestHandler("accounts", "account-disconnected",
      async (msg) => { return await accounts.render(msg.payload); });

  } catch (ex) {
    console.error(ex);
  }
}

if (document.readyState !== 'loading')
  main();
else
  document.addEventListener('DOMContentLoaded', () => { main(); }, { once: true });
