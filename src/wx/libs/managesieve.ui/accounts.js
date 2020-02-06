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

  /**
   * Shows a prompt which asks the user if the script should be deleted.
   *
   * @returns
   */
  async function onCreateScript() {
    return await (new SieveCreateScriptDialog()).show();
  }

  /**
   * Shows a prompt which asks the user if the script should be deleted.
   *
   * @param {string} name
   *   the scriptname which should be deleted
   *
   * @returns
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
    return await (new SieveScriptBusyDialog(name)).show();
  }

  /**
   * The main entry point for the account view
   */
  function main() {

    // TODO move to editor
    window.onbeforeunload = (e) => {
      // if changed...
      e.preventDefault();
    };

    const accounts = new SieveAccountsUI();
    accounts.render();

    // await SieveIpcClient.sendMessage("editor", "editor-save", null, this.getContent());
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
