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

(() => {

  "use strict";

  /* global SieveEditorUI */
  /* global SieveIpcClient */
  /* global SieveLogger */

  /**
   * The main entry point.
   * Called as soon as the DOM is ready.
   */
  async function main() {

    SieveLogger.getInstance().level(
      await SieveIpcClient.sendMessage("core", "settings-get-loglevel"));

    const url = new URL(window.location);
    const script = url.searchParams.get("script");
    const account = url.searchParams.get("account");

    // initialize the editor
    const editor = new SieveEditorUI(script, account, "code");

    await editor.render();
    await editor.load();

    SieveIpcClient.setRequestHandler("editor", "editor-shown", () => { window.focus(); editor.focus(); });
    SieveIpcClient.setRequestHandler("editor", "editor-save", async () => { return await editor.save(); });
    SieveIpcClient.setRequestHandler("editor", "editor-hasChanged", async () => { return await editor.hasChanged(); });

    // TODO Send a ready signal...
  }

  if (document.readyState !== 'loading')
    main();
  else
    document.addEventListener('DOMContentLoaded', () => { main(); }, {once: true});

  /*
  CodeMirror.on(window, "resize", function() {
    document.body.getElementsByClassName("CodeMirror-fullscreen")[0]
      .CodeMirror.getWrapperElement().style.height = winHeight() + "px";
  });
  */

  // hlLine = editor.addLineClass(0, "background", "activeline");

  // editor.on("change", function() { onChange(); });
})();
