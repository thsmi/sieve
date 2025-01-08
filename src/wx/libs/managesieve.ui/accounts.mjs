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
 * The delay between subsequent keep alive messages.
 */
// eslint-disable-next-line no-magic-numbers
const KEEP_ALIVE_DELAY = 15 * 1000;

/**
 * The timeout after which the keep alive message is considered lost.
 */
// eslint-disable-next-line no-magic-numbers
const KEEP_ALIVE_TIMEOUT = 5 * 1000;

/**
 * The timeout of the ready message. We use here a more aggressive polling
 * to be more responsive.
 */
const READY_TIMEOUT = 500;

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
 * WebExtensionV3 are a strangely odd design, or better to say colossal design
 * flaw. After a short period of inactivity an extension get unloaded automatically.
 *
 * Which ends up in worst case in a webextension which flip and flops between
 * loaded and unloaded and thus wastes or better to say burns resources instead
 * of saving them.
 *
 * To avoid this we constantly run a ping between the frontend and the backend,
 * this should prevent the automatic unloading as long as we have a window open.
 */
async function onKeepAlive() {

  try {
    await SieveIpcClient.sendMessage("core", "ping", null, null, KEEP_ALIVE_TIMEOUT);
  // eslint-disable-next-line no-unused-vars
  } catch (ex) {
    // Do nothing we'll retry later.
  }

  setTimeout(() => { onKeepAlive(); }, KEEP_ALIVE_DELAY);
}

/**
 * Checks if the background page is ready for messages.
 * It simply sends a ping message and expects a response within a reasonable time.
 *
 * The background page will be unloaded after 30 seconds of inactivity and reloading
 * it into memory is awful slow.
 *
 * @returns {boolean}
 *   true in case the the background page is ready otherwise false.
 */
async function isReady() {

  try {
    await SieveIpcClient.sendMessage("core", "ping", null, null, READY_TIMEOUT);
  // eslint-disable-next-line no-unused-vars
  } catch (ex) {
    return false;
  }

  return true;
}

/**
 * Waits for the background page to become ready.
 * It polls is ready and returns as soon as the background page responds to a ping.
 *
 * The background page will be unloaded after 30 seconds of inactivity and reloading
 * it into memory is awful slow.
 */
async function waitForReady() {

  let ready = false;

  do {
    ready = await isReady();

  } while (!ready);
}

/**
 * The main entry point for the account view
 */
async function main() {

  await waitForReady();


  // TODO move to editor
  /*    window.onbeforeunload = (e) => {
    // if changed...
    e.preventDefault();
  };*/
  try {
    // Start the keep alive ping
    await onKeepAlive();

    SieveLogger.getInstance().level(
      await SieveIpcClient.sendMessage("core", "settings-get-loglevel"));

    // Enable dark mode if the system's color-scheme is dark
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      window.document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      window.document.documentElement.setAttribute('data-bs-theme', 'light');
    }

    await (SieveI18n.getInstance()).load();

    try {
      document.title = SieveI18n.getInstance().getString("title.accounts");
    } catch {
      // In case it fails we stick with the default.
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
