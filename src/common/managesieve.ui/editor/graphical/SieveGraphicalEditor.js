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

  /* global SieveAbstractEditorUI */

  // FIXME should use an IPC instead of talking directly to the iframe...

  /**
   *
   */
  class SieveGraphicalEditorUI extends SieveAbstractEditorUI {

    /**
     * Creates a new graphical editor UI.
     *
     * @param {SieveEditorController} controller
     *   The controller which is assigned to this editor.
     */
    constructor(controller) {
      super(controller);
      this.id = "sieve-widget-editor";
    }

    /**
     * @inheritdoc
     */
    async render() {
    }

    /**
     * @inheritdoc
     */
    async setScript(script) {

      const capabilities = await this.getController().getCapabilities();
      // set script content...
      document.getElementById(this.id)
        .contentWindow
        .setSieveScript(script, JSON.stringify(capabilities.extensions));
    }

    /**
     * @inheritdoc
     */
    getScript() {
      return document.getElementById(this.id)
        .contentWindow
        .getSieveScript();
    }
  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveGraphicalEditorUI = SieveGraphicalEditorUI;
  else
    exports.SieveGraphicalEditorUI = SieveGraphicalEditorUI;

})(this);
