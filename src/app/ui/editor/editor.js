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

/* global $ */
/* global CodeMirror */
/* global SieveIpcClient */
/* global SieveTemplateLoader */

const COMPILE_DELAY = 500;

/**
 * Implemets an abstract wrapper around code mirror.
 */
class SieveEditorUI {

  /**
   * Initializes the editor instance.
   * It requires a textbox which will be converted into a code mirror input.
   *
   * @param {String} account
   *   the unqiue sieve account id for this editor
   * @param {String} [id]
   *   An optional id, which points to a the textboxe, which will be converted
   *   into a code mirror input. In case it is ommited the id "code" will be used.
   */
  constructor(account, id) {

    if (typeof (id) === "undefined" || id === null)
      id = "code";

    this.cm = CodeMirror.fromTextArea(document.getElementById(id), {
      lineNumbers: true,
      lineWrapping: true,

      theme: "eclipse",
      matchBrackets: true,

      inputStyle: "contenteditable"

    });

    this.cm.on("renderLine", (cm, line, elt) => { this.onRenderLine(cm, line, elt); });
    this.cm.on("change", () => { this.onChange(); });
    this.cm.on("cursorActivity", () => { this.onActiveLineChange(); });

    this.cm.refresh();

    this.timeout = null;
    this.disableSyntaxCheck();

    this.account = account;

    this.activeLine = null;

    this.changed = false;
  }

  /**
   * Undos the last input
   * @returns {void}
   */
  undo() {
    this.cm.undo();
    this.cm.focus();
  }

  /**
   * Redos the last input
   * @returns {void}
   */
  redo() {
    this.cm.redo();
    this.cm.focus();
  }

  /**
   * Executes an action on the communication process.
   *
   * @param {String} action
   *   the aktions unique name
   * @param {Object} [payload]
   *   th payload which should be send
   * @returns {Promise<Object>}
   *   the result received for this action.
   */
  async send(action, payload) {

    if (typeof (payload) === "undefined" || payload === null)
      payload = {};

    if (typeof (payload) !== "object")
      payload = { "data": payload };

    payload["account"] = this.account;

    return await SieveIpcClient.sendMessage(action, payload);
  }

  /**
   * Opens the sieve reference in a browser window
   * @returns {void}
   */
  openReference() {
    this.send("reference-open");
    this.cm.focus();
  }


  /**
   * Callback handler for code mirror. Do not invoke unless you know what you are doing.
   *
   * @param {CodeMirror} cm
   *   a reference to the code mirror instance
   * @param {*} line
   *   the current line
   * @param {*} elt
   * @returns {void}
   */
  onRenderLine(cm, line, elt) {
    let charWidth = this.cm.defaultCharWidth();
    let basePadding = 4;

    let off = CodeMirror.countColumn(line.text, null, cm.getOption("tabSize")) * charWidth;
    elt.style.textIndent = "-" + off + "px";
    elt.style.paddingLeft = (basePadding + off) + "px";
  }

  /**
   * On Change callback handler for codemirror
   * Do not invoke unless you know what you are doing.
   *
   * @returns {void}
   */
  onChange() {

    this.setChanged(true);

    if (this.syntaxCheckEnabled === false)
      return;

    // reset the timer...
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    // TODO check if compile is deactivated...
    this.timeout = setTimeout(() => { this.checkScript(); }, COMPILE_DELAY);
  }

  /**
   * On Active Line Change callback handler for codemirror.
   * Do not invoke unless you know what you are doing.
   *
   * @returns {void}
   */
  onActiveLineChange() {
    let currentLine = this.cm.getLineHandle(this.cm.getCursor().line);

    if (currentLine === this.activeLine)
      return;

    if (this.activeLine)
      this.cm.removeLineClass(this.activeLine, "background", "activeline");

    this.activeLine = this.cm.addLineClass(currentLine, "background", "activeline");
  }

  /**
   * Enables checking for syntax errors
   * @returns {void}
   */
  enableSyntaxCheck() {
    this.syntaxCheckEnabled = true;
    this.checkScript();

    $("#sieve-editor-settings .sieve-editor-disable-syntaxcheck").hide();
    $("#sieve-editor-settings .sieve-editor-enable-syntaxcheck").show();

    this.cm.focus();
  }

  /**
   * Disables checking for syntax errors
   * @returns {void}
   */
  disableSyntaxCheck() {
    this.syntaxCheckEnabled = false;
    this.hideSyntaxErrors();

    $("#sieve-editor-settings .sieve-editor-disable-syntaxcheck").show();
    $("#sieve-editor-settings .sieve-editor-enable-syntaxcheck").hide();

    this.cm.focus();

    // reset the timer...
    if (this.timeout === null)
      return;

    clearTimeout(this.timeout);
    this.timeout = null;
  }

