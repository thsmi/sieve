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
  const { SieveTemplateLoader } = require("./../utils/SieveTemplateLoader.js");
  const { SieveIpcClient } = require("./../utils/SieveIpcClient.js");
  const { SieveUniqueId } = require("./../utils/SieveUniqueId.js");

  const { SieveScriptSaveDialog} = require("./../../../ui/dialogs/SieveDialogUI.js");

  class SieveTab {

    /**
     *
     * @param {SieveTabUI} tabs
     * @param {string} account
     *   the accounts name
     * @param {string} name
     *   the script'S name
     */
    constructor(tabs, account, name) {
      this.tabs = tabs;
      this.account = account;
      this.name = name;
    }

    getTab() {
      return $(`#${this.tabs.tabId} [data-sieve-account='${this.account}'][data-sieve-name='${this.name}']`);
    }

    getId() {
      return this.getTab().attr("data-sieve-id");
    }

    show() {
      this.getTab().find(".nav-link").tab('show');

      // On Tab show is not fired when the tab is already visible.
      // so we need to emulate this. In worst case we endup with a
      // duplicated shown message...
      this.onTabShown();
    }

    /**
     * Returns the iframe associated with this tab
     *
     * @returns {IFrame}
     *   the iframe which hosts the content
     */
    getContent() {
      return $(`#${this.getId()}-content`)[0].contentWindow;
    }

    onTabShown() {
      SieveIpcClient.sendMessage("editor-shown", null, this.getContent());
    }

    async save() {

      if (!await this.hasChanges())
        return true;

      const result = await(new SieveScriptSaveDialog(this.name).show());

      if (SieveScriptSaveDialog.isCanceled(result))
        return false;

      if (SieveScriptSaveDialog.isAccepted(result))
        await SieveIpcClient.sendMessage("editor-save", null, this.getContent());

      return true;
    }

    close() {
      $(`#${this.getId()}-tab`).remove();
      $(`#${this.getId()}-content`).remove();
    }

    async hasChanges() {
      return await SieveIpcClient.sendMessage("editor-hasChanged", null, this.getContent());
    }

  }

  class SieveTabUI {

    constructor(id) {
      if (id === null || id === undefined)
        id = "myTab";

      this.tabId = id;
    }

    getTab(account, name) {
      const tab = new SieveTab(this, account, name);

      if (tab.getTab().length === 0)
        return null;

      return tab;
    }


    setChanged(account, name, changed) {

      const tab = this.getTab(account, name).getTab().find(".close");

      if (changed) {
        tab.text("•");
        return;
      }

      tab.text("×");
    }


    /**
     * Checks if a tab for the given script exits.
     *
     * @param {string} account
     *   the accounts unique id.
     * @param {string} name
     *   the script name
     *
     * @returns {boolean}
     *   true in case the tab exits otherwise false.
     */
    has(account, name) {
      return (this.getTab(account, name) !== null);
    }

    onTabShown(account, name) {
      this.getTab(account, name).onTabShown();
    }

    async close(account, name) {

      const tab = this.getTab(account, name);

      if (!tab)
        return;

      if (!await tab.save(account, name)) {
        tab.show();
        return;
      }

      tab.close();
      $("#accounts-tab").find(".nav-link").tab('show');
    }

    generateId() {
      return (new SieveUniqueId()).generate();
    }

    async create(account, name) {

      if (this.has(account, name)) {
        this.open(account, name);
        return;
      }

      // Create a random id.
      const id = this.generateId();

      const tabId = `${id}-tab`;
      const contentId = `${id}-content`;

      // create a new tab.
      const content = await (new SieveTemplateLoader()).load("./libs/managesieve.ui/tabs/editor.content.tpl");
      const tab = await (new SieveTemplateLoader()).load("./libs/managesieve.ui/tabs/editor.tab.tpl");

      tab.find(".nav-link")
        .attr("href", `#${contentId}`);

      tab
        .find(".siv-tab-name")
        .text(name);

      tab
        .find(".close")
        .click(async () => {
          await this.close(account, name);
        });

      content.attr("id", contentId);
      tab.attr("id", tabId);
      tab.attr("data-sieve-account", account);
      tab.attr("data-sieve-name", name);
      tab.attr("data-sieve-id", id);

      // Update the iframe's url.
      const url = new URL(content.attr("src"), window.location);

      url.searchParams.append("account", account);
      url.searchParams.append("script", name);

      content.attr("src", url.toString());

      $(`#${this.tabId}Content`).append(content);
      $(`#${this.tabId}`).append(tab);

      tab.on('shown.bs.tab', () => { this.onTabShown(account, name); });

      this.getTab(account, name).show();
    }

    async open(account, name) {

      const tab = this.getTab(account, name);

      if (this.tab) {
        tab.show();
        return;
      }

      await this.create(account, name);
    }

  }

  if (typeof (module) !== "undefined" && module !== null && module.exports)
    module.exports.SieveTabUI = SieveTabUI;
  else
    exports.SieveTabUI = SieveTabUI;

})(this);
