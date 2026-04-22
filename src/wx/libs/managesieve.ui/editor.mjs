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

import { SieveIpcClient } from "./utils/SieveIpcClient.mjs";
import { SieveLogger } from "./utils/SieveLogger.mjs";
import { SieveI18n } from "./utils/SieveI18n.mjs";

import { SieveEditorUI } from "./editor/SieveEditor.mjs";
import { SieveScriptSaveDialog } from "./dialogs/SieveDialogUI.mjs";

// eslint-disable-next-line no-magic-numbers
const KEEP_ALIVE_DELAY = 1 * 1000;

let editor = null;

/**
 * Called when the editor is about to be closed.
 * Asks if the script should be saved or closing the window should be aborted.
 *
 * @param {string} name
 *   the script name
 * @returns {boolean}
 *   true in case the editor can be close, otherwise false.
 */
async function onClose(name) {

  const result = await (new SieveScriptSaveDialog(name).show());

  if (SieveScriptSaveDialog.isCanceled(result))
    return false;

  if (SieveScriptSaveDialog.isAccepted(result))
    return await editor.save();

  return true;
}

/**
 * WebExtensionV3 are a strangely odd design, or better to say colossal design
 * flaw. After a short period of inactivity an extension get unloaded automatically.
 *
 * Which ends up in works case in having a webextension which flip flops between
 * loaded and unloaded and thus wastes or better to say burns resources instead
 * of saving them.
 *
 * To avoid this we constantly run a ping between the frontend and the backend,
 * this should prevent the automatic unloading as long as we have a window open.
 */
async function onKeepAlive() {
  await SieveIpcClient.sendMessage("core", "ping");
  setTimeout(() => { onKeepAlive(); }, KEEP_ALIVE_DELAY);
}


/**
 * The main entry point.
 * Called as soon as the DOM is ready.
 */
async function main() {

  onKeepAlive();

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
    document.title = SieveI18n.getInstance().getString("title.editor");
  } catch {
    // In case it fails we stick with the default.
  }

  const url = new URL(window.location);
  const script = url.searchParams.get("script");
  const account = url.searchParams.get("account");

  // initialize the editor
  editor = new SieveEditorUI(script, account, "code");

  await editor.render();
  await editor.load();

  SieveIpcClient.setRequestHandler("editor", "editor-close",
    async (msg) => { return await onClose(msg.payload); });
  SieveIpcClient.setRequestHandler("editor", "editor-shown", () => { window.focus(); editor.focus(); });
  SieveIpcClient.setRequestHandler("editor", "editor-hasChanged", async () => { return await editor.hasChanged(); });

  // TODO Send a ready signal...
}

if (document.readyState !== 'loading')
  main();
else
  document.addEventListener('DOMContentLoaded', () => { main(); }, { once: true });


