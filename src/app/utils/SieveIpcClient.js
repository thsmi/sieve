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

  let listeners = {};

  /**
   * The on message handler which receives the parent IPC messages.
   * @param {Event} e
   *   the event
   *
   */
  function onMessage(e) {
    if (e.source === window)
      return;

    let m = JSON.parse(e.data);

    Object.keys(listeners).forEach((id) => {
      listeners[id](m);
    });

    console.log("On Callback");
  }

  window.addEventListener("message", onMessage, false);

  /**
   * A class
   */
  class SieveIpcClient {

    /**
     * Generates a unique id
     * @returns {string}
     *   a unique id
     */
    static generateId() {
      return "" + (new Date()).getTime().toString(36) + "-" + Math.random().toString(36).substr(2, 16);
    }

    /**
     * Waits for a response from the IPC Server.
     * @param {string} id
     *   the response's unique id.
     * @returns {Promise<Object>} the response from the IPC Server
     */
    static async receiveMessage(id) {
      return await new Promise((resolve, reject) => {

        let listener = function (m) {
          if (id !== m.id)
            return;

          delete listeners[id];

          if (m.error) {
            reject(m.error);
            return;
          }

          resolve(m.payload);
        };

        listeners[id] = listener;
      });
    }

    /**
     * Sends a message to the Ipc Server.
     * @param {string} action
     *   the actions unique identifier
     * @param {Object} payload
     *   the data which should be send
     * @returns {Promise<Object>}
     *   the response from the IPC server
     */
    static async sendMessage(action, payload) {

      let id = this.generateId();

      let msg = {};
      msg.id = id;
      msg.action = action;
      msg.payload = payload;

      msg = JSON.stringify(msg);

      parent.postMessage(msg, "*");

      return await this.receiveMessage(id);
    }
  }

  // Require modules need to use export.module
  if (typeof(module) !== "undefined" && module && module.exports)
    module.exports.SieveIpcClient = SieveIpcClient;
  else
    exports.SieveIpcClient = SieveIpcClient;

})(this);

