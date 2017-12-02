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
   * Initializes the editor instance...
   */
  constructor() {
    this.cm = CodeMirror.fromTextArea(document.getElementById("code"), {
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
    $("#sieve-editor-quickreference").click(() => {
      this.openReference();
    });
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

    payload["account"] = this.id;

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
    if (!errors)
      return;

    alert(errors);
  }

  /**
   * Loads a new script into the editor.
   *
   * It will discard the current script including
   * the history and the cursor position.
   *
   * @param {String} id
   *  the accounts unique id
   * @param {String} script
   *   the script which should be loaded
   * @returns {void}
   */
  loadScript(id, script) {
    // Load a new script. It will discard the current script
    // the history and the cursorposition are reset to defaults.

    this.id = id;

    this.cm.setValue(script);
    this.cm.setCursor({ line: 0, ch: 0 });
    this.cm.clearHistory();

    // ensure the active line cursor changed...
    //    onActiveLineChange();
  }


}

/**
 * The main entry point...
 * @returns {void}
 */
async function main() {

  let editor = new SieveEditorUI();

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

    editor.loadScript(m.account, m.script);

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