/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

const DEFAULT_DELAY = 2000;
const DEFAULT_INCREMENT = 20;

const RANDOM_SEED_SIZE = 10;
const HEX_STRING = 16;

/**
 *
 */
class IFrameMutationPoller {

  /**
   *
   * @param {IFrameMutationWatcher} watcher
   * @param {int} [delay]
   */
  constructor(watcher, delay) {

    if ((typeof delay === "undefined") || delay === null)
      delay = DEFAULT_DELAY;

    this.timeout = null;
    this.delay = delay;
    this.watcher = watcher;

    this.id = "siv-"
      + Math.floor(Math.random() * RANDOM_SEED_SIZE).toString(HEX_STRING)
      + Date.now().toString(HEX_STRING);
  }

  /**
   *
   * @returns
   */
  stop() {
    if (!this.timeout)
      return;

    clearTimeout(this.timeout);
    this.timeout = null;
    this.delay = -1;
  }

  /**
   *
   * @returns {HTMLElement}
   */
  async start() {
    if (this.timeout)
      throw new Error("Mutation Poller already running");

    while (await this.wait()) {
      if (!await(this.watcher.hasElement())) {
        console.log(`[${this.id}] Continue waiting for ${this.watcher.getSelector()}`);
        continue;
      }

      console.log(`[${this.id}] Mutation Poller found element`);
      return await (this.watcher.getElement());
    }

    throw new Error(`No elements ${this.watcher.getSelector()} found`);
  }

  /**
   * Check if the poller is currently waiting.
   *
   * @returns {boolean}
   *   true in case the poller is waiting, false if not.
   */
  isWaiting() {
    if (this.delay < 0)
      return false;

    return true;
  }

  /**
   * Decrements the delay by a 20ms wait.
   *
   * @returns {boolean}
   *   false in case there is no more time left to wait.
   */
  async wait() {
    return new Promise((resolve) => {
      this.timeout = setTimeout(() => {
        this.delay -= DEFAULT_INCREMENT;

        if (!this.isWaiting()) {
          this.stop();

          resolve(false);
          return;
        }

        console.log(`Remaining poll time ${this.delay}`);
        resolve(true);
      }, DEFAULT_INCREMENT);
    });
  }
}

/**
 *
 */
class IFrameMutationWatcher {

  /**
   * Create a new iframe mutation watcher instance.
   *
   * @param {string} iframe
   *   the iframe's unique id
   * @param {string} selector
   *   the selector which identifies the element to be watched.
   *  @param {int} index
   *   the element's index in the results returned by the selector.
   */
  constructor(iframe, selector, index) {
    this.iframe = iframe;
    this.selector = selector;
    this.index = index;
  }

  /**
   * Gets the iframe's document. In case it is not ready it will wait until the
   * dom content is loaded.
   *
   * @returns {HTMLDocument}
   *   the iframe's content document
   */
  async getDocument() {

    const doc = document.getElementById(this.iframe).contentDocument;

    if (doc.readyState !== 'loading') {
      return doc;
    }

    return new Promise((resolve) => {
      doc.addEventListener('DOMContentLoaded', async () => {
        resolve( await this.getDocument());
      }, { once: true });
    });
  }

  /**
   * Check if running the query selector return an element at the desired position.
   *
   * @returns {boolean}
   *   true in case the element exists at the given position otherwise false
   */
  async hasElement() {
    const elements = await this.getElements();

    if (elements.length < (this.index + 1))
      return false;

    return true;
  }

  /**
   * Returns all elements which match the query selector.
   *
   * @returns {NodeList}
   *   the list containing all elements which match the query selector.
   */
  async getElements() {
    return (await this.getDocument()).querySelectorAll(this.getSelector());
  }

  /**
   * Returns the the element at the given position in the selector result.
   * It will throw in case the the element does not exits.
   *
   * @returns {HTMLElement}
   *   the desired element
   */
  async getElement() {
    const elms = await this.getElements();

    if (elms.length < (this.index + 1))
      throw new Error(`No elements for ${this.selector}`);

    return elms[this.index];
  }

  /**
   * Waits until the given elements appears or until the delay expires.
   * Whatever happens first.
   *
   * @param {int} delay
   *   the maximal delay in milliseconds.
   *
   * @returns {HTMLElement}
   *   the html element which is returned by the selector at the given position.
   */
  async waitForElement(delay) {

    if (await this.hasElement())
      return await this.getElement();

    console.log(`Starting waiting for Element ${this.selector}`);

    const poller = new IFrameMutationPoller(this, delay);

    try {
      return await poller.start();
    } finally {
      poller.stop();
    }
  }

  /**
   * Returns the watcher's css selector.
   *
   * @returns {string}
   *   the selector for which the watcher is waiting
   */
  getSelector() {
    return this.selector;
  }
}

export { IFrameMutationWatcher };
