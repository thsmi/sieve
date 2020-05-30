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

  /* global AbstractSandboxedTestFixture */

  if (!exports.net)
    exports.net = {};

  if (!exports.net.tschmid)
    exports.net.tschmid = {};

  if (!exports.net.tschmid.yautt)
    exports.net.tschmid.yautt = {};

  if (!exports.net.tschmid.yautt.test)
    exports.net.tschmid.yautt.test = {};

  /**
   * The backend for a test fixture running inside an iframe sandbox.
   */
  class SandboxedTestFixture extends AbstractSandboxedTestFixture {

    /**
     * @inheritdoc
     */
    constructor() {
      super();
      window.addEventListener("message", (ev) => { this.onMessage(ev); });
    }

    /**
     * @inheritdoc
     */
    log(message, level) {
      parent.postMessage(JSON.stringify({
        type: "LogSignal",
        message: message,
        level: level
      }), "*");
    }

    /**
     * Loads scripts into the sandbox.
     * @param {string[]} scripts
     *   a string array with urls pointing to the scripts to be loaded.
     */
    async require(scripts) {

      for (const script of scripts) {
        this.logTrace(`Injecting script ${script}...`);

        await new Promise((resolve, reject) => {

          const elm = document.createElement("script");
          elm.type = "text/javascript";

          elm.addEventListener('error', function () {
            // TODO return the error details.
            reject(new Error("Failed to load script " + script));
          }, true);

          elm.addEventListener("load", () => {
            resolve();
          }, true);

          elm.src = "" + script;
          document.head.appendChild(elm);
        });
      }

    }

    /**
     * Dispatches the incoming ipc message to the handler and
     * returns the result.
     *
     * It will also signal exceptions to the sender.
     *
     * @param {string} type
     *   the message type as string
     * @param {Function} handler
     *   the message handler which is used to process the message.
     */
    async dispatchMessage(type, handler) {
      try {
        const result = await handler();

        parent.postMessage(JSON.stringify({
          type: `${type}Resolve`,
          result: result
        }), "*");
      } catch (ex) {

        parent.postMessage(JSON.stringify({
          type: `${type}Reject`,
          message: ex.message,
          stack: ex.stack
        }), "*");
      }
    }

    /**
     * Called when a new ipc message arrives.
     * @param {Event} event
     *   the event for the ipc message
     */
    onMessage(event) {
      const msg = JSON.parse(event.data);

      if (msg.type === "ImportScript") {
        this.dispatchMessage(msg.type, async () => { return await this.require(msg.data); });
        return;
      }

      if (msg.type === "GetTests") {
        this.dispatchMessage(msg.type, async () => { return Array.from(await this.get()); });
        return;
      }

      if (msg.type === "RunTest") {
        this.dispatchMessage(msg.type, async () => { return await this.run(msg.data); });
        return;
      }
    }

  }

  exports.net.tschmid.yautt.test = new SandboxedTestFixture();

})(this);
