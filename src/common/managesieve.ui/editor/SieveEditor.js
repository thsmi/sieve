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
  /* global SieveEditorController */
  /* global SieveTextEditorUI */
  /* global SieveGraphicalEditorUI */
  /* global SieveTemplateLoader */

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
     *
     */
    resize() {
      const offset = $("#sieve-widget-editor").offset().top;

      if (offset === 0)
        return;

      $("#sieve-widget-editor").height(
        $(window).height() - offset - 40);
    }

    /**
     * Moves the input focus to the currently active editor.
     */
    focus() {
      this.getCurrentEditor().focus();
    }

    /**
     * Renders the editor to screen.
     */
    async render() {

      await this.getTextEditor().render();
      await this.getGraphicalEditor().render();

      await this.loadSettings();

      $("#sieve-editor-settings .sieve-editor-settings-show").click(() => {
        $("#sieve-tab-settings").tab('show');
      });

      $("#sieve-editor-settings .sieve-editor-import").click(() => {
        this.importScript();
      });

      $("#sieve-editor-settings .sieve-editor-export").click(() => {
        this.exportScript();
      });

      $("#sieve-editor-save").click(() => {
        this.save();
      });

      $('.nav-item > a[href="#sieve-widget-editor"]').on('show.bs.tab', async (e) => {

        if (!this.isTextEditor())
          return;

        e.preventDefault();

        if (await this.switchToGraphicalEditor()) {
          $('.nav-item > a[href="#sieve-widget-editor"]').tab("show");
        }
      });

      $('.nav-item > a[href="#sieve-widget-editor"]').on('shown.bs.tab', () => {
        $("#sieve-widget-editor").height(
          $(window).height() - $("#sieve-widget-editor").offset().top - 40);
      });

      $(window).on("resize", () => {
        this.resize();
      });


      $('.nav-item > a[href="#sieve-plaintext-editor"]').on('shown.bs.tab', () => {
        this.switchToTextEditor();
      });

      return this;
    }

    /**
     * Hides/Dismisses any error messages.
     */
    hideErrorMessage() {
      $("#sieve-editor-error").remove();
    }

    /**
     * Shows an error message.
     *
     * @param {string} message
     *   the error message to show.
     */
    async showErrorMessage(message) {

      const content = await (new SieveTemplateLoader()).load("./editor/editor.error.save.tpl");

      content
        .find(".sieve-editor-error-msg")
        .text(message);

      this.hideErrorMessage();

      $("#sieve-editor-toolbar").append(content);

      content.alert();

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

      if (!this.isTextEditor())
        return true;

      try {
        await this.getGraphicalEditor().setScript(
          await this.getTextEditor().getScript());
      } catch (ex) {
        console.log(ex);
        this.showErrorMessage(`Switching to Graphical editor failed ${ex}`);
        return false;
      }

      this.isTextEditor(false);
      return true;
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

      if (value === true || value === false)
        $('.nav-item > a[href="#sieve-widget-editor"]').attr("data-current-editor", (!value).toString());

      return !($('.nav-item > a[href="#sieve-widget-editor"]').attr("data-current-editor") === "true");
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

      $("#sieve-content-settings").empty();

      await this.getTextEditor().renderSettings();
      // this.getGraphicalEditor().renderSettings();

      const settings = await (new SieveTemplateLoader()).load("./editor/editor.settings.defaults.tpl");

      $("#sieve-content-settings").append(settings);

      $("#editor-settings-save-defaults").click(async () => {
        await this.saveDefaultSettings();
      });

      $("#editor-settings-load-defaults").click(async () => {
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
