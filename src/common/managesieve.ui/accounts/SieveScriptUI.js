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

  /* global SieveTemplate */

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

      let elm = document.querySelector(`#siv-script-${id}`);
      // Check if the element exists...
      if (!elm) {

        elm = await (new SieveTemplate()).load("./accounts/SieveScriptUI.tpl");

        elm.id = `siv-script-${id}`;

        document
          .querySelector(`#siv-account-${this.account.id} .siv-tpl-scripts`)
          .appendChild(elm);

        elm.querySelector(".sieve-list-script-name").textContent = this.name;

        elm.querySelector(".sieve-script-rename")
          .addEventListener("click", () => { this.rename(); });
        elm.querySelector(".sieve-script-delete")
          .addEventListener("click", () => { this.remove(); });
        elm.querySelector(".sieve-script-edit")
          .addEventListener("click", () => { this.edit(); });
        elm.querySelector(".sieve-script-activate")
          .addEventListener("click", () => { this.activate(); });
        elm.querySelector(".sieve-script-deactivate")
          .addEventListener("click", () => { this.deactivate(); });
      }

      if (this.isActive === false) {
        elm.querySelector(".sieve-list-script-active").classList.add("d-none");
        elm.querySelector(".sieve-script-activate").classList.remove("d-none");
        elm.querySelector(".sieve-script-deactivate").classList.add("d-none");
      }
      else {
        elm.querySelector(".sieve-list-script-active").classList.remove("d-none");
        elm.querySelector(".sieve-script-activate").classList.add("d-none");
        elm.querySelector(".sieve-script-deactivate").classList.remove("d-none");
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
