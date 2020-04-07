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

  const HEX = 16;
  const HEX_LENGTH = 2;

  /**
   * An abstract and generic sieve editor interface .
   */
  class SieveAbstractEditorUI {

    /**
     * Creates a new text editor UI.
     *
     * @param {SieveEditorController} controller
     *   the controller which is assigned to this editor.
     */
    constructor(controller) {
      this.controller = controller;
    }

    /**
     * The controller implements an editors external interfaces and actions.
     * It is typically shared between editors.
     *
     * @returns {SieveEditorController}
     *   the  controller which assigned to this editor.
     */
    getController() {
      return this.controller;
    }

    /**
     * Renders the current editor.
     * @abstract
     */
    async render() {
    }

    /**
     * Sets the editor's content.
     * @abstract
     *
     * @param {string} script
     *   the script
     */
    // eslint-disable-next-line require-await
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
     * Calculate the checksum for the current context script.
     *
     *  @returns {string}
     *   the content scripts sha256 checksum.
     */
    async getChecksum() {

      const digest = await crypto.subtle.digest('SHA-256',
        new TextEncoder().encode(await this.getScript()));

      return Array.from(new Uint8Array(digest)).map(
        (b) => { return b.toString(HEX).padStart(HEX_LENGTH, '0'); }).join('');
    }

    /**
     * Loads the editors settings.
     */
    async loadSettings() {
    }

    /**
     * Resets the editor to default settings
     */
    async loadDefaultSettings() {
    }

    /**
     * Save the current settings as default.
     */
    async saveDefaultSettings() {
    }

  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAbstractEditorUI = SieveAbstractEditorUI;
  else
    exports.SieveAbstractEditorUI = SieveAbstractEditorUI;

})(this);
