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

  /**
   * An abstract and generic sieve editor interface .
   */
  class SieveAbstractEditorUI {

    /**
     * Creates a new text editor UI.
     *
     * @param {SieveEditorController} controller
     *   The controller which is assigne to this editor.
     */
    constructor(controller) {
      this.controller = controller;
      this.changed = false;
    }

    getController() {
      return this.controller;
    }

    async render() {
    }

    /**
     * Sets the editor's content.
     * @abstract
     *
     * @param {string} script
     *   the script
     */
    async setScript(script) {
      throw new Error(`Implement setScript(${script})`);
    }

    /**
     * Gets the editor's content.
     * @abstract
     *
     * @returns {string}
     *   the current script as string.
     */
    getScript() {
      throw new Error("Implement getScript()");
    }

    /**
     * Saves the script.
     */
    async save() {
      await this.controller.save();
    }

    /**
     * Focuses the editor's text area
     */
    focus() {
    }

    /**
     * Clears the editors
     */
    clearHistory() {
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
     */
    setChanged(value) {

      if (this.changed !== value)
        this.controller.onChanged(value);

      this.changed = value;
    }

    async loadDefaultSettings() {
    }

    async saveDefaultSettings() {
    }

  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAbstractEditorUI = SieveAbstractEditorUI;
  else
    exports.SieveAbstractEditorUI = SieveAbstractEditorUI;

})(this);
