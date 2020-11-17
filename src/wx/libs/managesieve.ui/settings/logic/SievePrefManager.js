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
import { SieveAbstractPrefManager } from "./SieveAbstractPrefManager.js";

/**
 * Manages preferences.
 * It uses the WebExtension's local storage interface
 */
class SieveMozPrefManager extends SieveAbstractPrefManager {

  /**
   * @inheritdoc
   */
  async getValue(key) {
    key = `${this.getNamespace()}.${key}`;

    const pair = await browser.storage.local.get(key);

    if (pair[key] === undefined)
      return undefined;

    return pair[key];
  }

  /**
   * @inheritdoc
   */
  async setValue(key, value) {

    const item = {};
    item[`${this.getNamespace()}.${key}`] = value;

    await browser.storage.local.set(item);
    return this;
  }
}


export { SieveMozPrefManager as SievePrefManager };
