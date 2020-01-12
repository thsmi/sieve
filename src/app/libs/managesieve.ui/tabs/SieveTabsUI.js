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

  /**
   * Implements a single tab ui element.
   */
  class SieveTab {

    /**
     * Creates a new instance
     * @param {SieveTabUI} tabs
     *   the parent tab ui object
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

    /**
     * Gets the tab unique id.
     * @returns {string}
     *   the unique tab id.
     */
    getId() {
      return this.getTab().attr("data-sieve-id");
    }

    /**
     * Ensures the tab's content is shown.
     */
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

    /**
     * Closes the tab and removes the tab content frame.
     */
    close() {
      $(`#${this.getId()}-tab`).remove();
      $(`#${this.getId()}-content`).remove();
    }

    /**
     * Checks if the tab has unsaved changes.
     *
     * @returns {boolean}
     *   ture in case of unsaved changes
     */
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

    /**
     * Scrolls the tab bar to the right
     */
    scrollRight() {
      // $('.scroller-left').fadeIn('slow');
      // $('.scroller-right').fadeOut('slow');

      $('.list').animate({ left: "-=100px" }, () => {});
    }

    /**
     * Scrolls the tab bar to the left
     */
    scrollLeft() {
      // $('.scroller-right').fadeIn('slow');
      // $('.scroller-left').fadeOut('slow');

      if ($('.list').position().left >= 0)
        $('.list').animate({ left: "0px" });
      else
        $('.list').animate({ left: "+=100px" });
    }

    /**
     * Initializes the TabUI
     */
    init() {

      // Add event listeners...
      // TODO ensure they get also removed...
      document
        .getElementById("scrollleft")
        .addEventListener("click", () => { this.scrollLeft(); });

      document
        .getElementById("scrollright")
        .addEventListener("click", () => { this.scrollRight(); });
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

    /**
     * Closes the given tab.
     * Tabs are identified by the unique account id plus the script name.
     * @param {string} account
     *   the uniue account id.
     * @param {string} name
     *   the script name.
     */
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

    /**
     * Creates a unique id
     * @returns {string}
     *   the unique id
     */
    generateId() {
      return (new SieveUniqueId()).generate();
    }

    /**
     * Creates a new tab for the script.
     * In case the tab exists it will switch to the tab.
     *
     * Tabs are identified by the account id and the script name.
     *
     * @param {string} account
     *   the unique account id
     * @param {string} name
     *   the script name
     */
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

    /**
     * Opens a script in a tab.
     *
     * In case the script is already open it will switch
     * to this tab.
     *
     * Tabs are identified by the account id and the script name.
     *
     * @param {string} account
     *   the account id
     * @param {string} name
     *   the script name
     */
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
