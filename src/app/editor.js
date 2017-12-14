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

/* global CodeMirror */
/* global SieveIpcClient */

/**
 * Implemets an abstract wrapper around code mirror.
 */
class SieveEditorUI {

  /**
   * Initializes the editor instance.
   * It requires a textbox which will be converted into a code mirror input.
   *
   * @param {String} [id]
   *   An optional id, which points to a the textboxe, which will be converted
   *   into a code mirror input. In case it is ommited the id "code" will be used.
   */
  constructor(id) {

    if (typeof(id) === "undefined" ||id === null)
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
    this.cm.refresh();

    this.timeout = null;
  }

  /**
   * Undos the last input
   * @returns {void}
   */
  undo() {
    this.cm.undo();
  }

  /**
   * Redos the last input
   * @returns {void}
   */
  redo() {
    this.cm.redo();
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
    this.sendMessage("reference-open");
    //Todo send a message to the parent windows iframe do not have a node integration.
    //require("electron").shell.openExternal('https://thsmi.github.io/sieve-reference/en/index.html');
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
    // reset the timer...
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    // TODO check if compile is deactivated...
    this.timeout = setTimeout(() => { this.checkScript(); }, 500);
  }

  /**
   * Checks the current script for syntax errors
   * @returns {void}
   */
  async checkScript() {
    // Get the current script...
    let script = this.cm.getValue();

    // ... and ensure the line endings are sanatized
    script = script.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");

    let errors = await this.send("script-check", script);


    // TODO show and errors in UI
    if (!errors) {
      $("#sivServerError").hide();
      return;
    }

    $("#sivServerError").empty().text(errors).show();
  }

  /**
   * Loads a new script into the editor.
   *
   * It will discard the current script including
   * the history and the cursor position.
   *
   * @param {String} id
   *  the accounts unique id
   * @param {String} name
   *   the script which should be loaded
   * @returns {void}
   */
  async loadScript(account, name) {
    // Load a new script. It will discard the current script
    // the history and the cursorposition are reset to defaults.

    this.account = account;
    this.name = name;

    let script = await this.send("script-get", name);

    this.cm.setValue(script);
    this.cm.setCursor({ line: 0, ch: 0 });
    this.cm.clearHistory();
    this.cm.refresh();

    // ensure the active line cursor changed...
    //    onActiveLineChange();
  }


  /**
   * Saves the script.
   * @returns {void}
   */
  async saveScript() {

    if (this.name === undefined)
      throw new Error("No script loaded");

    // Get the current script...
    let script = this.cm.getValue();
    // ... and ensure the line endings are sanatized
    script = script.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g,"\r\n");

    await this.send("script-save", { "name" : this.name, "script" : script });
  }

}

/**
 * The main entry point...
 * @returns {void}
 */
async function main() {

  // initialize the editor
  let editor = new SieveEditorUI("code");

  $("#sieve-editor-quickreference").click(() => {
    editor.openReference();
  });

  $("#sieve-editor-save").click(()=> {
    editor.saveScript();
  });

  $("#sieve-editor-undo").click(() => {
    editor.undo();
  });

  $("#sieve-editor-redo").click(() => {
    editor.redo();
  });

  // then load the script.
  // The account and the script name is embedded into the url.
  let url = new URL(window.location);

  editor.loadScript(
    url.searchParams.get("account"),
    url.searchParams.get("script"));

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



/*CodeMirror.on(window, "resize", function() {
  document.body.getElementsByClassName("CodeMirror-fullscreen")[0]
    .CodeMirror.getWrapperElement().style.height = winHeight() + "px";
});*/



//hlLine = editor.addLineClass(0, "background", "activeline");

//editor.on("cursorActivity", function() { onActiveLineChange(); });
//editor.on("change", function() { onChange(); });