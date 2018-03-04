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

(function (exports) {

  "use strict";

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
     * @param {LineHandle} line
     *   the current line
     * @param {Element} element
     *   the dom element which represents the line
     * @returns {void}
     */
    onRenderLine(cm, line, element) {
      let charWidth = this.cm.defaultCharWidth();
      let basePadding = 4;

      let off = CodeMirror.countColumn(line.text, null, cm.getOption("tabSize")) * charWidth;
      element.style.textIndent = "-" + off + "px";
      element.style.paddingLeft = (basePadding + off) + "px";
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
     * Checks if syntax checking is enabled
     * @returns {boolean}
     *   true in case syntax check is enabled otherwise false
     */
    isSyntaxCheckEnabled() {
      return this.syntaxCheckEnabled;
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

      if (typeof (script) === "undefined")
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
      let content = await (new SieveTemplateLoader()).load("./editor.error.save.tpl");

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
      this.setChanged(true);

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
      this.setChanged(true);

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
      this.setChanged(true);

      return true;
    }

    /**
     * Sets the editors indentation width.
     *
     * @param {int} width
     *   the indentation width in characters
     * @returns {SieveEditorUI}
     *   a self reference
     */
    setIndentWidth(width) {
      width = parseInt(width, 10);

      if (isNaN(width))
        throw new Error("Invalid Indent width");

      this.cm.setOption("indentUnit", width);
      return this;
    }

    /**
     * Returns the indentation width.
     *
     * @returns {int}
     *   the indentation width in characters.
     */
    getIndentWidth() {
      return this.cm.getOption("indentUnit");
    }

    /**
     * Sets the indent policy.
     *
     * @param {boolean} useTabs
     *   if true tabs are used for indenting otherwise spaces are used.
     * @returns {SieveEditorUI}
     *   a self reference
     */
    setIndentWithTabs(useTabs) {
      this.cm.setOption("indentWithTabs", useTabs);
      return this;
    }

    /**
     * Returns the indent policy.
     *
     * @returns {boolean}
     *   true in case tabs are used to indent. False if spaces are used.
     */
    getIndentWithTabs() {
      return this.cm.getOption("indentWithTabs");
    }

    /**
     * Sets the editorss tabulator width.
     *
     * @param {int} tabSize
     *   the tabulator width in characters
     * @returns {SieveEditorUI}
     *   a self reference
     */
    setTabWidth(tabSize) {
      tabSize = parseInt(tabSize, 10);

      if (isNaN(tabSize))
        throw new Error("Invalid Tab width");

      this.cm.setOption("tabSize", tabSize);
      return this;
    }

    /**
     * Gets the editor's tabulator width.
     * @returns {int}
     *   the tabulator width in characters.
     */
    getTabWidth() {
      return this.cm.getOption("tabSize");
    }

    /**
     * Defines if and how tabs sould be replaced.
     *
     * @param {boolean} replaceTabs
     *   if true tabs are replaced by spaces, if false tabs are kept as they are.
     * @returns {SieveEditorUI}
     *  a self reference
     */
    setTabPolicy(replaceTabs) {

      if (replaceTabs === false) {
        this.cm.setOption("extraKeys", null);
        /* this.cm.setOption("extraKeys", {
          Tab: (cm) => {
            cm.execCommand("insertTab");
          }
        });*/
        return this;
      }

      // insert spaces instead of tabs
      this.cm.setOption("extraKeys", {
        Tab: (cm) => {
          cm.replaceSelection(
            Array(this.getTabWidth() + 1).join(" "));
        }
      });

      return this;
    }

    /**
     * Retruns the tab replacement policy
     * @returns {boolean}
     *   true in case tabs are replaces with spaces otherwise false.
     */
    getTabPolicy() {
      let policy = this.cm.getOption("extraKeys");

      if (policy === null)
        return false;

      return true;
    }

    /**
     * An internal short cut to sets a preference value.
     *
     * @param {String} name
     *   the preferences unique name.
     * @param {Object} value
     *   the value which should be set.
     * @returns {void}
     */
    async setPreference(name, value) {
      await this.send("set-preference", { "key": name, "value": value });
    }

    /**
     * An internal shortcut to gets a preference value.
     *
     * @param {String} name
     *   the preferences unique name
     * @returns {Object}
     *   the requested value.
     */
    async getPreference(name) {
      return await this.send("get-preference", name);
    }

    /**
     * Resets the editor to default settings
     * @returns {void}
     */
    async loadDefaultSettings() {

      let tabPolicy = await this.getPreference("tabulator-policy");
      this.setTabPolicy(tabPolicy);

      let tabWidth = await this.getPreference("tabulator-width");
      this.setTabWidth(tabWidth);

      let IndentWithTabs = await this.getPreference("indentation-policy");
      this.setIndentWithTabs(IndentWithTabs);

      let indentWidth = await this.getPreference("indentation-width");
      this.setIndentWidth(indentWidth);

      let syntaxCheck = await this.getPreference("syntax-check");
      if (syntaxCheck)
        this.enableSyntaxCheck();
      else
        this.disableSyntaxCheck();
    }

    /**
     * Save the current settings as default.
     * @returns {void}
     */
    async saveDefaultSettings() {
      await this.setPreference("tabulator-policy", this.getTabPolicy());
      await this.setPreference("tabulator-width", this.getTabWidth());

      await this.setPreference("indentation-policy", this.getIndentWithTabs());
      await this.setPreference("indentation-width", this.getIndentWidth());

      await this.setPreference("syntax-check", this.isSyntaxCheckEnabled());
    }
  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveEditorUI = SieveEditorUI;
  else
    exports.SieveEditorUI = SieveEditorUI;

})(this);
