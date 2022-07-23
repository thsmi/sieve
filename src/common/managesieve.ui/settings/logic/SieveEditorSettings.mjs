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

const DEFAULT_TAB_WIDTH = 2;
const DEFAULT_INDENTATION = "  ";

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

    if (name === "tabulator-width")
      return await this.pref.getInteger("editor.tabulator-width", DEFAULT_TAB_WIDTH);

    if (name === "indentation-unit")
      return await this.pref.getString("editor.indentation-unit", DEFAULT_INDENTATION);

    if (name === "syntax-check")
      return await this.pref.getBoolean("editor.syntax-check", true);

    throw new Error(`Unknown settings ${name}`);
  }
}

export { SieveEditorSettings };