  /**
   * Shows a message box with the given syntax errors
   * @param {String} errors
   *   the errors which should be displayed
   * @returns {void}
   */
  showSyntaxErrors(errors) {
    $("#sieve-editor-msg")
      .show();
    $("#sieve-editor-msg .sieve-editor-msg-details")
      .empty().text(errors);
  }

  /**
   * Hides the syntax errors.
   * @returns {void}
   */
  hideSyntaxErrors() {
    $("#sieve-editor-msg").hide();
  }

  /**
   * Checks the current script for syntax errors
   * @returns {void}
   */
  async checkScript() {

    // In case the name is not set, no script is loaded.
    if (this.name === undefined)
      return;

    // Get the current script...
    let script = this.cm.getValue();

    // ... and ensure the line endings are sanatized
    script = script.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");

    let errors = await this.send("script-check", script);


    // TODO show and errors in UI
    if (!errors)
      this.hideSyntaxErrors();
    else
      this.showSyntaxErrors(errors);
  }

  /**
   * Loads a new script into the editor.
   *
   * It will discard the current script including
   * the history and the cursor position.
   *
   * @param {String} name
   *   the script which should be loaded
   * @returns {void}
   */
  async loadScript(name) {
    // Load a new script. It will discard the current script
    // the history and the cursorposition are reset to defaults.

    let script = await this.send("script-get", name);
    this.name = name;

    this.cm.setValue(script);
    this.cm.setCursor({ line: 0, ch: 0 });
    this.cm.clearHistory();
    this.cm.refresh();

    this.setChanged(false);

    // ensure the active line cursor changed...
    //    onActiveLineChange();
  }

  /**
   * Imports a sieve script from a file
   * @returns {void}
   */
  async importScript() {
    let script = await this.send("script-import");

    if (typeof(script) === "undefined")
      return;

    this.cm.setValue(script);
    this.cm.setCursor({ line: 0, ch: 0 });
    this.cm.refresh();
    this.setChanged(true);

    this.cm.focus();
  }

  /**
   * Exports the script to a file
   * @returns {void}
   */
  async exportScript() {

    // Get the current script...
    let script = this.cm.getValue();
    // ... and ensure the line endings are sanatized
    script = script.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");

    await this.send("script-export", { "name": this.name, "script": script });

    this.cm.focus();
  }


  /**
   * Returns the editor change status.
   *
   * @returns {boolean}
   *   true in case the document was changed otherwise false.
   */
  hasChanged() {
    return this.changed;
  }

  /**
   * Sets the editors change status
   * @param {boolean} value
   *   if true the editor status is set to changed otherwise unchanged.
   * @returns {undefined}
   */
  setChanged(value) {

    if (this.changed !== value)
      this.send("script-changed", { "name": this.name, "changed": value });

    this.changed = value;
  }

  /**
   * Saves the script.
   * @returns {void}
   */
  async saveScript() {

    this.cm.focus();

    if (this.name === undefined)
      return;

    if (!this.hasChanged())
      return;

    // Get the current script...
    let script = this.cm.getValue();
    // ... and ensure the line endings are sanatized
    script = script.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");

    try {
      await this.send("script-save", { "name": this.name, "script": script });

      this.setChanged(false);
      this.hideErrorMessage();
    } catch (ex) {
      this.showErrorMessage(ex.toString());
    }
  }

  /**
   * Shows an error message.
   *
   * @param {String} message
   *   the error message to show.
   * @returns {void}
   */
  async showErrorMessage(message) {
    let content = await (new SieveTemplateLoader()).load("./editor.save.error.tpl");

    content
      .find(".sieve-editor-error-msg")
      .text(message);

    this.hideErrorMessage();

    $("#sieve-editor-toolbar").append(content);

    content.alert();
  }

  /**
   * Hides/Dismisses any error messages.
   *
   * @returns {void}
   */
  hideErrorMessage() {
    $("#sieve-editor-error").remove();
  }

  /**
   * Cuts the currently selected text.
   * @returns {void}
   */
  async cut() {
    await this.copy();
    this.cm.replaceSelection("");

    this.cm.focus();
  }

  /**
   * Copies the currently selected text.
   * @returns {void}
   */
  async copy() {
    let data = this.cm.getSelection();
    await this.send("copy", data);

    this.cm.focus();
  }

