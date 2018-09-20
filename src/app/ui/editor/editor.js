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

"use strict";

/* global $ */
/* global SieveEditorUI */
/* global SieveTemplateLoader */

/**
 *
 * @returns {void}
 */
function updateSyntaxCheckUI(editor) {

  if (editor.isSyntaxCheckEnabled()) {
    $("#sieve-editor-settings .sieve-editor-disable-syntaxcheck").show();
    $("#sieve-editor-settings .sieve-editor-enable-syntaxcheck").hide();
    $("#sieve-editor-settings-synatxcheck-on").button("toggle");
    return;
  }

  $("#sieve-editor-settings .sieve-editor-disable-syntaxcheck").hide();
  $("#sieve-editor-settings .sieve-editor-enable-syntaxcheck").show();
  $("#sieve-editor-settings-synatxcheck-off").button("toggle");
  return;
}


/**
 *
 * @param {SieveEditorUI} editor
 */
function populateEditorSettings(editor) {

  $("#editor-settings-indentation-width").val(editor.getIndentWidth());

  if (editor.getIndentWithTabs())
    $("#editor-settings-indentation-policy-tabs").button('toggle');
  else
    $("#editor-settings-indentation-policy-spaces").button('toggle');


  $("#editor-settings-tabulator-width").val(editor.getTabWidth());

  if (editor.isSyntaxCheckEnabled())
    updateSyntaxCheckUI(editor);
  else
    updateSyntaxCheckUI(editor);

}

/**
 *
 * @param {SieveEditorUI} editor
 */
async function initEditorSettings(editor) {

  let settings = await (new SieveTemplateLoader()).load("./editor.settings.tpl");
  $("#sieve-content-settings").append(settings);

  $("#editor-settings-indentation-width").change(() => {
    editor.setIndentWidth($("#editor-settings-indentation-width").val());
  });

  $("#editor-settings-indentation-policy-spaces").on('click', () => {
    editor.setIndentWithTabs(false);
  });

  $("#editor-settings-indentation-policy-tabs").on('click', () => {
    editor.setIndentWithTabs(true);
  });

  $("#editor-settings-tabulator-width").change(() => {
    editor.setTabWidth($("#editor-settings-tabulator-width").val());
  });

  $("#sieve-editor-settings .sieve-editor-enable-syntaxcheck").click(() => {
    editor.enableSyntaxCheck();
    updateSyntaxCheckUI(editor);
  });

  $("#sieve-editor-settings .sieve-editor-disable-syntaxcheck").click(() => {
    editor.disableSyntaxCheck();
    updateSyntaxCheckUI(editor);
  });

  $("#sieve-editor-settings-synatxcheck-on").click(() => {
    editor.enableSyntaxCheck();
    updateSyntaxCheckUI(editor);
  });

  $("#sieve-editor-settings-synatxcheck-off").click(() => {
    editor.disableSyntaxCheck();
    updateSyntaxCheckUI(editor);
  });

  $("#editor-settings-save-defaults").click(() => {
    editor.saveDefaultSettings();
  });

  $("#editor-settings-load-defaults").click(async () => {
    await editor.loadDefaultSettings();
    populateEditorSettings(editor);
  });

  populateEditorSettings(editor);
}


/**
 * The main entry point...
 * @returns {void}
 */
async function main() {

  let url = new URL(window.location);

  // initialize the editor
  let editor = new SieveEditorUI(url.searchParams.get("account"), "code");
  await editor.loadDefaultSettings();

  $("#sieve-editor-quickreference").click(() => {
    editor.openReference();
  });

  $("#sieve-editor-save").click(() => {
    editor.saveScript();
  });

  $("#sieve-editor-undo").click(() => {
    editor.undo();
  });

  $("#sieve-editor-redo").click(() => {
    editor.redo();
  });

  $("#sieve-editor-cut").click(() => {
    editor.cut();
  });

  $("#sieve-editor-copy").click(() => {
    editor.copy();
  });

  $("#sieve-editor-paste").click(() => {
    editor.paste();
  });

  $("#sieve-editor-find").click(() => {
    let token = $("#sieve-editor-txt-find").val();

    let isReverse = $("#sieve-editor-backward").prop("checked");
    let isCaseSensitive = $("#sieve-editor-casesensitive").prop("checked");

    editor.find(token, isCaseSensitive, isReverse);
  });

  $("#sieve-editor-replace").click(() => {
    let oldToken = $("#sieve-editor-txt-find").val();
    let newToken = $("#sieve-editor-txt-replace").val();

    let isReverse = $("#sieve-editor-backward").prop("checked");
    let isCaseSensitive = $("#sieve-editor-casesensitive").prop("checked");

    if (oldToken === "")
      return;

    editor.replace(oldToken, newToken, isCaseSensitive, isReverse);
  });


  $("#sieve-editor-replace-replace").click(() => {
    $("#sieve-editor-find-toolbar").toggle();
  });

  $("#sieve-editor-settings .sieve-editor-settings-show").click(() => {
    $("#sieve-tab-settings").tab('show');
  });


  $("#sieve-editor-settings .sieve-editor-import").click(() => {
    editor.importScript();
  });

  $("#sieve-editor-settings .sieve-editor-export").click(() => {
    editor.exportScript();
  });


  // then load the script.
  // The account and the script name is embedded into the url.

  editor.loadScript(url.searchParams.get("script"));

  /**
   * The on message handler which receives the parent IPC messages.
   * @param {Event} e
   *   the event
   * @returns {void}
   */
  function onMessage(e) {

    if (e.source === window)
      return;

    let m = JSON.parse(e.data);

    if (m.action !== "editor-init")
      return;

    console.log("On Callback");
  }

  window.addEventListener("message", onMessage, false);

  // TODO add a show tab hook

  await initEditorSettings(editor);
}


$(document).ready(function () {
  (async () => { await main(); })();
});



/*
CodeMirror.on(window, "resize", function() {
  document.body.getElementsByClassName("CodeMirror-fullscreen")[0]
    .CodeMirror.getWrapperElement().style.height = winHeight() + "px";
});
*/



// hlLine = editor.addLineClass(0, "background", "activeline");

// editor.on("change", function() { onChange(); });
