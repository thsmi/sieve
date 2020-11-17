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

import { SieveLogger } from "./SieveLogger.js";
import { SieveAbstractIpcClient } from "./SieveAbstractIpcClient.js";

/**
 * Implements a IPC based on the postMessage interface.
 */
class SieveIpcClient extends SieveAbstractIpcClient {

  /**
   * @inheritdoc
   */
  static getLogger() {
    return SieveLogger.getInstance();
  }

  /**
   * @inheritdoc
   */
  static parseMessageFromEvent(e) {
    return JSON.parse(e.data);
  }

  /**
   * @inheritdoc
   */
  static dispatch(message, target, origin) {
    if (origin === undefined)
      origin = "*";

    if (target === undefined)
      target = parent;

    if (typeof (message) !== 'string') {
      message = JSON.stringify(message);
    }

    this.getLogger().logIpcMessage(`Sending message ${message}`);

    if (target !== window) {
      target.postMessage(message, origin);
      return;
    }

    for (let idx = 0; idx < frames.length; idx++)
      frames[idx].postMessage(message, origin);
  }

  /**
   * @inheritdoc
   */
  static onMessage(e) {
    if (e.source === window)
      return;

    super.onMessage(e);
  }
}

window.addEventListener("message", (ev) => { SieveIpcClient.onMessage(ev); }, false);

export { SieveIpcClient };

