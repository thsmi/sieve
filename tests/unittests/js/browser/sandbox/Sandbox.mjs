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

import { AbstractSandboxedTestFixture } from "./../../common/sandbox/AbstractSandboxedFixture.mjs";

/**
 * The backend for a test fixture running inside an iframe sandbox.
 */
class SandboxedTestFixture extends AbstractSandboxedTestFixture {

  /**
   * @inheritdoc
   */
  constructor() {
    super();

    window.addEventListener("message", (ev) => {
      try {
        this.onMessage(ev.data);
      } catch (ex) {
        console.error(ex);
      }
    });
  }

  /**
   * @inheritdoc
   */
  send(type, data = {}) {

    parent.postMessage(JSON.stringify({
      type: type,
      payload: data
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
        elm.type = "module";

        elm.addEventListener('error', function () {
          // TODO return the error details.
          reject(new Error("Failed to load script " + script));
        }, true);

        elm.addEventListener("load", () => {
          resolve();
        }, true);

        elm.src = "" + script;
        document.head.append(elm);
      });
    }

  }
}

if (!window.net)
  window.net = {};

if (!window.net.tschmid)
  window.net.tschmid = {};

if (!window.net.tschmid.yautt)
  window.net.tschmid.yautt = {};

if (!window.net.tschmid.yautt.test)
  window.net.tschmid.yautt.test = {};

window.net.tschmid.yautt.test = new SandboxedTestFixture();
