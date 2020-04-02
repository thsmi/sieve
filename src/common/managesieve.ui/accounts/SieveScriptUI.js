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

  /* global $ */
  /* global SieveTemplateLoader */

  "use strict";

  const HEX = 16;
  const HEX_OFFSET = -2;

  /**
   * An UI elements which handles displaying details for a sieve script.
   * It does not provide any support for editing the scripts content.
   */
  class SieveScriptUI {

    /**
     * Creates a new instance
     * @param {SieveAccount} account
     *   the account UI element which owns this script
     * @param {string} name
     *   the scripts name
     * @param {boolean} active
     *   indicates if the script should be rendered as active.
     */
    constructor(account, name, active) {
      this.name = name;
      this.isActive = active;
      this.account = account;
    }

    /**
     * Returns a unique id for this script.
     * It is the account id concatenated to the script name in hex.
     *
     * @returns {string}
     *   the unique id which identifies this element..
     */
    getId() {
      // Convert the name into hex to escape dangerous characters.
      let str = "";
      for (let i = 0; i < this.name.length; i++)
        str += ("0" + this.name.charCodeAt(i).toString(HEX)).slice(HEX_OFFSET);

      return `${this.account.id}-${str}`;
    }


    /**
     * Renders the UI element into the dom.
     */
    async render() {

      const id = this.getId();

      let item = $(`#siv-script-${id}`);
      // Check if the element exists...
      if (item.length === 0) {

        item = await (new SieveTemplateLoader()).load("./accounts/SieveScriptUI.tpl");

        item.attr("id", `siv-script-${id}`);

        $(`#siv-account-${this.account.id} .siv-tpl-scripts`).append(item);

        $(item).find(".sieve-list-script-name").text(this.name);

        $(item).find(".sieve-script-rename").click(() => { this.rename(); });
        $(item).find(".sieve-script-delete").click(() => { this.remove(); });
        $(item).find(".sieve-script-edit").click(() => { this.edit(); });
        $(item).find(".sieve-script-activate").click(() => { this.activate(); });
        $(item).find(".sieve-script-deactivate").click(() => { this.deactivate(); });
      }

      item.prop("active", this.isActive);

      if (this.isActive === false) {
        $(`#siv-script-${id} .sieve-list-script-active`).addClass("invisible");
        $(`#siv-script-${id} .sieve-script-activate`).removeClass("d-none");
        $(`#siv-script-${id} .sieve-script-deactivate`).addClass("d-none");
      }
      else {
        $(`#siv-script-${id} .sieve-list-script-active`).removeClass("invisible");
        $(`#siv-script-${id} .sieve-script-activate`).addClass("d-none");
        $(`#siv-script-${id} .sieve-script-deactivate`).removeClass("d-none");
      }
    }

    /**
     * Renames the script.
     * A prompt will be show which ask the user about the new name
     */
    async rename() {

      const rv = await this.account.send("script-rename", this.name);
      if (rv === true)
        this.account.render();
    }

    /**
     * Removes the script
     * A verification prompt will be shown before the script is deleted
     */
    async remove() {
      const rv = await this.account.send("script-delete", this.name);
      if (rv === true)
        await this.account.render();
    }

    /**
     * Open the script in a new tab. In order to edit it.
     */
    async edit() {
      await this.account.send("script-edit", this.name);
    }

    /**
     * Marks the script as active.
     */
    async activate() {
      await this.account.send("script-activate", this.name);
      await this.account.render();
    }

    /**
     * Marks the script as in active.
     */
    async deactivate() {
      await this.account.send("script-deactivate", this.name);
      await this.account.render();
    }

  }


  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports = SieveScriptUI;
  else
    exports.SieveScriptUI = SieveScriptUI;

})(this);
