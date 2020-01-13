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

  /* global SieveAccountsUI */
  /* global SieveIpcClient */
  /* global SieveRenameScriptDialog */
  /* global SieveCreateScriptDialog */
  /* global SieveDeleteScriptDialog */
  /* global SieveScriptBusyDialog */

  async function onCreateScript() {
    return await (new SieveCreateScriptDialog()).show();
  }

  async function onDeleteScript(name) {
    return await (new SieveDeleteScriptDialog(name)).show();
  }

  async function onRenameScript(name) {
    return await (new SieveRenameScriptDialog(name)).show();
  }

  async function onBusy(name) {
    return await (new SieveScriptBusyDialog(name)).show();
  }

  /**
   * The main entry point for the account view
   */
  async function main() {
    const accounts = new SieveAccountsUI();
    accounts.render();

    //await SieveIpcClient.sendMessage("editor", "editor-save", null, this.getContent());
    SieveIpcClient.setRequestHandler("accounts", "script-show-create", async () => { return await onCreateScript(); });
    SieveIpcClient.setRequestHandler("accounts", "script-show-delete", async (msg) => { return await onDeleteScript(msg.payload); });
    SieveIpcClient.setRequestHandler("accounts", "script-show-rename", async (msg) => { return await onRenameScript(msg.payload); });
    SieveIpcClient.setRequestHandler("accounts", "script-show-busy", async (msg) => { return await onBusy(msg.payload); });
  }

  if (document.readyState !== 'loading')
    main();
  else
    document.addEventListener('DOMContentLoaded', () => { main(); }, {once: true});

})();
