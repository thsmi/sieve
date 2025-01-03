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

import { SieveTemplate } from "./../../utils/SieveTemplate.mjs";
import { SieveAbstractEditorUI } from "./../SieveAbstractEditor.mjs";

import {
  EditorView, basicSetup,
  StreamLanguage, sieve,
  Transaction, EditorState, Compartment,
  keymap,
  indentWithTab, indentUnit,
  // Search related
  search, openSearchPanel, closeSearchPanel,
  findNext, findPrevious,
  replaceNext, replaceAll,
  getSearchQuery, setSearchQuery, SearchQuery,
  // History related
  undo, redo, undoDepth
} from "./../../../CodeMirror/codemirror.mjs";

const COMPILE_DELAY = 500;
const DEFAULT_TAB_SIZE = 2;

/**
 * An alternate code mirror search panel implementation.
 */
class SieveSearchPanel {

  /**
   * Creates a new search panel instance.
   * @param {EditorView} view
   *   the editor view to which the panel should ba attached
   */
  constructor(view) {
    this.view = view;

    // A dummy element we don't use it
    this.dom = document.createElement("div");

    this.top = true;
  }

  /**
   * Called after the panel has been added to the editor.
   * Will trigger an lazy async initialization.
   */
  mount() {
    this.onInit();
  }

  /**
   * Called when the panel is removed from the editor.
   */
  destroy() {
    const toolbar = document.querySelector("#sieve-editor-find-toolbar");

    while (toolbar.firstChild)
      toolbar.firstChild.remove();
  }

  /**
   * Called whenever the view was updated
   *
   * @param {ViewUpdate} update
   *   the view update
   */
  update(update) {

    for (const tr of update.transactions) {
      for (const effect of tr.effects) {
        if (effect.is(setSearchQuery) && !effect.value.eq(this.query)) {
          this.query = effect.value;

          document.getElementById("search-find").value = this.query.search;
          document.getElementById("search-case-sensitive").checked = this.query.caseSensitive;
          document.getElementById("search-regex").checked = this.query.regexp;
          document.getElementById("search-replace").value = this.query.replace;
        }
      }
    }
  }

  /**
   * Loads the panel content asynchronously.
   */
  async onInit() {

    const loader = new SieveTemplate();
    const toolbar = document.querySelector("#sieve-editor-find-toolbar");
    toolbar.append(
      await loader.load("./editor/text/editor.plaintext.searchbar.html"));

    // Setup searchbar.
    document
      .querySelector("#sieve-editor-find")
      .addEventListener("change", () => { this.onSearchChanged(); });
    document
      .querySelector("#sieve-editor-find")
      .addEventListener("keyup", (ev) => { this.onFindChanged(ev); });

    document
      .querySelector("#sieve-editor-find-next")
      .addEventListener("click", () => { findNext(this.view); });

    document
      .querySelector("#sieve-editor-find-prev")
      .addEventListener("click", () => { findPrevious(this.view); });


    document
      .querySelector("#sieve-editor-replace")
      .addEventListener("change", () => { this.onSearchChanged(); });
    document
      .querySelector("#sieve-editor-replace")
      .addEventListener("keyup", (ev) => { this.onReplaceChanged(ev); });

    document
      .querySelector("#sieve-editor-replace-next")
      .addEventListener("click", () => { replaceNext(this.view); });

    document
      .querySelector("#sieve-editor-replace-all")
      .addEventListener("click", () => { replaceAll(this.view); });


    document
      .querySelector("#sieve-editor-case-sensitive")
      .addEventListener("click", () => { this.onSearchChanged(); });

    document
      .querySelector("#sieve-editor-regex")
      .addEventListener("click", () => { this.onSearchChanged(); });

    document
      .querySelector("#sieve-editor-find").focus();
  }

