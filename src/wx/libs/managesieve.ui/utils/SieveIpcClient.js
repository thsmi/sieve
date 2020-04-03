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

  /* global browser */
  const { SieveLogger } = require("./SieveLogger.js");
  const { SieveAbstractIpcClient } = require("./SieveAbstractIpcClient.js");

  /**
   * An abstract implementation for a inter process/frame communication.
   */
  class SieveWxIpcClient extends SieveAbstractIpcClient {

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
    // eslint-disable-next-line no-unused-vars
    static dispatch(message, target) {

      if (typeof(message) !== 'string') {
        message = JSON.stringify(message);
      }

      browser.runtime.sendMessage(message);
    }
  }

  browser.runtime.onMessage.addListener((request, sender) => {
    SieveWxIpcClient.onMessage({data : request, source: sender});
  });

  // Require modules need to use export.module
  if (typeof(module) !== "undefined" && module && module.exports)
    module.exports.SieveIpcClient = SieveWxIpcClient;
  else
    exports.SieveIpcClient = SieveWxIpcClient;

})(this);
