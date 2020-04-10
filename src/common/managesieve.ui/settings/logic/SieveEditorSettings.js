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

  const DEFAULT_TAB_POLICY = true;
  const DEFAULT_TAB_WIDTH = 2;
  const DEFAULT_INDENTATION_POLICY = false;
  const DEFAULT_INDENTATION_WIDTH = 2;

  /**
   * Manages the sieve editor settings.
   */
  class SieveEditorSettings {

    /**
     * Create a new instance.
     *
     * @param {SievePrefManager} pref
     *   the pref manager to be used for this editor settings.
     */
    constructor(pref) {
      this.pref = pref;
    }

    /**
     * Sets an editor setting.
     *
     * @param {string} name
     *   the preference name
     * @param {object} value
     *   the preference value
     */
    async setValue(name, value) {
      await this.pref.setValue(`editor.${name}`, value);
    }

    /**
     * Gets an editor settings.
     *
     * @param {string} name
     *   the preference name
     * @returns {object}
     *   the editor settings value.
     */
    async getValue(name) {

      if (name === "tabulator-policy")
        return await this.pref.getBoolean("editor.tabulator-policy", DEFAULT_TAB_POLICY);

      if (name === "tabulator-width")
        return await this.pref.getInteger("editor.tabulator-width", DEFAULT_TAB_WIDTH);

      if (name === "indentation-policy")
        return await this.pref.getBoolean("editor.indentation-policy", DEFAULT_INDENTATION_POLICY);

      if (name === "indentation-width")
        return await this.pref.getInteger("editor.indentation-width", DEFAULT_INDENTATION_WIDTH);

      if (name === "syntax-check")
        return await this.pref.getBoolean("editor.syntax-check", true);

      throw new Error(`Unknown settings ${name}`);
    }
  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveEditorSettings = SieveEditorSettings;
  else
    exports.SieveEditorSettings = SieveEditorSettings;

})(this);