  /**
   * Called whenever the search ui changed.
   *
   * Reads the settings from the ui and updates the query object.
   */
  onSearchChanged() {
    const query = new SearchQuery({
      search : document.querySelector("#sieve-editor-find").value,
      replace : document.querySelector("#sieve-editor-replace").value,
      caseSensitive : document.getElementById("sieve-editor-case-sensitive").checked,
      regexp : document.getElementById("sieve-editor-regex").checked
    });

    if (this.query && query.eq(this.query))
      return;

    this.query = query;
    this.view.dispatch({effects: setSearchQuery.of(query)});
  }

  /**
   * Called whenever the find text box is changed.
   *
   * @param {Event} ev
   *   the dom event which caused this callback
   */
  onFindChanged(ev) {
    this.onSearchChanged();

    if (ev.key !== "Enter")
      return;

    ev.preventDefault();

    if (ev.shiftKey)
      findPrevious(this.view);
    else
      findNext(this.view);
  }

  /**
   * Called whenever the replace text box is called
   *
   * @param {Event} ev
   *   the dom event which caused this callback
   */
  onReplaceChanged(ev) {

    if (ev.key !== "Enter")
      return;

    ev.preventDefault();
    replaceNext(this.view);
  }

}

/**
 * An text editor ui for sieve scripts.
 */
class SieveTextEditorUI extends SieveAbstractEditorUI {

  /**
   * Creates a new text editor UI.
   *
   * @param {SieveEditorController} controller
   *   The controller which is assigned to this editor.
   * @param {string} [parent]
   *   An optional selector which point to the parent element which should host
   *   the editor view.  In case it is omitted the id "#code" will be used.
   */
  constructor(controller, parent) {

    super(controller);

    if (typeof (parent) === "undefined" || parent === null)
      this.parent = "#sieve-plaintext-editor";

    this.syntaxCheckEnabled = false;
    this.timeout = null;

    this.editor = null;
  }

  /**
   * Renders the text editors settings
   */
  async renderSettings() {

    const loader = new SieveTemplate();

    // Syntax Checks
    document
      .querySelector("#sieve-content-settings")
      .append(await loader.load("./editor/text/editor.settings.syntax.html"));

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
      .append(await loader.load("./editor/text/editor.settings.indentation.html"));

    // Indentation width...
    document
      .querySelector("#editor-settings-indentation-width")
      .addEventListener("change", async () => { this.onIndentationChanged(); });

    document.querySelector("#editor-settings-indentation-width")
      .value = this.getIndentationUnit().length;

    // Indentation policy...
    document
      .querySelector("#editor-settings-indentation-policy-spaces")
      .addEventListener("change", async () => { this.onIndentationChanged(); });

    document
      .querySelector("#editor-settings-indentation-policy-tabs")
      .addEventListener("change", async () => { this.onIndentationChanged(); });

    if (this.getIndentationUnit().startsWith("\t"))
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
   * Initializes the CodeMirror instance this can be done exactly once.
   * Subsequent calls to this method will be silently ignored.
   */
  initializeEditor() {

    if (typeof(this.editor) !== "undefined" && this.editor !== null)
      return;

    this.tabSize = new Compartment();
    this.indentUnit = new Compartment();

    this.theme = new Compartment();

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const darkTheme = EditorView.theme({}, {dark:true});
    const lightTheme = EditorView.theme({}, {dark:false});

    const cursorScrollMargin = EditorState.transactionExtender.of((tr) => {
      return {
        effects: EditorView.scrollIntoView(tr.newSelection.main, {
          y: "center"
        })
      };
    });

    const state = EditorState.create({
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        StreamLanguage.define(sieve),
        this.indentUnit.of(indentUnit.of("  ")),
        this.tabSize.of(EditorState.tabSize.of(DEFAULT_TAB_SIZE)),
        search({ createPanel: (view) => { return this.onInitSearch(view); } }),
        EditorView.updateListener.of((v) => { this.onStateChanged(v); }),
        this.theme.of(isDark ? darkTheme : lightTheme),
        cursorScrollMargin
      ]
    });

    this.editor = new EditorView({
      state,
      parent : document.querySelector(this.parent)
    });

    this.query = getSearchQuery(this.editor.state);
  }

