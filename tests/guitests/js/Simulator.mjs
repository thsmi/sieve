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

import { IFrameMutationWatcher } from "./IFrameMutationWatcher.mjs";

const NO_THROTTLE = -1;
const DEFAULT_WAIT_TIME = 1000;
const DEFAULT_CLICK_DELAY = 250;

/**
 * Simulates ui events like click as well as drag and drop events for the
 * sieve ui.
 */
class EventSimulator {

  /**
   * Creates a new event simulator for the given iframe.
   *
   * @param {string} id
   *   the iframe's unique id.
   * @param {int} [throttle]
   *   the delay by which the execution should be throttled.
   */
  constructor(id, throttle) {
    this.id = id;

    if ((typeof(throttle) === "undefined") || (throttle === null))
      this.throttleDelay = NO_THROTTLE;

    if (!document.getElementById(this.id))
      throw new Error(`Invalid element ${id}`);
  }

  /**
   * Specifies how much delay should be between subsequent calls.
   *
   * @param {int} throttle
   *   the amount of ms to wait between subsequent commands.
   * @returns {EventSimulator}
   *   a self reference
   */
  setThrottle(throttle) {
    this.throttleDelay = throttle;
    return this;
  }

  /**
   * Enables or disables dropbox highlighting
   *
   * @param {boolean} state
   *   true in case highlighting should be enabled otherwise false.
   * @returns {EventSimulator}
   *   a self Reference
   */
  setHighlightDropBox(state) {
    this.highlightDropBox = state;
    return this;
  }

  /**
   * Loads the given url into the simulator.
   * A random value will be appended to the url to ensure the page gets reloaded.
   * @async
   *
   * @param {string} url
   *   the url to be loaded.
   *
   * @returns {EventSimulator}
   *   a self reference
   */
  async load(url) {

    const iframe = document.getElementById(this.id);

    return new Promise((resolve) => {

      document.getElementById(this.id).addEventListener("load", () => {

        if (this.getDocument().readyState !== 'loading') {
          resolve(this);
          return;
        }

        document.addEventListener('DOMContentLoaded', () => {
          resolve(this); }, { once: true });

      }, { once: true });

      iframe.src = `${url}?${Math.random()}`;
    });
  }

  /**
   * Unloads the iframe.
   * @async
   *
   * @returns {EventSimulator}
   *   a self reference
   */
  async unload() {
    document.getElementById(this.id).src = "about:blank";
    return this;
  }

