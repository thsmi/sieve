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
  const { SieveTemplate } = require("./../utils/SieveTemplate.js");
  const { SieveIpcClient } = require("./../utils/SieveIpcClient.js");
  const { SieveUniqueId } = require("./../utils/SieveUniqueId.js");

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

    /**
     * Gets the current tab. The dom element is used to store meta data.
     *
     * @returns {HTMLElement}
     *   the tab's dom element
     */
    getTab() {
      return document
        .querySelector(`#${this.tabs.tabId} [data-sieve-account='${this.account}'][data-sieve-name='${this.name}']`);
    }

    /**
     * Gets the tab unique id.
     * @returns {string}
     *   the unique tab id.
     */
    getId() {
      return this.getTab().dataset.sieveId;
    }

    /**
     * Ensures the tab's content is shown.
     */
    show() {
      $(this.getTab().querySelector(".nav-link")).tab('show');

      // On Tab show is not fired when the tab is already visible.
      // so we need to emulate this. In worst case we end up with a
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
      return document.querySelector(`#${this.getId()}-content`).contentWindow;
    }

    /**
     * Called whenever the tab got activated and the tab's content was
     * shown to the user.
     */
    onTabShown() {
      SieveIpcClient.sendMessage("editor", "editor-shown", null, this.getContent());
    }

    /**
     * Closes the tab and removes the tab content frame.
     * It may be vetoed, e.g. if an editor contains unsaved changes.
     *
     * @returns {boolean}
     *   true in case the tab could be closed. In case it was canceled false.
     */
    async close() {

      if (await this.hasChanges()) {
        this.show();
        const rv = await SieveIpcClient.sendMessage("editor", "editor-close", this.name, this.getContent());

        // Closing was canceled?
        if (!rv)
          return false;
      }

      // we need to delete first the content...
      const content = document.querySelector(`#${this.getId()}-content`);
      content.parentNode.removeChild(content);

      // and then the tab, otherwise getId fails...
      const tab = document.querySelector(`#${this.getId()}-tab`);
      tab.parentNode.removeChild(tab);

      return true;
    }

    /**
     * Checks if the tab has unsaved changes.
     *
     * @returns {boolean}
     *   true in case of unsaved changes
     */
    async hasChanges() {
      return await SieveIpcClient.sendMessage("editor", "editor-hasChanged", null, this.getContent());
    }

  }

  /**
   * Implements a tab ui.
   */
  class SieveTabUI {

    /**
     * Creates a new instance
     * @param {string} [id]
     *   the tab bars unique id. It is the element which hosts the tabs.
     */
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

      $('.list').animate({ left: "-=100px" }, () => { });
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
      document
        .querySelector("#scrollleft")
        .addEventListener("click", () => { this.scrollLeft(); });

      document
        .querySelector("#scrollright")
        .addEventListener("click", () => { this.scrollRight(); });
    }

    /**
     * Gets the tab by the account name and script name.
     *
     * @param {string} account
     *   the unique account name.
     * @param {string} name
     *   the script name.
     *
     * @returns {SieveTab|null}
     *   the tab or null in case no such tab exists.
     */
    getTab(account, name) {
      const tab = new SieveTab(this, account, name);

      if (!tab.getTab())
        return null;

      return tab;
    }

    /**
     * Checks if a tab for the given script exists.
     *
     * @param {string} account
     *   the accounts unique id.
     * @param {string} name
     *   the script name.
     *
     * @returns {boolean}
     *   true in case the tab exists otherwise false.
     */
    has(account, name) {
      return (this.getTab(account, name) !== null);
    }

    /**
     * Called whenever tab is shown when switching to it.
     *
     * @param {string} account
     *   the unique account id.
     * @param {string} name
     *   the script name.
     */
    onTabShown(account, name) {
      this.getTab(account, name).onTabShown();
    }

    /**
     * Closes the given tab.
     * Tabs are identified by the unique account id plus the script name.
     * @param {string} account
     *   the unique account id.
     * @param {string} name
     *   the script name.
     */
    async close(account, name) {

      const tab = this.getTab(account, name);

      if (!tab)
        return;

      if (!await tab.close()) {
        return;
      }

      $(document.querySelector("#accounts-tab .nav-link")).tab('show');
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
      const content = await (
        new SieveTemplate()).load("./libs/managesieve.ui/tabs/editor.content.tpl");
      const tab = await (
        new SieveTemplate()).load("./libs/managesieve.ui/tabs/editor.tab.tpl");

      tab.querySelector(".nav-link").href = `#${contentId}`;
      tab.querySelector(".siv-tab-name").textContent = name;

      tab.querySelector(".close").addEventListener("click", async () => {
        await this.close(account, name);
      });

      content.id = contentId;
      tab.id = tabId;
      tab.dataset.sieveAccount = account;
      tab.dataset.sieveName = name;
      tab.dataset.sieveId = id;

      // Update the iframe's url.
      const url = new URL(content.src, window.location);

      url.searchParams.append("account", account);
      url.searchParams.append("script", name);

      content.src = url.toString();

      document.querySelector(`#${this.tabId}Content`).appendChild(content);
      document.querySelector(`#${this.tabId}`).appendChild(tab);

      $(tab).on('shown.bs.tab', () => { this.onTabShown(account, name); });

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

      if (tab) {
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