  /**
   * Called when the search window should be initialized and shown.
   * @param {EditorView} view
   *   the view which caused this callback
   * @returns {SearchPanel}
   *   a search panel instance.
   */
  onInitSearch(view) {
    return new SieveSearchPanel(view);
  }

  /**
   * Called by codemirror in case of status changes.
   * @param {EditorView} view
   *   the code mirror view which caused this callback.
   */
  onStateChanged(view) {
    if (view.docChanged) {
      this.onChanged();
    }
  }

  /**
   * Renders the toolbar items
   */
  async renderToolbar() {
    const loader = new SieveTemplate();
    const toolbar = document.querySelector("#sieve-editor-toolbar");
    toolbar.append(
      await loader.load("./editor/text/editor.plaintext.toolbar.html"));

    // Setup the toolbar
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
      .querySelector("#sieve-editor-reference")
      .addEventListener("click", () => {
        const url = loader.getI18n().getString("texteditor.reference.url");
        this.getController().openUrl(url);
      });

    document
      .querySelector("#sieve-editor-searchbar")
      .addEventListener("click", () => { this.onToggleSearchbar(); });
  }

  /**
   * Toggles the search bar visibility.
   *
   * In case the searchbar is shown, the focus is moved into the search field.
   * When it is close it is moved back to the editor.
   */
  onToggleSearchbar() {
    if (document.querySelector("#sieve-editor-find-toolbar").childElementCount === 0) {
      openSearchPanel(this.editor);
      return;
    }

    closeSearchPanel(this.editor);
    this.focus();
  }


  /**
   * @inheritdoc
   */
  async render() {

    this.initializeEditor();
    await this.renderToolbar();
    await this.renderSettings();
  }

  /**
   * Returns the editor change status.
   * It checks codemirror's undo history. In case it exists the document
   * was changed otherwise it assumes it is unchanged.
   *
   * @returns {boolean}
   *   true in case the document was changed otherwise false.
   */
  hasChanged() {
    return (undoDepth(this.editor) > 0);
  }

  /**
   * @inheritdoc
   */
  async setScript(script) {
    // Load a new script. It will discard the current script
    // the cursor position is reset to defaults.

    this.editor.dispatch({
      changes: {
        from: 0,
        to: this.editor.state.doc.length,
        insert: script
      },
      annotations : Transaction.addToHistory.of(false),
      selection: {anchor: 0}
    });
  }

  /**
   * @inheritdoc
   */
  getScript() {

    this.focus();

    const script = this.editor.state.doc.toString();

    // ... and ensure the line endings are sanitized
    // eslint-disable-next-line no-control-regex
    return script.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");
  }

  /**
   * @inheritdoc
   */
  focus() {
    if (this.editor)
      this.editor.focus();
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
    undo(this.editor);
    this.editor.focus();
  }

  /**
   * Redos the last input
   */
  redo() {
    redo(this.editor);
    this.editor.focus();
  }

  /**
   * Cuts the currently selected text.
   */
  async cut() {
    await this.copy();

    this.editor.dispatch(
      this.editor.state.replaceSelection(""));

    this.editor.focus();
  }

  /**
   * Copies the currently selected text.
   */
  async copy() {
    const state = this.editor.state;

    await this.getController().setClipboard(
      state.sliceDoc(state.selection.main.from, state.selection.main.to));

    this.editor.focus();
  }

  /**
   * Pastes the clipboard content into the editor.
   */
  async paste() {

    this.editor.dispatch(
      this.editor.state.replaceSelection(
        await this.getController().getClipboard()));

    this.editor.focus();
  }

