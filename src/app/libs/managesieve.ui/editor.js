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

  /* global $ */
  /* global SieveEditorUI */
  /* global SieveIpcClient */

  /**
   * The main entry point...
   */
  $(document).ready(async () => {
    const url = new URL(window.location);

    console.log(url);

    // initialize the editor
    const editor = new SieveEditorUI(url.searchParams.get("script"), url.searchParams.get("account"), "code");

    await editor.render();
    await editor.load();

    SieveIpcClient.setRequestHandler("editor-shown", () => { window.focus(); editor.focus(); });
    SieveIpcClient.setRequestHandler("editor-save", async () => { return await editor.save(); });
    SieveIpcClient.setRequestHandler("editor-hasChanged", async () => { return await editor.hasChanged(); });

    // TODO Send a ready signal...

  });

  /*
  CodeMirror.on(window, "resize", function() {
    document.body.getElementsByClassName("CodeMirror-fullscreen")[0]
      .CodeMirror.getWrapperElement().style.height = winHeight() + "px";
  });
  */

  // hlLine = editor.addLineClass(0, "background", "activeline");

  // editor.on("change", function() { onChange(); });
})();
