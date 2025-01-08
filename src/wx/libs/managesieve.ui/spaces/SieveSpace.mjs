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

/* global browser */

const FIRST_ENTRY = 0;

const URL_SIEVE_ACCOUNT = "./libs/managesieve.ui/accounts.html";
const URL_SIEVE_EDITOR = "./libs/managesieve.ui/editor.html";
const URL_SIEVE_BASE = "./libs/managesieve.ui/*";

/**
 * Implement a custom space in thunderbird for sieve.
 */
class SieveSpace {

  /**
   * Gets tabs by their url, the url can contain wildcards.
   *
   * @param {string} url
   *   the url patten which should be usd to search for matching tabs.
   * @returns {Tabs[]}
   *   a list containing all tabs which match the url pattern.
   */
  async getTabsByUrl(url) {
    return await browser.tabs.query({ url: url });
  }

  /**
   * Checks if any sieve tabs are visible.
   *
   * @returns {boolean}
   *   true in case tabs are visible otherwise false.
   */
  async hasTabs() {
    const url = new URL(URL_SIEVE_BASE, window.location);

    const tabs = await this.getTabsByUrl(url.toString());

    if (tabs.length)
      return true;

    return false;
  }

  /**
   * Registers an event handler for the tab closed event.
   *
   * @param {Function} callback
   *   the callback to be invoked when a tab is closed.
   */
  addCloseListener(callback) {
    browser.tabs.onRemoved.addListener(callback);
  }

  /**
   * Initializes the UI for the sieve space in thunderbird.
   *
   * @returns {SieveSpace}
   *   a self reference.
   */
  async init() {

    let spaces = await browser.spaces.query({
      isSelfOwned:true,
      name : "sieve"
    });

    if (spaces.length === 0) {

      // browser.runtime.getURL("/spaces/browse.html#add")
      const url = new URL(URL_SIEVE_ACCOUNT, window.location);

      spaces = [await browser.spaces.create(
        "sieve_message_filters",
        url.toString(),
        {
          title: "Sieve Message Filters",
          defaultIcons : "/libs/icons/spaces.svg"
        }
      )];
    }

    this.spaceId = spaces[0].id;

    return this;
  }

  /**
   * Ensures the accounts page is shown.
   */
  async showAccount() {
    await browser.spaces.open(this.spaceId);
  }

  /**
   * Checks if the script editor is visible.
   *
   * @param {string} account
   *   the script's account.
   * @param {string} script
   *   the script's unique name.
   * @returns {boolean}
   *   true in case the script is shown otherwise false.
   */
  async hasEditor(account, script) {
    const url = new URL(URL_SIEVE_EDITOR, window.location);

    url.searchParams.append("account", account);
    url.searchParams.append("script", script);

    const tabs = await this.getTabsByUrl(url.toString());

    if (tabs.length)
      return true;

    return false;
  }

  /**
   * Ensures the script editor is visible.
   *
   * @param {string} account
   *   the script's account.
   * @param {string} script
   *   the script's unique name.
   */
  async showEditor(account, script) {
    const url = new URL(URL_SIEVE_EDITOR, window.location);

    url.searchParams.append("account", account);
    url.searchParams.append("script", script);

    const tabs = await this.getTabsByUrl(url.toString());

    if (!tabs.length) {
      // create a new tab...
      await browser.tabs.create({
        active: true,
        url: url.toString()
      });

      return;
    }

    await browser.tabs.update(
      tabs[FIRST_ENTRY].id,
      { active: true }
    );

    await browser.windows.update(
      tabs[FIRST_ENTRY].windowId,
      { focused: true }
    );

    return;
  }

}

export { SieveSpace };