  /**
   * On Change callback handler for codemirror
   * Do not invoke unless you know what you are doing.
   */
  onChanged() {

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
   * Enables checking for syntax errors
   */
  async enableSyntaxCheck() {
    this.syntaxCheckEnabled = true;
    this.checkScript();

    this.focus();

    await this.getController().setPreference(
      "syntax-check", this.syntaxCheckEnabled);
  }

  /**
   * Disables checking for syntax errors
   */
  async disableSyntaxCheck() {
    this.syntaxCheckEnabled = false;
    this.hideSyntaxErrors();

    this.focus();

    await this.getController().setPreference(
      "syntax-check", this.syntaxCheckEnabled);

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

    // To reduce css layout complexity we have to syntax error boxes.
    // One floating visible to the user and one invisible sticking to tbe
    // very bottom of the page. This ensures the floating box will never
    // overlap with floating one.

    for (const details of msg.querySelectorAll(".sieve-editor-msg-details")) {
      while (details.firstChild)
        details.firstChild.remove();

      details.textContent = errors;
    }
  }

  /**
   * Hides the syntax errors.
   */
  hideSyntaxErrors() {
    document.querySelector("#sieve-editor-msg").style.display = 'none';
  }

  /**
   * Called whenever the indentation strategy is changed.
   *
   * It reads the current settings from the ui and applies them to the editor
   */
  onIndentationChanged() {
    let width = document.querySelector("#editor-settings-indentation-width").value;

    width = Number.parseInt(width, 10);

    if (Number.isNaN(width))
      throw new Error("Invalid Indent width");

    if (document.querySelector("#editor-settings-indentation-policy-tabs").checked){
      this.setIndentationUnit("\t".repeat(width));
      return;
    }

    this.setIndentationUnit(" ".repeat(width));
  }

  /**
   * Sets the indent unit for the editor.
   *
   * The indent unit is defined as a string containing either the amount of
   * spaces or the amount of tabs which should be used for indenting one level.
   *
   * @param {string} unit
   *   a string of spaces or tabs which will be used as reference when indenting
   * @returns {SieveTextEditorUI}
   *   a self reference
   */
  async setIndentationUnit(unit) {


    if (/(^\t*$)|(^ *$)/.test(unit) === false)
      throw new Error(`Invalid indent unit specified, needs to be either spaces or tabs`);

    this.editor.dispatch({
      effects: this.indentUnit.reconfigure(indentUnit.of(unit))
    });

    await this.getController().setPreference("indentation-unit", unit);

    return this;
  }

  /**
   * Returns the string used for indentation.
   *
   * @returns {string}
   *   a string of spaces or tab characters used as reference when indenting
   */
  getIndentationUnit() {
    return this.indentUnit.get(this.editor.state).value;
  }

  /**
   * A Tab is a single character with a multi character width. Before rendering
   * their real width needs to be specified and calculated. This is done by
   * specifying the amount of spaces which are equivalent to a tab.
   *
   * Changing the tab width does not change any data. It just defines how tabs
   * are rendered.
   *
   * @param {int} size
   *   the tabulator width in equivalent space characters.
   * @returns {SieveEditorUI}
   *   a self reference
   */
  async setTabWidth(size) {

    size = Number.parseInt(size, 10);

    if (Number.isNaN(size))
      throw new Error(`Invalid Tab width ${size}`);

    this.editor.dispatch({
      effects: this.tabSize.reconfigure(EditorState.tabSize.of(size))
    });

    await this.getController().setPreference("tabulator-width", size);

    return this;
  }

  /**
   * Gets the current tab with in equivalent space characters.
   *
   * @returns {int}
   *   the tabulator width in as number of characters.
   */
  getTabWidth() {
    return this.editor.state.tabSize;
  }

  /**
   * @inheritdoc
   */
  async loadSettings() {

    await this.setTabWidth(
      await this.getController().getPreference("tabulator-width"));
    await this.setIndentationUnit(
      await this.getController().getPreference("indentation-unit"));

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

    await this.setTabWidth(
      await this.getController().getDefaultPreference("tabulator-width"));
    await this.setIndentationUnit(
      await this.getController().getDefaultPreference("indentation-unit"));

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
    await this.getController().setDefaultPreference("indentation-unit", this.getIndentationUnit());

    await this.getController().setDefaultPreference("syntax-check", this.isSyntaxCheckEnabled());
  }

}

export { SieveTextEditorUI };