  /**
   * Waits for the given amount of time
   * @async
   *
   * @param {int} milliseconds
   *   the delay in milliseconds.
   * @returns {EventSimulator}
   *   a self reference
   */
  async wait(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this);
      }, milliseconds);
    });
  }

  /**
   * In case throttle is defined it will wait for the given amount.
   * In case it is not defined it does nothing.
   * @async
   *
   * @returns {EventSimulator}
   *   a self reference
   */
  async throttle() {
    if (this.throttleDelay === NO_THROTTLE)
      return this;

    await this.wait(this.throttleDelay);

    return this;
  }

  /**
   * Initializes the graphical editor.
   * @async
   *
   * @param {string} [script]
   *   the optional script with should be used to initialize.
   * @returns {EventSimulator}
   *   a self reference
   */
  async init(script) {
    if ((typeof(script) === "undefined") || script === null)
      script = "";

    (await this.waitForElement("#txtScript")).value = script;
    (await this.waitForElement("#txtOutput")).value = "";

    await this.click(await this.waitForElement("#DebugParse"));

    if (this.highlightDropBox) {
      const style = this.getDocument().createElement("style");
      this.getDocument().head.appendChild(style);

      style.sheet.insertRule("div.sivDropBox.sivBlockSpacer { border: 1px solid red; }");
      style.sheet.insertRule("div.sivDropBox.sivConditionSpacer { border: 1px solid green; }");
    }

    return this;
  }

  /**
   * Simulates a click on the given element.
   * @async
   *
   * @param {HTMLElement} target
   *   the element which should be clicked
   * @param {int} [delay]
   *   the time to wait before the click.
   * @returns {EventSimulator}
   *   a self reference
   */
  async click(target, delay) {

    if ((typeof delay === "undefined") || (delay === null))
      delay = DEFAULT_CLICK_DELAY;

    await this.wait(delay);
    target.click();

    return this;
  }

  /**
   * Simulates a drag and drop between the source and target element.
   * @async
   *
   * @param {string  |HTMLElement} source
   *   the unique id of the element where the drag operation starts
   * @param {string | HTMLElement} target
   *   the unique id of the element where the drag operation ends
   * @param {*} meta
   *   tbe meta information which is exchanged during the drag.
   * @returns {EventSimulator}
   *   a self reference
   */
  async dragAndDrop(source, target, meta) {

    if (typeof source === 'string' || source instanceof String)
      source = await this.waitForElement(source);

    const flavour = source.dataset.sieveFlavour;

    const dt = this.createDataTransfer(flavour, meta);

    await this.dragStart(source, dt);

    if (typeof target === 'string' || target instanceof String)
      target = await this.waitForElement(target);

    this.assertDataUndefined(target, "sieveDragging");

    await this.dragEnter(target, dt);

    this.assertData(target, "sieveDragging", "true");

    await this.dragOver(target, dt);

    this.assertData(target, "sieveDragging", "true");

    await this.drop(target, dt);

    this.assertDataUndefined(target, "sieveDragging");

    await this.dragEnd(source);

    return this;
  }


  /**
   * Simulates a drag and drop where the target element rejects the drop.
   * @async
   *
   * @param {string} source
   *   the unique id of the element where the drag operation starts
   * @param {string} target
   *   the unique id of the element where the drag operation ends
   * @param {*} meta
   *   tbe meta information which is exchanged during the drag.
   * @returns {EventSimulator}
   *   a self reference
   */
  async dragAndReject(source, target, meta) {

    if (typeof source === 'string' || source instanceof String)
      source = await this.waitForElement(source);

    const flavour = source.dataset.sieveFlavour;

    const dt = this.createDataTransfer(flavour, meta);

    await this.dragStart(source, dt);

    if (typeof target === 'string' || target instanceof String)
      target = await this.waitForElement(target);

    this.assertDataUndefined(target, "sieveDragging");

    await this.dragEnter(target, dt);

    this.assertData(target, "sieveDragging", undefined);

    return this;
  }


  /**
   * Simulates an aborted drag operation between two elements.
   * @async
   *
   * @param {string | HTMLElement} source
   *   the element where the drag starts
   * @param {string | HTMLElement} target
   *   the target element where the drag should stop but is aborted.
   * @param {*} meta
   *   the drag operation's meta information
   * @returns {EventSimulator}
   *   a self reference
   */
  async dragAndAbort(source, target, meta) {

    if (typeof source === 'string' || source instanceof String)
      source = await this.waitForElement(source);

    const flavour = source.dataset.sieveFlavour;

    const dt = this.createDataTransfer(flavour, meta);

    await this.dragStart(source, dt);

    if (typeof target === 'string' || target instanceof String)
      target = await this.waitForElement(target);

    this.assertDataUndefined(target, "sieveDragging");

    await this.dragEnter(target, dt);

    this.assertData(target, "sieveDragging", "true");

    await this.dragOver(target, dt);

    this.assertData(target, "sieveDragging", "true");

    await this.dragLeave(target, dt);

    this.assertDataUndefined(target, "sieveDragging");

    await this.dragEnd(source);

    return this;
  }

  /**
   * Simulates a drop event.
   * @async
   *
   * @param {HTMLElement} target
   *   the target element to which the event is dispatched.
   * @param {DataTransfer} [dt]
   *   the data transfer object.
   * @returns {EventSimulator}
   *   a self reference
   */
  async drop(target, dt) {
    await this.dispatchDragAndDropEvent(target, "drop", dt);
    return this;
  }

  /**
   * Simulates a drag start event.
   * @async
   *
   * @param {HTMLElement} target
   *   the target element to which the event is dispatched.
   * @param {DataTransfer} [dt]
   *   the data transfer object.
   * @returns {EventSimulator}
   *   a self reference
   */
  async dragStart(target, dt) {
    await this.dispatchDragAndDropEvent(target, "dragstart", dt);
    return this;
  }

  /**
   * Simulates a drag end event.
   *
   * @param {HTMLElement} target
   *   the target element to which the event is dispatched.
   * @returns {EventSimulator}
   *   a self reference
   */
  async dragEnd(target) {
    await this.dispatchDragAndDropEvent(target, "dragend");
    return this;
  }

  /**
   * Simulates a drag enter event.
   *
   * @param {HTMLElement} target
   *   the target element to which the event is dispatched.
   * @param {DataTransfer} [dt]
   *   the data transfer object.
   * @returns {EventSimulator}
   *   a self reference
   */
  async dragEnter(target, dt) {
    await this.dispatchDragAndDropEvent(target, "dragenter", dt);
    return this;
  }

  /**
   * Simulates a drag over event.
   *
   * @param {HTMLElement} target
   *   the target element to which the event is dispatched.
   * @param {DataTransfer} [dt]
   *   the data transfer object.
   * @returns {EventSimulator}
   *   a self reference
   */
  async dragOver(target, dt) {
    await this.dispatchDragAndDropEvent(target, "dragover", dt);
    return this;
  }

  /**
   * Simulates a drag leave event.
   *
   * @param {HTMLElement} target
   *   the target element to which the event is dispatched.
   * @param {DataTransfer} [dt]
   *   the data transfer object.
   * @returns {EventSimulator}
   *   a self reference
   */
  async dragLeave(target, dt) {
    await this.dispatchDragAndDropEvent(target, "dragleave", dt);
    return this;
  }

  /**
   * Creates a new data transfer object
   *
   * @param {string} flavour
   *   the format of the data transfer object.
   * @param {*} meta
   *   the meta data to be transferred via the data transfer object.
   *
   * @returns {DataTransfer}
   *   the data transfer object.
   **/
  createDataTransfer(flavour, meta) {
    const dt = new DataTransfer();

    if ((typeof meta !== "undefined") && (meta !== null))
      dt.setData(flavour, JSON.stringify(meta));

    return dt;
  }

  /**
   * Simulates a drag and drop element.
   *
   * @param {HTMLElement} target
   *   the target element to which the event is dispatched.
   * @param {string} type
   *   the HTML Events name e.g. "dragover", "dragleave"
   * @param {DataTransfer} [dt]
   *   the optional data transfer object to be passed
   * @returns {EventSimulator}
   *   a self reference
   */
  async dispatchDragAndDropEvent(target, type, dt) {

    try {

      // FIXME: do we have the scenario where we have a
      // dragevent without a dt???
      if (typeof (dt) === "undefined" || dt === null) {
        target.dispatchEvent(new DragEvent(type));
        return this;
      }

      target.dispatchEvent(
        new DragEvent(type, { dataTransfer: dt }));

    } finally {
      await this.throttle();
    }

    return this;
  }

  /**
   * Returns the iframe's document
   *
   * @returns {HTMLDocument}
   *   the iframe's document
   */
  getDocument() {
    return document.getElementById(this.id).contentDocument;
  }

  /**
   * Queries the iframe for the given query selector.
   *
   * In case the element does not yet exist it registers an observer.
   * Upon each mutation it rechecks for the given id and returns in case the
   * element exists.
   *
   * It blocks for at most the given delay before giving up, stopping the observer
   * and throwing an exception.
   *
   * @param {string} selector
   *   the selector
   * @param {int} [delay]
   *   the maximal delay in milliseconds, defaults to 200 if omitted.
   * @returns {HTMLElement}
   *   the element
   */
  async waitForElement(selector, delay) {
    return await this.waitForNthElement(selector, 0, delay);
  }

  /**
   * Queries the iframe for the given query selector and returns the nth result.
   *
   * In case the element does not yes exist it registers an observer.
   * And regularly rechecks if the document was changed and the element exists.
   *
   * Means it blocks for at most the given delay before giving up and throwing
   * and exception.
   *
   * @param {string} selector
   *   the selector.
   * @param {int} index
   *   specifies which of the selector results to return.
   * @param {int} [delay]
   *   the maximal delay in milliseconds, defaults to 200 if omitted.
   * @returns {HTMLElement}
   *   the element.
   */
  async waitForNthElement(selector, index, delay) {
    if ((typeof (delay) === "undefined") || (delay === null))
      delay = DEFAULT_WAIT_TIME;

    return await (new IFrameMutationWatcher(this.id, selector, index)).waitForElement(delay);
  }

  /**
   * Verifies that the data set of the given element has an entry with the given value.
   * It throws an exception in case the verification fails.
   *
   * @param {HTMLElement} element
   *   the element to be checked.
   * @param {string} entry
   *   the data set entry.
   * @param {*} value
   *   the expected value.
   */
  assertData(element, entry, value) {
    if (element.dataset[entry] === value)
      return;

    throw new Error(`Expected Dataset ${entry} expected to be ${value} but got ${element.dataset[entry]}`);
  }

  /**
   * Verifies that the data set of the given element is null.
   * It throws in case the element is not null.
   *
   * @param {HTMLElement} element
   *   the element to be checked.
   * @param {string} entry
   *   the data set entry.
   */
  assertDataNull(element, entry) {
    this.assertData(element, entry, null);
  }

  /**
   * Verifies that the data set if the given element is undefined.
   * It throws in case the element is not undefined.
   *
   * @param {HTMLElement} element
   *   the element to be checked.
   * @param {string} entry
   *   the data set entry.
   */
  assertDataUndefined(element, entry) {
    this.assertData(element, entry, undefined);
  }

  /**
   * Verifies that the current sieve script equals the given expectation.
   *
   * @param {string} expectation
   *   the expected sieve string.
   */
  async assertScript(expectation) {
    // Reset the output box...
    (await this.waitForElement("#txtOutput")).value = "";

    // Request the script content.
    await this.click(await this.waitForElement("#DebugStringify"));
    let script = (await this.waitForElement("#txtOutput")).value;

    // Cleanup the script as well as the expectation.

    // eslint-disable-next-line no-control-regex
    script = script.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");
    // eslint-disable-next-line no-control-regex
    expectation = expectation.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");

    if (script === expectation)
      return;

    throw new Error(`Expected sieve script to be ${expectation} but got ${script}`);
  }

  /**
   * Checks if the given element contains at least one of the given children
   *
   * @param {HTMLElement} parent
   *   the parent html element
   * @param {string|NodeList} children
   *   the child or the child selector.
   */
  async assertIsChild(parent, children) {

    if (typeof children === 'string' || children instanceof String)
      children = await this.waitForElement(children);

    if (children.length === undefined)
      children = [children];

    for (const child of children)
      if (parent.contains(child))
        return;

    throw new Error(`Parent expected to contain child`);
  }

  /**
   * Verifies that the iframe returns exactly n elements for the given selector.
   * It not it will throw.
   *
   * @param {string} selector
   *   the selector which should be checked.
   * @param {int} expected
   *   number of expected elements
   */
  async assertNElements(selector, expected) {

    const doc = document.getElementById(this.id).contentDocument;

    if (doc.readyState === 'loading')
      throw new Error(`Expected ${expected} item for ${selector} but got 0`);

    const actual = doc.querySelectorAll(selector).length;

    if (actual !== expected)
      throw new Error(`Expected ${expected} item for ${selector} but got ${actual}`);

    return;
  }
}

export { EventSimulator };