  /**
   * Pastes the clipboard content into the editor.
   * @returns {void}
   */
  async paste() {
    let data = await this.send("paste");
    this.cm.replaceSelection(data);

    this.cm.focus();
  }

  /**
   * Gets the selection begin
   *
   * @param {boolean} isReverse
   *   if true the selection is handled in reverse order.
   *   which means the selection start gets the selections end and vice versa.
   * @returns {int}
   *   the current start position.
   */
  getSelectionStart(isReverse) {

    let start = this.cm.getCursor(true);
    let end = this.cm.getCursor(false);

    if (isReverse) {
      if (start.line < end.line)
        return start;

      if (start.line > end.line)
        return end;

      // start.line == end.line
      if (start.ch > end.ch)
        return end;

      return start;
    }


    if (start.line > end.line)
      return start;

    if (start.line < end.line)
      return end;

    // start.line == end.line
    if (start.ch > end.ch)
      return start;

    return end;

  }

  /**
   * Finds the specified token within the editor.
   *
   * @param {String} token
   *   the string to find.
   * @param {boolean} [isCaseSensitive]
   *   if true the search is case sensitive.
   * @param {boolean} [isReverse]
   *   if true the search will be in reverse direction.
   * @returns {boolean}
   *   true in case the the string was found otherwise false.
   */
  find(token, isCaseSensitive, isReverse) {

    // Fix optional parameters...
    if (typeof (isCaseSensitive) === "undefined" || isCaseSensitive === null)
      isCaseSensitive = false;

    if (typeof (isReverse) === "undefined" || isReverse === null)
      isReverse = false;

    let cursor = this.cm.getSearchCursor(
      token,
      this.getSelectionStart(isReverse),
      !isCaseSensitive);

    if (!cursor.find(isReverse)) {
      // warp search at top or bottom
      cursor = this.cm.getSearchCursor(
        token,
        isReverse ? { line: this.cm.lineCount() - 1 } : { line: 0, ch: 0 },
        !isCaseSensitive);

      if (!cursor.find(isReverse))
        return false;
    }

    if (isReverse)
      this.cm.setSelection(cursor.from(), cursor.to());
    else
      this.cm.setSelection(cursor.to(), cursor.from());

    this.cm.scrollIntoView(cursor.to(), 200);

    return true;
  }

  /**
   * Checks if the specified token is selected.
   *
   * @param {String} token
   *   the token
   * @param {Boolean} isCaseSensitive
   *   true in case the check should be case insensitive.
   * @returns {boolean}
   *   true in case the token was found otherwise false.
   */
  isSelected(token, isCaseSensitive) {
    let selection = this.cm.getSelection();

    if (isCaseSensitive) {
      selection = selection.toLowerCase();
      token = token.toLocaleLowerCase();
    }

    if (selection !== token)
      return false;

    return true;
  }

  /**
   * Replaces the old token with the new token.
   *
   * @param {String} oldToken
   *   the old token which should be replaced
   * @param {String} newToken
   *   the new token
   * @param {boolean} [isCaseSensitive]
   *   if true the search is case sensitive.
   * @param {boolean} [isReverse]
   *   if true the search will be in reverse direction.
   * @returns {boolean}
   *   true if the string was replaced, otherwise false.
   */
  replace(oldToken, newToken, isCaseSensitive, isReverse) {

    // Fix optional parameters...
    if (typeof (isCaseSensitive) === "undefined" || isCaseSensitive === null)
      isCaseSensitive = false;

    if (typeof (isReverse) === "undefined" || isReverse === null)
      isReverse = false;

    if (this.isSelected(oldToken, isCaseSensitive) === false) {
      if (this.find(oldToken, isCaseSensitive, isReverse) === false)
        return false;
    }

    this.cm.replaceSelection(newToken);
    return true;

    // onChange();
  }

}

/**
 * The main entry point...
 * @returns {void}
 */
async function main() {

  let url = new URL(window.location);

  // initialize the editor
  let editor = new SieveEditorUI(url.searchParams.get("account"), "code");

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

  $("#sieve-editor-settings .sieve-editor-disable-syntaxcheck").click(() => {
    editor.enableSyntaxCheck();
  });

  $("#sieve-editor-settings .sieve-editor-enable-syntaxcheck").click(() => {
    editor.disableSyntaxCheck();
  });

  $("#sieve-editor-settings .sieve-editor-import").click(() => {
    editor.importScript();
  });

  $("#sieve-editor-settings .sieve-editor-export").click(() => {
    editor.exportScript();
  });

  editor.enableSyntaxCheck();

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