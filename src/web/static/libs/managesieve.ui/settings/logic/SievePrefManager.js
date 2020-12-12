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
class SieveWebSocketPrefManager extends SieveAbstractPrefManager {

  /**
   * @inheritdoc
   */
  async getValue(key) {

    key = `${this.getNamespace()}.${key}`;
    return await (window.localStorage.getItem(key));
  }

  /**
   * @inheritdoc
   */
  async setValue(key, value) {

    key = `${this.getNamespace()}.${key}`;
    await (window.localStorage.setItem(key, value));
    return this;
  }
}

export { SieveWebSocketPrefManager as SievePrefManager };
