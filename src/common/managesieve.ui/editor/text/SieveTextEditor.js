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
  /* global SieveTemplateLoader */
  /* global SieveAbstractEditorUI */

  const COMPILE_DELAY = 500;

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

    async renderSettings() {


      const loader = new SieveTemplateLoader();

      // Syntax Checks
      $("#sieve-content-settings")
        .append(await loader.load("./editor/text/editor.settings.syntax.tpl"));

      $("#sieve-editor-settings-synatxcheck").click(async () => {

        if ($("#sieve-editor-settings-synatxcheck").prop("checked"))
          await this.enableSyntaxCheck();
        else
          await this.disableSyntaxCheck();
      });

      $("#sieve-editor-settings-synatxcheck").prop( "checked", this.isSyntaxCheckEnabled());

      // Indentation
      $("#sieve-content-settings")
        .append(await loader.load("./editor/text/editor.settings.indentation.tpl"));

      // Indentation width...
      $("#editor-settings-indentation-width").change(async () => {
        await this.setIndentWidth($("#editor-settings-indentation-width").val());
      });

      $("#editor-settings-indentation-width").val(this.getIndentWidth());

      // Indentation policy...
      $("#editor-settings-indentation-policy-spaces").on('click', async () => {
        await this.setIndentWithTabs(false);
      });

      $("#editor-settings-indentation-policy-tabs").on('click', async () => {
        await this.setIndentWithTabs(true);
      });

      if (this.getIndentWithTabs())
        $("#editor-settings-indentation-policy-tabs").button('toggle');
      else
        $("#editor-settings-indentation-policy-spaces").button('toggle');

      // Tabulator width...
      $("#editor-settings-tabulator-width").change(async () => {
        await this.setTabWidth($("#editor-settings-tabulator-width").val());
      });
      $("#editor-settings-tabulator-width").val(this.getTabWidth());

    }

    /**
     * @inheritdoc
     */
    async render() {

      const loader = new SieveTemplateLoader();

      $("#sieve-plaintext-editor").empty()
        .append(await loader.load("./editor/text/editor.plaintext.tpl"));

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

      $("#sieve-editor-undo").click(() => {
        this.undo();
      });

      $("#sieve-editor-redo").click(() => {
        this.redo();
      });

      $("#sieve-editor-cut").click(() => {
        this.cut();
      });

      $("#sieve-editor-copy").click(() => {
        this.copy();
      });

      $("#sieve-editor-paste").click(() => {
        this.paste();
      });

      $("#sieve-editor-find").click(() => {
        const token = $("#sieve-editor-txt-find").val();

        const isReverse = $("#sieve-editor-backward").prop("checked");
        const isCaseSensitive = $("#sieve-editor-casesensitive").prop("checked");

        this.find(token, isCaseSensitive, isReverse);
      });

      $("#sieve-editor-replace").click(() => {
        const oldToken = $("#sieve-editor-txt-find").val();
        const newToken = $("#sieve-editor-txt-replace").val();

        const isReverse = $("#sieve-editor-backward").prop("checked");
        const isCaseSensitive = $("#sieve-editor-casesensitive").prop("checked");

        if (oldToken === "")
          return;

        this.replace(oldToken, newToken, isCaseSensitive, isReverse);
      });


      $("#sieve-editor-replace-replace").click(() => {
        $("#sieve-editor-find-toolbar").toggle();
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
     * Undos the last input
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

      this.cm.scrollIntoView(cursor.to(), 200);

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

      $("#sieve-editor-settings .sieve-editor-disable-syntaxcheck").show();
      $("#sieve-editor-settings .sieve-editor-enable-syntaxcheck").hide();

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
      $("#sieve-editor-msg")
        .show();
      $("#sieve-editor-msg .sieve-editor-msg-details")
        .empty().text(errors);
    }

    /**
     * Hides the syntax errors.
     */
    hideSyntaxErrors() {
      $("#sieve-editor-msg").hide();
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
