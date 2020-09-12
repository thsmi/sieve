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

  /* global CodeMirror */
  /* global SieveTemplate */
  /* global SieveAbstractEditorUI */

  const COMPILE_DELAY = 500;
  const EDITOR_SCROLL_INTO_VIEW_OFFSET = 200;

  /**
   * An text editor ui for sieve scripts.
   */
  class SieveTextEditorUI extends SieveAbstractEditorUI {

    /**
     * Creates a new text editor UI.
     *
     * @param {SieveEditorController} controller
     *   The controller which is assigned to this editor.
     * @param {string} [id]
     *   An optional id, which points to a the textbox, which will be converted
     *   into a code mirror input. In case it is omitted the id "code" will be used.
     */
    constructor(controller, id) {

      super(controller);

      if (typeof (id) === "undefined" || id === null)
        this.id = "code";

      this.syntaxCheckEnabled = false;
      this.timeout = null;

      this.cm = null;

      this.activeLine = null;

      this.changed = false;
    }

    /**
     * Renders the text editors settings
     */
    async renderSettings() {


      const loader = new SieveTemplate();

      // Syntax Checks
      document
        .querySelector("#sieve-content-settings")
        .appendChild(await loader.load("./editor/text/editor.settings.syntax.tpl"));

      document
        .querySelector("#sieve-editor-settings-synatxcheck")
        .addEventListener("click", async () => {

          if (document.querySelector("#sieve-editor-settings-synatxcheck").checked === true)
            await this.enableSyntaxCheck();
          else
            await this.disableSyntaxCheck();
        });

      document.querySelector("#sieve-editor-settings-synatxcheck")
        .checked = this.isSyntaxCheckEnabled();

      // Indentation
      document
        .querySelector("#sieve-content-settings")
        .appendChild(await loader.load("./editor/text/editor.settings.indentation.tpl"));

      // Indentation width...
      document
        .querySelector("#editor-settings-indentation-width")
        .addEventListener("change", async () => {
          await this.setIndentWidth(
            document.querySelector("#editor-settings-indentation-width").value);
        });

      document.querySelector("#editor-settings-indentation-width")
        .value = this.getIndentWidth();

      // Indentation policy...
      document
        .querySelector("#editor-settings-indentation-policy-spaces")
        .addEventListener("change", async () => { await this.setIndentWithTabs(false); });

      document
        .querySelector("#editor-settings-indentation-policy-tabs")
        .addEventListener("change", async () => { await this.setIndentWithTabs(true); });

      if (this.getIndentWithTabs())
        document.querySelector("#editor-settings-indentation-policy-tabs").checked = true;
      else
        document.querySelector("#editor-settings-indentation-policy-spaces").checked = true;

      // Tabulator width...
      document
        .querySelector("#editor-settings-tabulator-width")
        .addEventListener("change", async () => {
          await this.setTabWidth(
            document.querySelector("#editor-settings-tabulator-width").value);
        });

      document.querySelector("#editor-settings-tabulator-width")
        .value = this.getTabWidth();
    }

    /**
     * @inheritdoc
     */
    async render() {

      const loader = new SieveTemplate();

      const editor = document.querySelector("#sieve-plaintext-editor");
      while (editor.firstChild)
        editor.removeChild(editor.firstChild);

      editor.appendChild(
        await loader.load("./editor/text/editor.plaintext.html"));

      this.cm = CodeMirror.fromTextArea(document.getElementById(this.id), {
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

      // Configure tab handling...
      this.cm.setOption("extraKeys", {
        "Tab": function (cm) {

          if (cm.somethingSelected()) {
            const sel = cm.getSelection("\n");
            // Indent only if there are multiple lines selected, or if the selection spans a full line
            if (sel.length > 0 && (sel.indexOf("\n") > -1 || sel.length === cm.getLine(cm.getCursor().line).length)) {
              cm.indentSelection("add");
              return;
            }
          }

          if (cm.options.indentWithTabs)
            cm.execCommand("insertTab");
          else
            cm.execCommand("insertSoftTab");
        },
        "Shift-Tab": function (cm) {
          cm.indentSelection("subtract");
        }
      });

      const toolbar = document.querySelector("#sieve-editor-toolbar");
      toolbar.appendChild(
        await loader.load("./editor/text/editor.plaintext.toolbar.html"));

      document
        .querySelector("#sieve-editor-undo")
        .addEventListener("click", () => { this.undo(); });

      document
        .querySelector("#sieve-editor-redo")
        .addEventListener("click", () => { this.redo(); });

      document
        .querySelector("#sieve-editor-cut")
        .addEventListener("click", () => { this.cut(); });

      document
        .querySelector("#sieve-editor-copy")
        .addEventListener("click", () => { this.copy(); });

      document
        .querySelector("#sieve-editor-paste")
        .addEventListener("click", () => { this.paste(); });

      document
        .querySelector("#sieve-editor-find")
        .addEventListener("click", () => {
          const token = document.querySelector("#sieve-editor-txt-find").value;

          const isReverse = document.querySelector("#sieve-editor-backward").checked;
          const isCaseSensitive = document.querySelector("#sieve-editor-casesensitive").checked;

          this.find(token, isCaseSensitive, isReverse);
        });

      document
        .querySelector("#sieve-editor-replace")
        .addEventListener("click", () => {
          const oldToken = document.querySelector("#sieve-editor-txt-find").value;
          const newToken = document.querySelector("#sieve-editor-txt-replace").value;

          const isReverse = document.querySelector("#sieve-editor-backward").checked;
          const isCaseSensitive = document.querySelector("#sieve-editor-casesensitive").checked;

          if (oldToken === "")
            return;

          this.replace(oldToken, newToken, isCaseSensitive, isReverse);
        });


      document
        .querySelector("#sieve-editor-replace-replace")
        .addEventListener("click", () => {
          document.querySelector("#sieve-editor-find-toolbar").classList.toggle("d-none");
        });

      await this.renderSettings();
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
     * @inheritdoc
     */
    async setScript(script) {
      // Load a new script. It will discard the current script
      // the cursor position is reset to defaults.

      this.cm.setValue(script);
      this.cm.setCursor({ line: 0, ch: 0 });

      this.cm.refresh();

      // ensure the active line cursor changed...
      //    onActiveLineChange();
    }

    /**
     * @inheritdoc
     */
    getScript() {

      this.focus();

      const script = this.cm.getValue();

      // ... and ensure the line endings are sanitized
      // eslint-disable-next-line no-control-regex
      return script.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");
    }

    /**
     * @inheritdoc
     */
    focus() {
      if (this.cm)
        this.cm.focus();
    }

    /**
     * @inheritdoc
     */
    clearHistory() {
      this.cm.clearHistory();
    }

    /**
     * Checks the current script for syntax errors
     */
    async checkScript() {

      const errors = await this.getController().checkScript(await this.getScript());

      if (errors && errors !== "")
        this.showSyntaxErrors(errors);
      else
        this.hideSyntaxErrors();
    }

    /**
     * Undoes the last input
     */
    undo() {
      this.cm.undo();
      this.cm.focus();
    }

    /**
     * Redos the last input
     */
    redo() {
      this.cm.redo();
      this.cm.focus();
    }

    /**
     * Cuts the currently selected text.
     */
    async cut() {
      await this.copy();
      this.cm.replaceSelection("");

      this.cm.focus();
    }

    /**
     * Copies the currently selected text.
     */
    async copy() {
      const data = this.cm.getSelection();

      await this.getController().setClipboard(data);

      this.cm.focus();
    }

    /**
     * Pastes the clipboard content into the editor.
     */
    async paste() {
      const data = await this.getController().getClipboard();
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

      const start = this.cm.getCursor(true);
      const end = this.cm.getCursor(false);

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
     * @param {string} token
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

      this.cm.scrollIntoView(cursor.to(), EDITOR_SCROLL_INTO_VIEW_OFFSET);

      return true;
    }

    /**
     * Checks if the specified token is selected.
     *
     * @param {string} token
     *   the token
     * @param {boolean} isCaseSensitive
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
     * @param {string} oldToken
     *   the old token which should be replaced
     * @param {string} newToken
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
     */
    onRenderLine(cm, line, element) {
      const charWidth = this.cm.defaultCharWidth();
      const basePadding = 4;

      const off = CodeMirror.countColumn(line.text, null, cm.getOption("tabSize")) * charWidth;
      element.style.textIndent = "-" + off + "px";
      element.style.paddingLeft = (basePadding + off) + "px";
    }

    /**
     * On Change callback handler for codemirror
     * Do not invoke unless you know what you are doing.
     */
    onChange() {

      if (this.syntaxCheckEnabled === false)
        return;

      // reset the timer...
      if (this.timeout !== null) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }

      this.timeout = setTimeout(() => { this.checkScript(); }, COMPILE_DELAY);
    }

    /**
     * On Active Line Change callback handler for codemirror.
     * Do not invoke unless you know what you are doing.
     */
    onActiveLineChange() {
      const currentLine = this.cm.getLineHandle(this.cm.getCursor().line);

      if (currentLine === this.activeLine)
        return;

      if (this.activeLine)
        this.cm.removeLineClass(this.activeLine, "background", "activeline");

      this.activeLine = this.cm.addLineClass(currentLine, "background", "activeline");
    }

    /**
     * Enables checking for syntax errors
     */
    async enableSyntaxCheck() {
      this.syntaxCheckEnabled = true;
      this.checkScript();

      this.focus();

      await this.getController().setPreference("syntax-check", this.syntaxCheckEnabled);
    }

    /**
     * Disables checking for syntax errors
     */
    async disableSyntaxCheck() {
      this.syntaxCheckEnabled = false;
      this.hideSyntaxErrors();

      this.focus();

      await this.getController().setPreference("syntax-check", this.syntaxCheckEnabled);

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
     * @param {string} errors
     *   the errors which should be displayed
     */
    showSyntaxErrors(errors) {
      const msg = document.querySelector("#sieve-editor-msg");
      msg.style.display = '';

      const details = msg.querySelector(".sieve-editor-msg-details");
      while (details.firstChild)
        details.removeChild(details.firstChild);

      details.textContent = errors;
    }

    /**
     * Hides the syntax errors.
     */
    hideSyntaxErrors() {
      document.querySelector("#sieve-editor-msg").style.display = 'none';
    }

    /**
     * Sets the editors indentation width.
     *
     * @param {int} width
     *   the indentation width in characters
     * @returns {SieveEditorUI}
     *   a self reference
     */
    async setIndentWidth(width) {
      width = parseInt(width, 10);

      if (isNaN(width))
        throw new Error("Invalid Indent width");

      this.cm.setOption("indentUnit", width);
      await this.getController().setPreference("indentation-width", width);

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
    async setIndentWithTabs(useTabs) {
      this.cm.setOption("indentWithTabs", useTabs);

      await this.getController().setPreference("indentation-policy", useTabs);

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
     * Sets the editor's tabulator width and persists the changed value.
     *
     * @param {int} tabSize
     *   the tabulator width in characters
     * @returns {SieveEditorUI}
     *   a self reference
     */
    async setTabWidth(tabSize) {
      tabSize = parseInt(tabSize, 10);

      if (isNaN(tabSize))
        throw new Error(`Invalid Tab width ${tabSize}`);

      this.cm.setOption("tabSize", tabSize);

      await this.getController().setPreference("tabulator-width", tabSize);

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
     * @inheritdoc
     */
    async loadSettings() {
      const tabWidth = await this.getController().getPreference("tabulator-width");
      await this.setTabWidth(tabWidth);

      const IndentWithTabs = await this.getController().getPreference("indentation-policy");
      await this.setIndentWithTabs(IndentWithTabs);

      const indentWidth = await this.getController().getPreference("indentation-width");
      await this.setIndentWidth(indentWidth);

      const syntaxCheck = await this.getController().getPreference("syntax-check");
      if (syntaxCheck === false || syntaxCheck === "false")
        await this.disableSyntaxCheck();
      else
        await this.enableSyntaxCheck();
    }

    /**
     * @inheritdoc
     */
    async loadDefaultSettings() {
      const tabWidth = await this.getController().getDefaultPreference("tabulator-width");
      await this.setTabWidth(tabWidth);

      const IndentWithTabs = await this.getController().getDefaultPreference("indentation-policy");
      await this.setIndentWithTabs(IndentWithTabs);

      const indentWidth = await this.getController().getDefaultPreference("indentation-width");
      await this.setIndentWidth(indentWidth);

      const syntaxCheck = await this.getController().getDefaultPreference("syntax-check");
      if (syntaxCheck === false)
        await this.disableSyntaxCheck();
      else
        await this.enableSyntaxCheck();

      await this.renderSettings();
    }

    /**
     * @inheritdoc
     */
    async saveDefaultSettings() {
      await this.getController().setDefaultPreference("tabulator-width", this.getTabWidth());

      await this.getController().setDefaultPreference("indentation-policy", this.getIndentWithTabs());
      await this.getController().setDefaultPreference("indentation-width", this.getIndentWidth());

      await this.getController().setDefaultPreference("syntax-check", this.isSyntaxCheckEnabled());
    }

  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveTextEditorUI = SieveTextEditorUI;
  else
    exports.SieveTextEditorUI = SieveTextEditorUI;

})(this);
