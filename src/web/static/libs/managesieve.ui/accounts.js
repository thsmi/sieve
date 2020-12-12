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



import { SieveAccounts } from "./accounts/SieveAccounts.mjs";

import {
  SieveCreateScriptDialog,
  SieveDeleteScriptDialog,
  SieveRenameScriptDialog,
  SieveScriptBusyDialog,
  SievePasswordDialog
} from "./dialogs/SieveDialogUI.js";

import { SieveLogger } from "./utils/SieveLogger.js";
import { SieveI18n } from "./utils/SieveI18n.js";
import { SieveIpcClient } from "./utils/SieveIpcClient.js";

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
 * Requests the password from the user.
 *
 * @param {string} username
 *   the username for which the password is requested.
 * @param {string} account
 *   the account's display name.
 * @param {boolean} remember
 *   show the "remember password" field.
 * @returns {string}
 *   the password as string.
 */
async function onAuthenticate(username, account, remember) {
  return await (new SievePasswordDialog(username, account, { remember: remember })).show();
}


/**
 * The main entry point for the account view
 */
async function main() {

  SieveLogger.getInstance().level(
    await SieveIpcClient.sendMessage("core", "settings-get-loglevel"));

  await (SieveI18n.getInstance()).load();

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
  SieveIpcClient.setRequestHandler("accounts", "account-show-authentication",
    async (msg) => { return await onAuthenticate(msg.payload.username, msg.payload.displayname, msg.payload.remember); });

}

if (document.readyState !== 'loading')
  main();
else
  document.addEventListener('DOMContentLoaded', () => { main(); }, { once: true });
