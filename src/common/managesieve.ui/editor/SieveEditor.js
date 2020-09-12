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

  /* global bootstrap */
  /* global SieveEditorController */
  /* global SieveTextEditorUI */
  /* global SieveGraphicalEditorUI */
  /* global SieveTemplate */

  const EDITOR_OFFSET_PX = 40;
  /**
   * Implements a editor UI which contains a graphical as well as a text editor.
   */
  class SieveEditorUI extends SieveEditorController {

    /**
     * @inheritdoc
     */
    constructor(name, account) {
      super(name, account);

      this.textEditor = new SieveTextEditorUI(this);
      this.graphicalEditor = new SieveGraphicalEditorUI(this);
      this.checksum = "";
    }

    /**
     * Resizes the widget editors iframe to fill all of the available screen.
     */
    resize() {
      const topOffset = document
        .querySelector("#sieve-widget-editor")
        .getBoundingClientRect()
        .top + document.body.scrollTop;

      const screen = document.documentElement.clientHeight;

      // the visible screen size minus the top and bottom offset
      const size = screen - topOffset - EDITOR_OFFSET_PX;

      document
        .querySelector("#sieve-widget-editor")
        .style.height = `${size}px`;
    }

    /**
     * Moves the input focus to the currently active editor.
     */
    focus() {
      this.getCurrentEditor().focus();
    }

    /**
     * Renders the editor to screen.
     *
     * @returns {SieveEditorUI}
     *   a self reference.
     */
    async render() {

      document.querySelector("#sieve-editor").appendChild(
        await (new SieveTemplate()).load("./editor/editor.tpl"));

      await this.getTextEditor().render();
      await this.getGraphicalEditor().render();

      await this.loadSettings();

      document
        .querySelector("#sieve-editor-settings .sieve-editor-settings-show")
        .addEventListener("click", () => {
          (new bootstrap.Tab(document.querySelector("#sieve-tab-settings"))).show();
        });

      document
        .querySelector("#sieve-editor-settings .sieve-editor-import")
        .addEventListener("click", () => {
          this.importScript();
        });

      document
        .querySelector("#sieve-editor-settings .sieve-editor-export")
        .addEventListener("click", () => {
          this.exportScript();
        });

      document
        .querySelector("#sieve-editor-save")
        .addEventListener("click", async () => {
          document
            .querySelector("#sieve-editor-saving").classList.remove("d-none");

          await this.save();

          document
            .querySelector("#sieve-editor-saving").classList.add("d-none");
        });

      document
        .querySelector('.nav-item > a[href="#sieve-widget-editor"]')
        .addEventListener('show.bs.tab', async (e) => {

          if (!this.isTextEditor())
            return;

          e.preventDefault();

          if (await this.switchToGraphicalEditor()) {
            (new bootstrap.Tab(document.querySelector('.nav-item > a[href="#sieve-widget-editor"]'))).show();
          }
        });

      document
        .querySelector('.nav-item > a[href="#sieve-widget-editor"]')
        .addEventListener('shown.bs.tab', () => {
          this.resize();
        });

      window.addEventListener("resize", () => {
        this.resize();
      });

      document
        .querySelector('.nav-item > a[href="#sieve-plaintext-editor"]')
        .addEventListener('shown.bs.tab', () => { this.switchToTextEditor(); });

      document
        .querySelector('.nav-item > a[href="#sieve-content-settings"]')
        .addEventListener('shown.bs.tab', () => { this.switchToSettings(); });

      return this;
    }

    /**
     * Hides/Dismisses any error messages.
     */
    hideErrorMessage() {
      const elm = document.querySelector("#sieve-editor-error");
      if (elm !== null)
        elm.parentNode.removeChild(elm);
    }

    /**
     * Shows an error message.
     *
     * @param {string} message
     *   the error message to show.
     */
    async showErrorMessage(message) {

      const content = await (new SieveTemplate()).load("./editor/editor.error.save.html");

      content.querySelector(".sieve-editor-error-msg").textContent = message;

      this.hideErrorMessage();

      document.querySelector("#sieve-editor-errors").appendChild(content);

      // eslint-disable-next-line no-new
      new bootstrap.Alert(content);

      this.resize();
    }

    /**
     * Checks if the current editor has unsaved changes
     *
     * @returns {boolean}
     *   true in case the editor contains unsaved changes.
     */
    async hasChanged() {
      return (await this.getCurrentEditor().getChecksum() !== this.checksum);
    }

    /**
     * Loads the sieve script into the editor.
     * All undo history will be flushed.
     *
     * @returns {boolean}
     *   true in case the script could be loaded otherwise false.
     */
    async load() {

      const editor = this.getCurrentEditor();

      await editor.setScript(await this.loadScript());

      this.checksum = await editor.getChecksum();

      editor.clearHistory();
      editor.focus();

      return true;
    }

    /**
     * Saves the sieve script currently loaded into the editor.
     *
     * @returns {boolean}
     *   true in case the script could be saved otherwise false.
     */
    async save() {

      if (!await this.hasChanged())
        return this;

      try {

        const editor = this.getCurrentEditor();

        await this.saveScript(
          await editor.getScript());

        this.checksum = await editor.getChecksum();

        this.hideErrorMessage();
      } catch (ex) {
        this.showErrorMessage(ex.toString());
        return false;
      }

      return true;
    }

    /**
     * Checks the script on the server for syntax errors.
     *
     * @param {string} [script]
     *   the script to check if omitted the current editors
     *   script will be used.
     *
     * @returns {undefined|string}
     *   in case of an script error, the error message
     *   otherwise null
     */
    async checkScript(script) {
      if (script === undefined || script === null)
        script = await this.getCurrentEditor().getScript();

      return await super.checkScript(script);
    }

    /**
     * Imports a sieve script from a file
     */
    async importScript() {

      const script = await super.importScript();

      if (typeof (script) === "undefined")
        return;

      await this.getCurrentEditor().setScript(script);

      // The dialog stole our focus...
      this.getCurrentEditor().focus();
    }

    /**
     * Exports the script to a file
     */
    async exportScript() {
      await super.exportScript(await this.getCurrentEditor().getScript());

      // The dialog stole our focus...
      this.getCurrentEditor().focus();
    }

    /**
     * Switches to the text editor.
     * It transfers the script from the graphical to the text editor.
     *
     *  @returns {boolean}
     *   true in case the editor was changed otherwise false.
     */
    async switchToTextEditor() {

      document.querySelector("#sieve-editor-save").classList.remove("d-none");
      document.querySelector("#sieve-editor-toolbar").classList.remove("d-none");
      document.querySelector("#sieve-plaintext-editor-toolbar").classList.remove("d-none");

      if (this.isTextEditor()) {
        this.getTextEditor().focus();
        return true;
      }

      // We keep the history intact so that undo works.
      // The set script would be just like an edit..
      await this.getTextEditor().setScript(
        await this.getGraphicalEditor().getScript());

      this.isTextEditor(true);

      this.getTextEditor().focus();

      return true;
    }

    /**
     * Switches the graphical editor.
     * It transfers the script from the text editor to the graphical.
     * It is only possible to switch to the graphical editor,
     * when the script is free of syntax errors.
     *
     * @returns {boolean}
     *   true in case the editor was changed otherwise false.
     */
    async switchToGraphicalEditor() {

      document.querySelector("#sieve-editor-save").classList.remove("d-none");
      document.querySelector("#sieve-editor-toolbar").classList.add("d-none");
      document.querySelector("#sieve-plaintext-editor-toolbar").classList.add("d-none");

      if (!this.isTextEditor())
        return true;

      try {
        await this.getGraphicalEditor().setScript(
          await this.getTextEditor().getScript());
      } catch (ex) {
        await this.switchToTextEditor();
        this.showErrorMessage(`Switching to Graphical editor failed ${ex}`);
        return false;
      }

      this.isTextEditor(false);
      return true;
    }

    /**
     * Switches to the settings tab.
     */
    switchToSettings() {
      document.querySelector("#sieve-editor-toolbar").classList.add("d-none");
      document.querySelector("#sieve-editor-save").classList.add("d-none");
    }

    /**
     * Gets the currently active editor type and optionally
     * also sets the editor type.
     *
     * @param {boolean} [value]
     *  optional. If set to true the text editor will be enabled.
     *  Setting it to false will switch to the graphical editor.
     *
     * @returns {boolean}
     *   true in case the text editor is the current editor.
     *   Otherwise false.
     */
    isTextEditor(value) {

      const elm = document.querySelector('.nav-item > a[href="#sieve-widget-editor"]');

      if (value === true || value === false)
        elm.dataset.currentEditor = (!value).toString();

      return !(elm.dataset.currentEditor === "true");
    }

    /**
     * Returns a reference to the currently active editor.
     * Which is either the plain text editor or the rich text editor.
     *
     * @returns {SieveAbstractEditorUI} the currently active editor.
     */
    getCurrentEditor() {
      if (this.isTextEditor())
        return this.getTextEditor();

      return this.getGraphicalEditor();
    }

    /**
     * Returns the plain text editor.
     * Keep in mind the editor might be hidden.
     *
     * @returns {SieveTextEditorUI}
     *   the plain text editor
     */
    getTextEditor() {
      return this.textEditor;
    }

    /**
     * Returns the graphical editor.
     * Keep in mind the editor might be hidden.
     *
     * @returns {SieveGraphicalEditorUI}
     *   the graphical editor
     */
    getGraphicalEditor() {
      return this.graphicalEditor;
    }

    /**
     * Renders the current settings.
     */
    async renderSettings() {

      const parent = document.querySelector("#sieve-content-settings");
      while (parent.firstChild)
        parent.removeChild(parent.firstChild);

      await this.getTextEditor().renderSettings();
      // this.getGraphicalEditor().renderSettings();

      parent.appendChild(
        await (new SieveTemplate()).load("./editor/editor.settings.defaults.tpl"));

      document.querySelector("#editor-settings-save-defaults")
        .addEventListener("click", async () => {
          await this.saveDefaultSettings();
        });

      document.querySelector("#editor-settings-load-defaults")
        .addEventListener("click", async () => {
          await this.loadDefaultSettings();
        });
    }

    /**
     * @inheritdoc
     */
    async loadSettings() {
      await this.getTextEditor().loadSettings();
      await this.getGraphicalEditor().loadSettings();

      await this.renderSettings();
    }

    /**
     * @inheritdoc
     */
    async loadDefaultSettings() {
      await this.getTextEditor().loadDefaultSettings();
      await this.getGraphicalEditor().loadDefaultSettings();

      await this.renderSettings();
    }

    /**
     * @inheritdoc
     */
    async saveDefaultSettings() {
      await this.getTextEditor().saveDefaultSettings();
      await this.getGraphicalEditor().saveDefaultSettings();
    }
  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveEditorUI = SieveEditorUI;
  else
    exports.SieveEditorUI = SieveEditorUI;

})(this);
